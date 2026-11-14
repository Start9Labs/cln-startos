"""Versioned local authority for one-part payments. Explicit environment and protocol binding.

No RPC passthrough, remote credential, price policy or cross-chain worker. An
operator grants finite local risk; an enrolled outgoing payment still needs a
trusted controller's incoming/timing checks before calling send(). Recovery
never creates a new route or payment. Gate retries use its exact idempotent API.
"""
import copy
import hashlib
import json
import os
from pathlib import Path
import secrets
import time

import chain_identity as ci
import held_gate as hg
import restore_barrier
import route_plan as rp

FORMAT = 'swap-bounded-authority-v1'
PROTECTED_FORMAT = 'swap-bounded-authority-v2'
KINDS = ('incoming', 'outgoing')
MAX_RECORDS = 64
METHODS = frozenset(('getinfo', 'decode', 'listpeerchannels', 'listsendpays', 'listhtlcs',
                     'listclosedchannels', 'listtransactions', 'listfunds',
                     'sendpay', 'swap-gate-register', 'swap-gate-status',
                     'swap-gate-release', 'swap-gate-fail'))
HTLC_FIELDS = ('short_channel_id', 'id', 'expiry', 'direction', 'amount_msat', 'payment_hash', 'created_index')


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def equal(a, b):
    # JSON equality must distinguish bool from int, including inside lists.
    return json.dumps(a, sort_keys=True, allow_nan=False) == json.dumps(b, sort_keys=True, allow_nan=False)


def limits(value, kind):
    common = {'max_swaps', 'max_amount_msat', 'total_amount_msat'}
    extra = rp.LIMIT_KEYS if kind == 'outgoing' else {'min_cltv_delta', 'max_cltv_delta'}
    protected = kind == 'incoming' and type(value) is dict and 'close_before_blocks' in value
    if protected: extra = extra | {'close_before_blocks'}
    hg.need(kind in KINDS and type(value) is dict and set(value) == common | extra, 'grant_limits_invalid')
    hg.need(hg.integer(value['max_swaps'], 1, 10) and hg.integer(value['max_amount_msat'], 1, 10000010000)
            and hg.integer(value['total_amount_msat'], value['max_amount_msat'], 100000100000), 'grant_limits_invalid')
    if kind == 'outgoing':
        rp.limits({k: value[k] for k in extra})
    else:
        hg.need(hg.integer(value['min_cltv_delta'], 1, 2016)
                and hg.integer(value['max_cltv_delta'], value['min_cltv_delta'], 2016), 'grant_limits_invalid')
        if protected:
            hg.need(type(value['close_before_blocks']) is int and value['close_before_blocks'] == 72
                    and value['min_cltv_delta'] >= 216, 'protection_limits_invalid')
    return value


def pins(value, profile):
    hg.need(type(value) is list and 1 <= len(value) <= 8, 'grant_channels_invalid')
    for p in value:
        hg.validate_pin(p, profile)
    for key in ('channel_id', 'short_channel_id'):
        hg.need(len({p[key] for p in value}) == len(value), 'duplicate_channel')


def grant(value, chain):
    hg.need(type(value) is dict and set(value) == {'schema', 'format', 'chain', 'nonce', 'kind',
            'created_at', 'expires_at', 'limits', 'channels'}, 'grant_fields_invalid')
    hg.need(type(value['schema']) is int and value['schema'] == 1 and value['format'] == grant_format(value['limits']),
            'grant_format_refused')
    ci.same_binding(hg.binding(value['chain']), chain)
    hg.need(ci.hex_field(value['nonce'], 64) and value['kind'] in KINDS
            and hg.integer(value['created_at'], 1, 2**35-1)
            and hg.integer(value['expires_at'], value['created_at']+1, value['created_at']+86400), 'grant_terms_invalid')
    limits(value['limits'], value['kind']); pins(value['channels'], chain['profile'])
    return value


def grant_format(bounds):
    return PROTECTED_FORMAT if type(bounds) is dict and 'close_before_blocks' in bounds else FORMAT


def protected(g):
    return g['format'] == PROTECTED_FORMAT and g['kind'] == 'incoming'


