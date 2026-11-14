"""Durable, independently signed one-part invoices for enrolled regtest quotes.

No invoice database entry or preimage. This publisher has no payment/release
authority. Its caller holds authority, credential, then publication locks.
"""
import copy
import json
import os
from pathlib import Path

import bolt11
import bounded_authority as ba
import held_gate as hg
import restore_barrier

FORMAT = 'swap-customer-invoice-v1'
FIELDS = {'pubkey', 'short_channel_id', 'fee_base_msat',
          'fee_proportional_millionths', 'cltv_expiry_delta'}


def hint_scid(row):
    features, aliases = row.get('features'), row.get('alias', {})
    hg.need(type(features) is list and all(type(v) is str for v in features)
            and type(aliases) is dict, 'channel_alias_metadata_invalid')
    if 'option_scid_alias' in features or (row.get('private') is True and aliases.get('remote') is not None):
        value = aliases.get('remote')
    else:
        value = row.get('short_channel_id')
    hg.need(hg.scid(value), 'incoming_hint_unavailable')
    return value


def untrimmed(row, amount):
    fee, dust = row.get('feerate', {}).get('perkw'), row.get('dust_limit_msat')
    features = row.get('features')
    hg.need(hg.integer(fee, 1, 2**32-1) and hg.integer(dust, 0, 2**63-1)
            and type(features) is list and all(type(f) is str for f in features), 'channel_fee_metadata_invalid')
    anchors, deprecated = 'option_anchors' in features, 'option_anchor_outputs' in features
    hg.need(not (anchors and deprecated), 'channel_fee_metadata_invalid')
    weight = 706 if deprecated else 703
    threshold = dust + (0 if anchors else ((weight*fee+999)//1000)*1000)
    return amount > threshold


def validate_hints(hints, quote):
    hg.need(type(hints) is list and 1 <= len(hints) <= len(quote['approved_channels']), 'invoice_hints_invalid')
    seen = set()
    for h in hints:
        hg.need(type(h) is dict and set(h) == FIELDS and hg.scid(h['short_channel_id'])
                and h['pubkey'] in {p['peer_id'] for p in quote['approved_channels']}, 'invoice_hint_outside_grant')
        key = (h['pubkey'], h['short_channel_id'])
        hg.need(key not in seen, 'invoice_hint_duplicate'); seen.add(key)
        hg.need(all(hg.integer(h[k], 0, limit) for k, limit in (
            ('fee_base_msat', 2**32-1), ('fee_proportional_millionths', 2**32-1),
            ('cltv_expiry_delta', 65535))), 'invoice_hint_policy_invalid')
    return hints


class AdmissionError(ValueError):
    def __init__(self, reason, **details):
        super().__init__(reason)
        self.details = details


def select_hints(authority, quote):
    result, failures, minimums = [], set(), []
    amount = quote['amount_msat']
    for pin in quote['approved_channels']:
        row = authority.channel(pin)
        if row.get('peer_connected') is not True or row.get('reestablished') is not True:
            failures.add('incoming_channel_disconnected'); continue
        if row['htlcs'] != []:
            failures.add('incoming_channel_busy'); continue
        if not hg.integer(row.get('receivable_msat'), amount, 2**63-1):
            failures.add('incoming_liquidity_insufficient'); continue
        if not untrimmed(row, amount):
            fee, dust = row['feerate']['perkw'], row['dust_limit_msat']
            features = row['features']
            weight = 706 if 'option_anchor_outputs' in features else 703
            minimums.append(dust + (0 if 'option_anchors' in features else ((weight*fee+999)//1000)*1000) + 1)
            failures.add('incoming_amount_below_safe_minimum'); continue
        policy = row.get('updates', {}).get('remote', {})
        if not (type(policy) is dict and hg.integer(policy.get('htlc_minimum_msat'), 0, amount)
                and hg.integer(policy.get('htlc_maximum_msat'), amount, 2**63-1)):
            failures.add('incoming_htlc_policy_limit'); continue
        try:
            h = dict(pubkey=pin['peer_id'], short_channel_id=hint_scid(row),
                     **{k:policy.get(k) for k in FIELDS-{'pubkey', 'short_channel_id'}})
            validate_hints([h], quote)
        except ValueError:
            failures.add('incoming_hint_unavailable'); continue
        result.append(h)
    if not result:
        reason = next(iter(failures)) if len(failures) == 1 else 'incoming_channels_unavailable'
        details = dict(amount_msat=amount)
        if reason == 'incoming_amount_below_safe_minimum': details['minimum_msat'] = min(minimums)
        raise AdmissionError(reason, **details)
    return validate_hints(result, quote)

def unsigned(quote, timestamp, hints):
    hg.terms(quote, hg.binding(quote['chain'])); validate_hints(hints, quote)
    final = quote['min_cltv_delta']+24
    hg.need(final <= quote['max_cltv_delta'] and hg.integer(timestamp, 1, quote['expires_at']-1)
            and quote['expires_at']-timestamp <= 3600, 'invoice_timing_invalid')
    text = bolt11.unsigned(quote['payment_hash'], quote['payment_secret'], quote['amount_msat'],
        profile=quote['chain']['profile'], environment=quote['chain']['environment'], timestamp=timestamp,
        expiry=quote['expires_at']-timestamp, final_cltv=final)
    hrp, data = text.rsplit('1', 1)
    words = [bolt11.CHARSET.index(c) for c in data][:-110]
    for h in hints:
        a,b,c = map(int, h['short_channel_id'].split('x'))
        raw = bytes.fromhex(h['pubkey']) + ((a<<40)|(b<<16)|c).to_bytes(8, 'big')
        raw += h['fee_base_msat'].to_bytes(4, 'big') + h['fee_proportional_millionths'].to_bytes(4, 'big')
        raw += h['cltv_expiry_delta'].to_bytes(2, 'big')
        w = bolt11.byte_words(raw)
        words += [bolt11.CHARSET.index('r'), len(w)>>5, len(w)&31, *w]
    return bolt11.encode(hrp, words+[0]*104)


def check_decode(decoded, quote, saved):
    d = ba.ci.invoice(decoded, quote['chain']['profile'], quote['chain']['environment'])
    expected = dict(payment_hash=quote['payment_hash'], payment_secret=quote['payment_secret'],
        amount_msat=quote['amount_msat'], payee=quote['chain']['node_id'], created_at=saved['timestamp'],
        expiry=quote['expires_at']-saved['timestamp'], min_final_cltv_expiry=quote['min_cltv_delta']+24,
        routes=[[h] for h in saved['hints']],
        description='BTC to XBT swap' if quote['chain']['profile'] == ba.ci.BTC else 'XBT to BTC swap')
    hg.need(all(ba.equal(d.get(k), v) for k,v in expected.items()), 'signed_customer_invoice_changed')
    bits = (1<<8)|(1<<14)|((1<<512) if quote['chain']['profile'] == ba.ci.PRIVKEYIO_XBT else 0)
    hg.need(ba.ci.feature_bits(d['features']) == bits, 'customer_invoice_features_changed')
    hg.need(not any(k in d for k in ('fallbacks', 'payment_metadata', 'description_hash', 'extra')),
            'customer_invoice_extra_fields')


def validate(record, authority):
    hg.need(type(record) is dict and set(record) == {'schema', 'format', 'chain', 'invoices'}
            and type(record['schema']) is int and record['schema'] == 1 and record['format'] == FORMAT,
            'publisher_format_refused')
    ba.ci.same_binding(hg.binding(record['chain']), authority.chain)
    hg.need(type(record['invoices']) is dict and len(record['invoices']) <= ba.MAX_RECORDS, 'publisher_record_invalid')
    for eid, saved in record['invoices'].items():
        e, _ = authority.entry(eid, 'incoming')
        hg.need(e.get('publication') == 'registered' and type(saved) is dict
                and set(saved) in ({'timestamp', 'hints', 'unsigned'}, {'timestamp', 'hints', 'unsigned', 'invoice'}),
                'publisher_entry_invalid')
        hg.need(saved['unsigned'] == unsigned(e['payload'], saved['timestamp'], saved['hints']), 'publication_intent_changed')
        if 'invoice' in saved:
            hg.need(ba.ci.invoice_text(saved['invoice'],authority.chain), 'customer_invoice_invalid')
    return record


def initialize_fixture(directory, chain):
    directory = Path(directory); hg.binding(chain)
    hg.need(not any(p.is_symlink() for p in (directory, *directory.parents)), 'publisher_symlink_refused')
    hg.need(not restore_barrier.blocked(directory), "restored_initialization_blocked")
    directory.mkdir(mode=0o700)
    value = dict(schema=1, format=FORMAT, chain=chain, invoices={})
    fd = os.open(directory/'state.json', os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(value, stream); stream.flush(); os.fsync(stream.fileno())
    for p in (directory, directory.parent):
        fd = os.open(p, os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
        try: os.fsync(fd)
        finally: os.close(fd)


class Publisher:
    def __init__(self, authority, journal):
        self.authority, self.journal = authority, journal
        self.record = copy.deepcopy(validate(journal.read(), authority)); self.blocked = False

    def guard(self):
        self.authority.guard()
        hg.need(not self.blocked and self.journal.lock_fd is not None, 'publisher_blocked')
        hg.need(not restore_barrier.blocked(self.journal.directory), 'restored_publisher_blocked')

    def commit(self, record):
        self.guard(); validate(record, self.authority)
        try: self.journal.write(record)
        except Exception:
            self.blocked = True
            raise hg.StorageError('publication_write_uncertain') from None
        self.record = record

    def issue(self, eid):
        self.guard(); a = self.authority
        e, _ = a.entry(eid, 'incoming'); quote = e['payload']
        hg.need(e.get('publication') == 'registered', 'quote_not_registered')
        a.read_node()
        if eid not in self.record['invoices']:
            a.active(e['grant_id']); a.read_node(admission=True); a.reconcile(eid)
            hg.need('incoming' not in a.record['entries'][eid] and 'terminal' not in a.record['entries'][eid],
                    'publication_already_received')
            timestamp = int(a.clock())
            hg.need(timestamp < quote['expires_at'], 'quote_expired')
            hints = select_hints(a, quote)
            new = copy.deepcopy(self.record)
            new['invoices'][eid] = dict(timestamp=timestamp, hints=hints, unsigned=unsigned(quote, timestamp, hints))
            self.commit(new)
        saved = self.record['invoices'][eid]
        if 'invoice' not in saved:
            # Signing the same durable bytes is safe after reply loss: it
            # cannot renew the quote, reserve a slot, pay, or reveal a preimage.
            reply = a.rpc('signinvoice', invstring=saved['unsigned'])
            hg.need(type(reply) is dict and set(reply) == {'bolt11'} and type(reply['bolt11']) is str
                    and len(reply['bolt11']) <= 16384, 'invoice_signing_uncertain')
            check_decode(a.rpc('decode', string=reply['bolt11']), quote, saved)
            new = copy.deepcopy(self.record); new['invoices'][eid]['invoice'] = reply['bolt11']; self.commit(new)
            saved = self.record['invoices'][eid]
        check_decode(a.rpc('decode', string=saved['invoice']), quote, saved)
        return dict(format=FORMAT, entry_id=eid, invoice=saved['invoice'], expires_at=quote['expires_at'])