def payload(value, g):
    if g['kind'] == 'outgoing':
        rp.validate_plan(value); ci.same_binding(value['chain'], g['chain'])
        hg.need(value['channel'] in g['channels'] and all(value['limits'][k] <= g['limits'][k]
                for k in rp.LIMIT_KEYS), 'outside_grant')
        debit = value['route'][0]['amount_msat']
    else:
        hg.terms(value, g['chain'])
        hg.need(equal(value['approved_channels'], g['channels'])
                and value['min_cltv_delta'] >= g['limits']['min_cltv_delta']
                and value['max_cltv_delta'] <= g['limits']['max_cltv_delta'], 'outside_grant')
        debit = value['amount_msat']
    hg.need(debit <= g['limits']['max_amount_msat'], 'grant_amount_limit')
    return debit


def incoming_binding(value, quote):
    hg.need(type(value) is dict and set(value) == {'binding', 'expiry'}, 'incoming_binding_invalid')
    b = value['binding']
    hg.need(type(b) is dict and set(b) == {'channel', 'htlc_id'}, 'incoming_binding_invalid')
    hg.validate_pin(b['channel'], quote['chain']['profile'])
    hg.need(b['channel'] in quote['approved_channels'] and hg.integer(b['htlc_id'], 0, 2**64-1)
            and hg.integer(value['expiry'], 1, 2**32-1), 'incoming_binding_invalid')


def attempt(value, plan):
    hg.need(type(value) is dict and value.get('state') in ('pending', 'complete', 'failed'), 'attempt_invalid')
    keys = {'state', 'identity'} | ({'preimage'} if value['state'] == 'complete' else set())
    hg.need(set(value) == keys, 'attempt_invalid')
    identity = value['identity']
    expected = dict(payment_hash=plan['payment_hash'], groupid=1, partid=0, destination=plan['recipient'],
                    amount_msat=plan['amount_msat'], amount_sent_msat=plan['route'][0]['amount_msat'])
    hg.need(type(identity) is dict and set(identity) == set(rp.ATTEMPT_FIELDS)
            and all(equal(identity[k], v) for k, v in expected.items())
            and hg.integer(identity['created_index'], 1, 2**64-1)
            and hg.integer(identity['created_at'], 1, 2**35-1), 'attempt_invalid')
    if value['state'] == 'complete':
        preimage(value['preimage'], plan['payment_hash'])


def preimage(value, payment_hash):
    hg.need(ci.hex_field(value, 64) and hashlib.sha256(bytes.fromhex(value)).hexdigest() == payment_hash,
            'preimage_mismatch')


def htlc_identity(value, pin, payment_hash, direction, amount):
    hg.need(type(value) is dict and set(value) == set(HTLC_FIELDS), 'htlc_identity_invalid')
    expected = dict(short_channel_id=pin['short_channel_id'], payment_hash=payment_hash,
                    direction=direction, amount_msat=amount)
    hg.need(all(equal(value[k], v) for k, v in expected.items())
            and hg.integer(value['id'], 0, 2**64-1) and hg.integer(value['expiry'], 1, 2**32-1)
            and hg.integer(value['created_index'], 1, 2**64-1), 'htlc_identity_invalid')


def validate(record, chain):
    hg.need(type(record) is dict and set(record) == {'schema', 'format', 'chain', 'current', 'grants', 'entries'}
            and type(record['schema']) is int and record['schema'] == 1 and record['format'] == FORMAT,
            'authority_format_refused')
    ci.same_binding(hg.binding(record['chain']), chain)
    hg.need(type(record['current']) is dict and set(record['current']) == set(KINDS)
            and type(record['grants']) is dict and len(record['grants']) <= MAX_RECORDS
            and type(record['entries']) is dict and len(record['entries']) <= MAX_RECORDS, 'authority_fields_invalid')
    for gid, saved in record['grants'].items():
        hg.need(type(saved) is dict and set(saved) == {'terms', 'paused'} and type(saved['paused']) is bool,
                'saved_grant_invalid')
        hg.need(digest(grant(saved['terms'], chain)) == gid, 'grant_changed')
    for kind, gid in record['current'].items():
        hg.need(gid is None or (type(gid) is str and gid in record['grants']
                and record['grants'][gid]['terms']['kind'] == kind), 'current_grant_invalid')
    hashes, used = set(), {}
    for eid, entry in record['entries'].items():
        hg.need(type(entry) is dict and {'grant_id', 'payload'} <= set(entry), 'entry_invalid')
        gid, data = entry['grant_id'], entry['payload']
        hg.need(type(gid) is str and gid in record['grants']
                and eid == digest(dict(grant_id=gid, payload=data)), 'enrollment_changed')
        g = record['grants'][gid]['terms']; debit = payload(data, g)
        hg.need(data['payment_hash'] not in hashes, 'payment_hash_reused'); hashes.add(data['payment_hash'])
        count, amount = used.get(gid, (0, 0)); used[gid] = count+1, amount+debit
        hg.need(count+1 <= g['limits']['max_swaps'] and amount+debit <= g['limits']['total_amount_msat'],
                'grant_budget_exhausted')
        allowed = {'grant_id', 'payload', 'terminal'}
        if g['kind'] == 'outgoing':
            allowed |= {'send', 'attempt', 'htlc'}
            if 'send' in entry: hg.need(entry['send'] is True, 'send_intent_invalid')
            if 'attempt' in entry:
                hg.need(entry.get('send') is True, 'attempt_without_intent'); attempt(entry['attempt'], data)
            if 'htlc' in entry:
                hg.need(entry.get('send') is True, 'htlc_without_intent')
                htlc_identity(entry['htlc'], data['channel'], data['payment_hash'], 'out', debit)
            if 'terminal' in entry:
                outcome = entry['terminal']
                hg.need((outcome == 'retired' and not any(k in entry for k in ('send', 'attempt', 'htlc')))
                        or (outcome in ('complete', 'failed') and entry.get('attempt', {}).get('state') == outcome
                            and 'htlc' in entry), 'terminal_evidence_invalid')
        else:
            allowed |= {'publication', 'incoming', 'decision', 'htlc'}
            if 'protection' in entry:
                import deadline_protection as protection
                protection.validate_entry(entry, g)
                allowed.add('protection')
            if 'closing' in entry:
                hg.need(entry['closing'] is True and 'protection' in entry
                        and ('terminal' not in entry or 'onchain_retirement' in entry),
                        'closing_evidence_invalid')
                allowed.add('closing')
            if 'publication' in entry:
                hg.need(entry['publication'] in ('intent', 'registered'), 'publication_invalid')
            if 'incoming' in entry:
                hg.need(entry.get('publication') == 'registered', 'incoming_without_publication')
                incoming_binding(entry['incoming'], data)
                hg.need('htlc' in entry, 'incoming_history_missing')
                b = entry['incoming']['binding']
                htlc_identity(entry['htlc'], b['channel'], data['payment_hash'], 'in', data['amount_msat'])
                hg.need(entry['htlc']['id'] == b['htlc_id']
                        and entry['htlc']['expiry'] == entry['incoming']['expiry'], 'incoming_history_changed')
            else:
                hg.need('htlc' not in entry, 'incoming_history_without_binding')
            if 'decision' in entry:
                d = entry['decision']; hg.need('incoming' in entry and type(d) is dict, 'decision_invalid')
                hg.need(d == {'action': 'fail'} or (set(d) == {'action', 'preimage'} and d['action'] == 'release'),
                        'decision_invalid')
                if d['action'] == 'release': preimage(d['preimage'], data['payment_hash'])
            if 'onchain_retirement' in entry:
                import onchain_retirement as retirement
                retirement.validate(entry, g)
                allowed.add('onchain_retirement')
            if 'terminal' in entry:
                outcome = entry['terminal']
                hg.need(('onchain_retirement' in entry and outcome in ('onchain_claimed','onchain_timed_out'))
                        or (outcome == 'expired' and entry.get('publication') == 'registered'
                         and 'incoming' not in entry and 'decision' not in entry)
                        or (outcome in ('released', 'failed') and entry.get('decision', {}).get('action') ==
                            ('release' if outcome == 'released' else 'fail')), 'terminal_evidence_invalid')
        hg.need(set(entry) <= allowed, 'entry_fields_invalid')
    return record


def initialize_fixture(directory, chain):
    """Explicit fresh disposable state only; never import an old grant/journal."""
    hg.binding(chain)
    directory = Path(directory)
    hg.need(not any(p.is_symlink() for p in (directory, *directory.parents)), 'authority_symlink_refused')
    hg.need(not restore_barrier.blocked(directory), "restored_initialization_blocked")
    directory.mkdir(mode=0o700)
    value = dict(schema=1, format=FORMAT, chain=chain, current=dict.fromkeys(KINDS), grants={}, entries={})
    fd = os.open(directory/'state.json', os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as output:
        json.dump(value, output); output.flush(); os.fsync(output.fileno())
    for path in (directory, directory.parent):
        fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try: os.fsync(fd)
        finally: os.close(fd)


class Authority:
    """One lock for grants, reservations and intents; caller closes the journal.

    RPC is a trusted local node adapter. It must not accept a request-selected
    endpoint. The production remote credential boundary is not exposed here.
    """
    def __init__(self, journal, chain, rpc, clock=time.time):
        self.journal, self.chain, self.rpc, self.clock = journal, hg.binding(chain), rpc, clock
        self.record = copy.deepcopy(validate(journal.read(), chain))
        self.blocked = False

    def guard(self):
        hg.need(not self.blocked and self.journal.lock_fd is not None, 'authority_blocked')
        hg.need(not restore_barrier.blocked(self.journal.directory), 'restored_authority_blocked')

    def commit(self, new):
        self.guard(); validate(new, self.chain)
        try: self.journal.write(new)
        except Exception:
            self.blocked = True
            raise hg.StorageError('authority_write_uncertain') from None
        self.record = new

    def read_node(self, admission=False):
        self.guard()
        return hg.observe(self.rpc('getinfo'), self.chain, admission=admission)

    def channel(self, pin, *, admission=False, debit=0, recovery=False):
        reply = self.rpc('listpeerchannels')
        hg.need(type(reply) is dict and type(reply.get('channels')) is list, 'channels_unavailable')
        found = [r for r in reply['channels'] if r.get('channel_id') == pin['channel_id']]
        if not found and recovery and not admission:
            import onchain_retirement as retirement
            retirement.closed_channel(self, pin)
            return dict(state='CLOSED', htlcs=[])
        hg.need(len(found) == 1 and hg.channel_pin(found[0], self.chain['profile']) == pin, 'approved_channel_changed')
        row = found[0]
        hg.need((row.get('state') == 'CHANNELD_NORMAL' or
                 (recovery and not admission and row.get('state') in hg.CLOSING_STATES))
                and row.get('lost_state', False) is False
                and type(row.get('htlcs')) is list, 'channel_requires_recovery')
        if admission:
            hg.need(row.get('peer_connected') is True and row.get('reestablished') is True
                    and row['htlcs'] == [], 'channel_not_ready')
            if debit:
                hg.need(hg.integer(row.get('spendable_msat'), debit, 2**63-1), 'outgoing_liquidity_insufficient')
        return row

    def history(self, pin, data, direction, amount):
        reply = self.rpc('listhtlcs', id=pin['channel_id'])
        hg.need(type(reply) is dict and type(reply.get('htlcs')) is list, 'htlc_history_unavailable')
        found = [h for h in reply['htlcs'] if h.get('payment_hash') == data['payment_hash']]
        hg.need(len(found) <= 1, 'one_htlc_required')
        if not found: return None
        h = found[0]
        identity = {k: h.get(k) for k in HTLC_FIELDS}
        htlc_identity(identity, pin, data['payment_hash'], direction, amount)
        hg.need(type(h.get('state')) is str, 'htlc_state_invalid')
        return identity, h['state']

    def unused(self, data, approved):
        reply = self.rpc('listsendpays', payment_hash=data['payment_hash'])
        hg.need(type(reply) is dict and reply.get('payments') == [], 'payment_hash_already_used')
        for pin in approved:
            reply = self.rpc('listhtlcs', id=pin['channel_id'])
            hg.need(type(reply) is dict and type(reply.get('htlcs')) is list
                    and not any(h.get('payment_hash') == data['payment_hash'] for h in reply['htlcs']),
                    'payment_hash_already_used')

    def invoice(self, data):
        d = ci.invoice(self.rpc('decode', string=data['invoice']), self.chain['profile'], self.chain['environment'])
        expected = dict(payment_hash=data['payment_hash'], payment_secret=data['payment_secret'],
                        payee=data['recipient'], amount_msat=data['amount_msat'])
        now = int(self.clock())
        hg.need(all(equal(d.get(k), v) for k, v in expected.items())
                and hg.integer(d.get('created_at'), 1, now) and hg.integer(d.get('expiry'), 1, 2**35-1)
                and d['created_at']+d['expiry'] == data['expires_at'] and now+120 <= data['expires_at']
                and data['created_at'] <= now
                and hg.integer(d.get('min_final_cltv_expiry'), 1, data['limits']['max_delay_blocks'])
                and data['route'][-1]['delay'] == max(40, d['min_final_cltv_expiry']),
                'recipient_invoice_changed_or_expiring')

    def active(self, gid):
        hg.need(type(gid) is str and gid in self.record['grants'], 'unknown_grant')
        saved = self.record['grants'][gid]; g = saved['terms']
        hg.need(not saved['paused'] and self.record['current'][g['kind']] == gid
                and g['created_at'] <= int(self.clock()) < g['expires_at'], 'grant_closed')
        return g

    def closed_terminal(self, eid):
        # Only an already terminal receipt can use closed-channel evidence.
        # Live channels still require the original HTLC/history rechecks.
        e,g=self.entry(eid)
        if 'terminal' not in e or 'onchain_retirement' in e: return False
        p=e['payload']
        pins=([p['channel']] if g['kind']=='outgoing' else
              [e['incoming']['binding']['channel']] if 'incoming' in e else p['approved_channels'])
        reply=self.rpc('listpeerchannels')
        hg.need(type(reply) is dict and type(reply.get('channels')) is list,'channels_unavailable')
        for pin in pins:
            rows=[r for r in reply['channels'] if r.get('channel_id')==pin['channel_id']]
            if rows:
                hg.need(len(rows)==1 and equal(hg.channel_pin(rows[0],self.chain['profile']),pin),'approved_channel_changed')
                if rows[0].get('state')!='ONCHAIN': return False
                hg.need(rows[0].get('lost_state',False) is False and rows[0].get('htlcs')==[], 'closed_history_unresolved')
            else:
                closed=self.rpc('listclosedchannels')
                hg.need(type(closed) is dict and type(closed.get('closedchannels')) is list,'closed_history_unavailable')
                matches=[r for r in closed['closedchannels'] if r.get('channel_id')==pin['channel_id']]
                hg.need(len(matches)==1 and equal(hg.channel_pin(matches[0],self.chain['profile']),pin),'closed_funding_changed')
                row=matches[0]
                hg.need(row.get('leased') is False and row.get('funding_withheld') is False
                        and row.get('closer') in ('local','remote')
                        and ci.hex_field(row.get('last_commitment_txid'),64),'closed_history_unresolved')
        return True

    def prior(self):
        for eid in list(self.record['entries']):
            if self.closed_terminal(eid): continue
            self.reconcile(eid)
            hg.need('terminal' in self.record['entries'][eid], 'previous_enrollment_requires_recovery')

    def create_grant(self, kind, approved, bounds, expires_at, *, confirmed=False):
        hg.need(confirmed is True, 'confirmation_required'); self.read_node(admission=True)
        now = int(self.clock())
        g = grant(dict(schema=1, format=grant_format(bounds), chain=self.chain, nonce=secrets.token_hex(32), kind=kind,
                       created_at=now, expires_at=expires_at, channels=copy.deepcopy(approved), limits=copy.deepcopy(bounds)), self.chain)
        return self.install_grant(g, confirmed=True)

    def install_grant(self, reviewed, *, confirmed=False):
        hg.need(confirmed is True, 'confirmation_required'); self.guard()
        g = copy.deepcopy(grant(reviewed, self.chain)); gid = digest(g)
        if gid in self.record['grants']:
            hg.need(equal(self.record['grants'][gid]['terms'], g), 'grant_changed')
            return gid  # Recovery does not unpause, reselect, renew or add budget.
        self.read_node(admission=True)
        hg.need(g['created_at'] <= int(self.clock()) < g['expires_at'], 'grant_closed')
        self.prior()
        for pin in g['channels']: self.channel(pin, admission=True)
        hg.need(len(self.record['grants']) < MAX_RECORDS, 'authority_full')
        gid = digest(g); new = copy.deepcopy(self.record)
        new['grants'][gid] = dict(terms=g, paused=False); new['current'][g['kind']] = gid
        self.commit(new)
        return gid

    def pause(self, gid):
        self.guard(); hg.need(gid in self.record['grants'], 'unknown_grant')
        new = copy.deepcopy(self.record); new['grants'][gid]['paused'] = True; self.commit(new)

    def enroll(self, gid, data, *, confirmed=False):
        self.guard(); hg.need(confirmed is True and gid in self.record['grants'], 'confirmation_required')
        data = copy.deepcopy(data); g = self.record['grants'][gid]['terms']; debit = payload(data, g)
        eid = digest(dict(grant_id=gid, payload=data))
        if eid in self.record['entries']:
            # Exact recovery is independent of pause/expiry/current selection.
            self.read_node(); return eid
        self.active(gid); self.read_node(admission=True)
        hg.need(not any(e['payload']['payment_hash'] == data['payment_hash'] for e in self.record['entries'].values()),
                'payment_hash_reused')
        hg.need(len(self.record['entries']) < MAX_RECORDS, 'authority_full')
        own = [e for e in self.record['entries'].values() if e['grant_id'] == gid]
        hg.need(len(own) < g['limits']['max_swaps'] and sum(payload(e['payload'], g) for e in own)+debit
                <= g['limits']['total_amount_msat'], 'grant_budget_exhausted')
        self.prior()
        for p in g['channels']: self.channel(p, admission=True)
        self.unused(data, g['channels'])
        if g['kind'] == 'outgoing':
            self.invoice(data); self.channel(data['channel'], admission=True, debit=debit)
        else:
            hg.need(int(self.clock()) < data['expires_at'] <= int(self.clock())+3600, 'quote_expiry_invalid')
        # The reservation and complete immutable enrollment are ONE replace.
        new = copy.deepcopy(self.record); new['entries'][eid] = dict(grant_id=gid, payload=data)
        self.commit(new); return eid

    def entry(self, eid, kind=None):
        self.guard(); hg.need(type(eid) is str and eid in self.record['entries'], 'unknown_enrollment')
        e = copy.deepcopy(self.record['entries'][eid]); g = self.record['grants'][e['grant_id']]['terms']
        hg.need(kind is None or g['kind'] == kind, 'wrong_authority_kind')
        return e, g

    def update(self, eid, entry):
        new = copy.deepcopy(self.record); new['entries'][eid] = entry; self.commit(new)

    def publish(self, eid):
        e, g = self.entry(eid, 'incoming'); self.read_node(admission=True)
        if 'publication' not in e:
            self.active(e['grant_id'])
            hg.need(int(self.clock()) < e['payload']['expires_at'], 'quote_expired')
            e['publication'] = 'intent'; self.update(eid, e)
        result = self.rpc('swap-gate-register', quote=e['payload'])
        hg.need(equal(result, {'registered': True}), 'registration_uncertain')
        e['publication'] = 'registered'; self.update(eid, e)
        return {'registered': True}

    def send(self, eid):
        e, g = self.entry(eid, 'outgoing')
        if 'send' in e:
            return self.reconcile(eid)  # Includes the ambiguous zero-row window.
        hg.need('terminal' not in e, 'enrollment_terminal')
        self.active(e['grant_id']); self.read_node(admission=True); self.invoice(e['payload'])
        self.channel(e['payload']['channel'], admission=True, debit=payload(e['payload'], g))
        self.unused(e['payload'], g['channels'])
        e['send'] = True; self.update(eid, e)
        p = e['payload']
        self.rpc('sendpay', route=p['route'], payment_hash=p['payment_hash'], payment_secret=p['payment_secret'],
                 bolt11=p['invoice'], groupid=1, partid=0)
        # A reply is not settlement evidence. A fresh read binds the attempt.
        return self.reconcile(eid)

    def reconcile(self, eid):
        e, g = self.entry(eid); self.read_node(); p = e['payload']
        if 'onchain_retirement' in e:
            import onchain_retirement as retirement
            retirement.recheck(self, eid)
            return self.status(eid)
        if g['kind'] == 'outgoing':
            row = self.channel(p['channel'])
            if 'send' not in e:
                self.unused(p, g['channels'])
            else:
                old = e.get('attempt')
                found = rp.observe_attempt(self.rpc, p, old['identity'] if old else None)
                if found['state'] != 'not_observed':
                    if old and old['state'] in ('complete', 'failed'):
                        hg.need(equal(found, old), 'attempt_outcome_regressed')
                    e['attempt'] = found
                h = self.history(p['channel'], p, 'out', p['route'][0]['amount_msat'])
                if h:
                    hg.need('htlc' not in e or equal(e['htlc'], h[0]), 'original_htlc_changed')
                    e['htlc'] = h[0]
                else:
                    hg.need('htlc' not in e and 'terminal' not in e, 'original_htlc_missing')
                terminal = (found['state'] in ('complete', 'failed') and h is not None
                            and h[1] == 'RCVD_REMOVE_ACK_REVOCATION' and row['htlcs'] == [])
                hg.need('terminal' not in e or terminal, 'terminal_evidence_regressed')
                if terminal: e['terminal'] = found['state']
        elif e.get('publication') == 'registered':
            s = self.rpc('swap-gate-status', payment_hash=p['payment_hash'])
            hg.need(type(s) is dict and s.get('payment_hash') == p['payment_hash']
                    and equal(s.get('chain'), self.chain) and equal(s.get('amount_msat'), p['amount_msat'])
                    and s.get('terminal_is_intent') is True and s.get('needs_attention') is False
                    and type(s.get('hook_ready')) is bool, 'gate_evidence_invalid')
            phase = s.get('phase')
            if phase == 'quoted':
                hg.need(s.get('binding') is None and s.get('cltv_expiry') is None and not s['hook_ready']
                        and 'incoming' not in e and 'decision' not in e, 'gate_outcome_regressed')
                for pin in p['approved_channels']: self.channel(pin)
                self.unused(p, p['approved_channels'])
                hg.need('terminal' not in e or int(self.clock()) >= p['expires_at'], 'terminal_evidence_regressed')
                if int(self.clock()) >= p['expires_at']: e['terminal'] = 'expired'
            else:
                hg.need(phase in ('held', 'release_intent', 'fail_intent'), 'gate_phase_invalid')
                incoming = dict(binding=s.get('binding'), expiry=s.get('cltv_expiry'))
                incoming_binding(incoming, p)
                hg.need('incoming' not in e or equal(e['incoming'], incoming), 'incoming_binding_changed')
                e['incoming'] = incoming
                b = incoming['binding']; row = self.channel(b['channel'],
                    recovery=ba_protected_entry(e, g))
                closing = row['state'] != 'CHANNELD_NORMAL'
                if closing:
                    hg.need('terminal' not in e, 'terminal_evidence_regressed')
                    e['closing'] = True
                else:
                    hg.need('closing' not in e, 'closing_evidence_regressed')
                if row['state'] == 'CLOSED':
                    # Core prunes this channel's HTLC rows on restart. Only the
                    # already persisted binding/decision can cross that boundary.
                    hg.need('htlc' in e and 'decision' in e and 'close' in e['protection']
                            and phase == e['decision']['action']+'_intent', 'closed_history_unresolved')
                    if not equal(e, self.record['entries'][eid]): self.update(eid, e)
                    return self.status(eid)
                h = self.history(b['channel'], p, 'in', p['amount_msat'])
                hg.need(h is not None and h[0]['id'] == b['htlc_id'] and h[0]['expiry'] == incoming['expiry'],
                        'original_incoming_htlc_missing')
                hg.need('htlc' not in e or equal(e['htlc'], h[0]), 'original_htlc_changed')
                e['htlc'] = h[0]
                if phase == 'held':
                    hg.need(h[1] == 'RCVD_ADD_ACK_REVOCATION' and 'terminal' not in e, 'incoming_not_committed')
                    matches = [v for v in row['htlcs'] if v.get('direction') == 'in' and v.get('id') == b['htlc_id']]
                    hg.need(len(matches) == 1 and matches[0].get('local_trimmed', False) is False
                            and all(equal(matches[0].get(k), h[0][k]) for k in ('payment_hash', 'amount_msat', 'expiry'))
                            and matches[0].get('state') == h[1], 'incoming_not_committed')
                else:
                    action = 'release' if phase == 'release_intent' else 'fail'
                    hg.need(e.get('decision', {}).get('action') == action, 'unowned_gate_decision')
                    terminal = not closing and h[1] == 'SENT_REMOVE_ACK_REVOCATION' and row['htlcs'] == []
                    hg.need('terminal' not in e or terminal, 'terminal_evidence_regressed')
                    if terminal: e['terminal'] = 'released' if action == 'release' else 'failed'
        if not equal(e, self.record['entries'][eid]): self.update(eid, e)
        return self.status(eid)

    def resolve(self, eid, *, payment_preimage=None):
        self.reconcile(eid); e, g = self.entry(eid, 'incoming')
        hg.need('incoming' in e, 'incoming_not_held')
        decision = dict(action='fail') if payment_preimage is None else dict(action='release', preimage=payment_preimage)
        if payment_preimage is not None: preimage(payment_preimage, e['payload']['payment_hash'])
        hg.need('decision' not in e or equal(e['decision'], decision), 'resolution_changed')
        if 'onchain_retirement' in e: return self.status(eid)
        if 'decision' not in e:
            e['decision'] = decision; self.update(eid, e)
        if ba_protected_entry(e, g) and self.channel(e['incoming']['binding']['channel'], recovery=True)['state'] == 'CLOSED':
            return self.status(eid)
        params = dict(payment_hash=e['payload']['payment_hash'], binding=e['incoming']['binding'])
        if payment_preimage is not None: params['preimage'] = payment_preimage
        result = self.rpc('swap-gate-'+decision['action'], **params)
        hg.need(equal(result, {'recorded': decision['action']+'_intent'}), 'resolution_uncertain')
        return self.reconcile(eid)

    def retire(self, eid, *, confirmed=False):
        hg.need(confirmed is True, 'confirmation_required')
        e, g = self.entry(eid, 'outgoing'); self.read_node()
        # Retirement revokes this enrollment under the authority journal lock.
        # A prior send intent (including an uncertain outcome) always refuses.
        # Once terminal is durable, send() cannot dispatch it, even if the
        # recipient invoice is still valid. Never refund the grant budget.
        hg.need('send' not in e, 'retirement_refused')
        self.unused(e['payload'], g['channels'])
        for pin in g['channels']: self.channel(pin)
        e['terminal'] = 'retired'; self.update(eid, e)
        return self.status(eid)

    def status(self, eid=None):
        # Local cached status contains no hash, invoice, secret, preimage or RPC.
        restored = restore_barrier.blocked(self.journal.directory)
        if eid is None:
            return dict(format=FORMAT, regtest_only=hg.regtest(self.chain), blocked=self.blocked or restored,
                        grants=len(self.record['grants']), enrollments=len(self.record['entries']))
        hg.need(type(eid) is str and eid in self.record['entries'], 'unknown_enrollment')
        e = self.record['entries'][eid]; kind = self.record['grants'][e['grant_id']]['terms']['kind']
        state = entry_state(e)
        return dict(kind=kind, state=state, terminal='terminal' in e, regtest_only=hg.regtest(self.chain),
                    blocked=self.blocked or restored)


def ba_protected_entry(e, g):
    return protected(g) and 'protection' in e


def entry_state(e):
    return e.get('terminal') or ('onchain_recovery' if e.get('closing') else
        'close_outcome_pending' if e.get('protection', {}).get('close') else
        e.get('attempt', {}).get('state', 'send_uncertain') if 'send' in e
        else 'resolution_intent' if 'decision' in e else 'held' if 'incoming' in e
        else 'waiting_for_payment' if e.get('publication') == 'registered' else 'enrolled')
