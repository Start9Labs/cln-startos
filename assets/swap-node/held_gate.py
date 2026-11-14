"""Protocol-bound, single-part incoming gate. Disposable regtest ONLY.

This is not a grant, an outgoing payer, or a production activation mechanism.
Every transition is persisted before its hook/RPC reply. Recovery never rebinds
an admitted HTLC. Plugin death remains an engine-level blocker (see README).
"""
import copy
import fcntl
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import stat
import tempfile
import time

import chain_identity as ci
import restore_barrier

FORMAT = 'swap-held-gate-v1'
MAX_BYTES = 1048576
MAX_QUOTES = 64
PIN_KEYS = {'channel_id', 'short_channel_id', 'funding_txid', 'funding_outnum',
            'peer_id', 'channel_type_bits'}
CLOSING_STATES = ('CHANNELD_SHUTTING_DOWN', 'AWAITING_UNILATERAL', 'FUNDING_SPEND_SEEN', 'ONCHAIN')


class Refused(ValueError):
    """Fixed reason codes only; no payment secrets or raw RPC errors."""


class StorageError(RuntimeError):
    pass


def need(ok, reason):
    if not ok:
        raise Refused(reason)


def integer(value, low, high):
    return type(value) is int and low <= value <= high


def scid(value):
    if type(value) is not str or re.fullmatch(r'(0|[1-9][0-9]*)x(0|[1-9][0-9]*)x(0|[1-9][0-9]*)', value) is None:
        return False
    a, b, c = map(int, value.split('x'))
    return a < 2**24 and b < 2**24 and c < 2**16


def binding(value):
    ci.same_binding(value, value)
    need(value['profile'] in (ci.BTC, ci.PRIVKEYIO_XBT)
         and value['environment'] in ci.ENVIRONMENTS, 'unsupported_swap_environment')
    return value


def regtest(chain):
    return binding(chain)['environment'] == 'regtest'


def observe(info, expected, *, admission=False):
    """Recovery may start while syncing; new admission requires full readiness.

    Do not erase warning fields to pass ci.node. Check protocol identity here
    without asserting sync, then use the stricter existing helper for admission.
    """
    binding(expected)
    need(type(info) is dict and info.get('network') == expected['network'], 'network_changed')
    observed = ci.binding(expected['profile'], expected['environment'], info.get('id'))
    ci.same_binding(expected, observed)
    need(type(info.get('our_features')) is dict, 'features_missing')
    for place in ('init', 'node', 'invoice'):
        ci._features(info['our_features'].get(place), expected['profile'], place)
    need(integer(info.get('blockheight'), 0, 2**32-1), 'height_invalid')
    if admission:
        ci.node(info, expected['profile'], expected['environment'], expected_id=expected['node_id'])
    return info['blockheight']


def validate_pin(pin, profile):
    need(type(pin) is dict and set(pin) == PIN_KEYS, 'pin_fields_invalid')
    need(ci.hex_field(pin['channel_id'], 64) and ci.hex_field(pin['funding_txid'], 64)
         and integer(pin['funding_outnum'], 0, 65535) and scid(pin['short_channel_id']), 'pin_invalid')
    ci.binding(profile, 'regtest', pin['peer_id'])
    bits = pin['channel_type_bits']
    ci.channel({'channel_type': {'bits': bits}}, profile)
    need(bits == sorted(bits), 'pin_type_not_canonical')
    return pin


def channel_pin(row, profile):
    ci.channel(row, profile)
    pin = {k: row.get(k) for k in PIN_KEYS - {'channel_type_bits'}}
    pin['channel_type_bits'] = sorted(row['channel_type']['bits'])
    return validate_pin(pin, profile)


def terms(value, expected):
    need(type(value) is dict and set(value) == {
        'chain', 'payment_hash', 'payment_secret', 'amount_msat', 'expires_at',
        'min_cltv_delta', 'max_cltv_delta', 'approved_channels'}, 'quote_fields_invalid')
    ci.same_binding(value['chain'], expected)
    need(ci.hex_field(value['payment_hash'], 64) and ci.hex_field(value['payment_secret'], 64), 'quote_hash_invalid')
    need(integer(value['amount_msat'], 1, 10000000000 if expected['profile']==ci.PRIVKEYIO_XBT else 1000000000)
         and integer(value['expires_at'], 1, 2**35-1)
         and integer(value['min_cltv_delta'], 1, 2016)
         and integer(value['max_cltv_delta'], value['min_cltv_delta'], 2016), 'quote_limits_invalid')
    pins = value['approved_channels']
    need(type(pins) is list and 1 <= len(pins) <= 8, 'approved_channels_invalid')
    for pin in pins:
        validate_pin(pin, expected['profile'])
    for field in ('channel_id', 'short_channel_id'):
        need(len({p[field] for p in pins}) == len(pins), 'duplicate_channel')
    return value


def snapshot(params):
    """Persist stable fields, never the block-relative delta or hook request ID."""
    h, o = params['htlc'], params['onion']
    need(type(h) is dict and type(o) is dict, 'hook_fields_invalid')
    need(scid(h.get('short_channel_id')) and integer(h.get('id'), 0, 2**64-1)
         and ci.hex_field(h.get('payment_hash'), 64)
         and integer(h.get('amount_msat'), 1, 2**63-1)
         and integer(h.get('cltv_expiry'), 1, 2**32-1), 'htlc_fields_invalid')
    need(o.get('type') == 'tlv' and ci.hex_field(o.get('payment_secret'), 64)
         and integer(o.get('forward_msat'), 1, 2**63-1)
         and integer(o.get('total_msat'), 1, 2**63-1)
         and integer(o.get('outgoing_cltv_value'), 1, 2**32-1), 'onion_fields_invalid')
    need(not any(k in o for k in ('short_channel_id', 'next_node_id'))
         and 'forward_to' not in params, 'final_hop_required')
    return dict(htlc={k: h[k] for k in ('short_channel_id', 'id', 'payment_hash', 'amount_msat', 'cltv_expiry')},
                onion={k: o[k] for k in ('type', 'payment_secret', 'forward_msat', 'total_msat', 'outgoing_cltv_value')})


def matches_terms(snap, quote):
    h, o = snap['htlc'], snap['onion']
    need(h['payment_hash'] == quote['payment_hash']
         and hmac.compare_digest(o['payment_secret'], quote['payment_secret'])
         and h['amount_msat'] == o['forward_msat'] == o['total_msat'] == quote['amount_msat']
         and h['cltv_expiry'] >= o['outgoing_cltv_value'], 'one_exact_payment_required')


def validate_record(record, expected):
    need(type(record) is dict and set(record) == {'schema', 'format', 'chain', 'quotes'}
         and type(record['schema']) is int and record['schema'] == 2 and record['format'] == FORMAT,
         'journal_format_refused')
    ci.same_binding(binding(record['chain']), expected)
    need(type(record['quotes']) is dict and len(record['quotes']) <= MAX_QUOTES, 'journal_quotes_invalid')
    for payment_hash, entry in record['quotes'].items():
        need(type(entry) is dict, 'journal_entry_invalid')
        quote = terms(entry['terms'], expected)
        need(payment_hash == quote['payment_hash'], 'journal_hash_mismatch')
        phase = entry['phase']
        need(phase in ('quoted', 'held', 'release_intent', 'fail_intent'), 'journal_phase_invalid')
        keys = {'terms', 'phase'}
        if phase != 'quoted':
            keys |= {'accepted', 'binding'}
            snap = entry['accepted']
            need(snapshot(snap) == snap, 'journal_snapshot_invalid')
            matches_terms(snap, quote)
            b = entry['binding']
            need(type(b) is dict and set(b) == {'channel', 'htlc_id'}, 'journal_binding_invalid')
            validate_pin(b['channel'], expected['profile'])
            need(b['channel'] in quote['approved_channels']
                 and b['channel']['short_channel_id'] == snap['htlc']['short_channel_id']
                 and type(b['htlc_id']) is int and b['htlc_id'] == snap['htlc']['id'], 'journal_binding_mismatch')
        if phase == 'release_intent':
            keys.add('preimage')
            need(ci.hex_field(entry['preimage'], 64)
                 and hashlib.sha256(bytes.fromhex(entry['preimage'])).hexdigest() == payment_hash,
                 'journal_preimage_invalid')
        need(set(entry) == keys, 'journal_entry_fields_invalid')
    return record


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        need(key not in result, 'duplicate_json_key')
        result[key] = value
    return result


class Journal:
    """One writer, private directory, bounded strict JSON, atomic durable replace.

    Missing journals are never initialized by the plugin. A separate disposable
    fixture explicitly creates the initial identity-bound record before startup.
    """
    def __init__(self, directory):
        self.directory = Path(directory)
        self.lock_fd = None
        for path in (self.directory, *self.directory.parents):
            need(not path.is_symlink(), 'journal_symlink_refused')
        st = self.directory.stat()
        need(stat.S_ISDIR(st.st_mode) and st.st_uid == os.getuid() and st.st_mode & 0o077 == 0,
             'journal_directory_not_private')
        self.path = self.directory/'state.json'
        fd = os.open(self.directory/'writer.lock', os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
        try:
            self.check_file(fd)
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BaseException:
            os.close(fd)
            raise
        self.lock_fd = fd

    @staticmethod
    def check_file(fd):
        st = os.fstat(fd)
        need(stat.S_ISREG(st.st_mode) and st.st_uid == os.getuid()
             and st.st_nlink == 1 and st.st_mode & 0o077 == 0, 'journal_file_not_private')

    def close(self):
        if self.lock_fd is not None:
            os.close(self.lock_fd)
            self.lock_fd = None

    def read(self):
        fd = os.open(self.path, os.O_RDONLY | os.O_NOFOLLOW)
        with os.fdopen(fd, 'rb') as stream:
            self.check_file(stream.fileno())
            raw = stream.read(MAX_BYTES+1)
        need(len(raw) <= MAX_BYTES, 'journal_too_large')
        return json.loads(raw, object_pairs_hook=unique_object)

    def write(self, record):
        need(not restore_barrier.blocked(self.directory), "restored_journal_blocked")
        need(self.lock_fd is not None, 'journal_writer_closed')
        raw = (json.dumps(record, sort_keys=True, separators=(',', ':'))+'\n').encode()
        need(len(raw) <= MAX_BYTES, 'journal_too_large')
        temporary = None
        try:
            # The old file must still exist; disappearance is not a fresh setup.
            fd = os.open(self.path, os.O_RDONLY | os.O_NOFOLLOW)
            try:
                self.check_file(fd)
            finally:
                os.close(fd)
            fd, temporary = tempfile.mkstemp(prefix='.state-', dir=self.directory)
            with os.fdopen(fd, 'wb') as stream:
                stream.write(raw)
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temporary, self.path)
            temporary = None
            directory_fd = os.open(self.directory, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
            try:
                os.fsync(directory_fd)
            finally:
                os.close(directory_fd)
        except (OSError, ValueError):
            raise StorageError('journal_write_uncertain') from None
        finally:
            if temporary is not None:
                try:
                    os.unlink(temporary)
                except FileNotFoundError:
                    pass


def initialize_fixture(directory, chain):
    """Initialize an empty journal. Never called on an existing directory or by plugin startup."""
    binding(chain)
    directory = Path(directory)
    need(not restore_barrier.blocked(directory), "restored_gate_blocked")
    directory.mkdir(mode=0o700)
    raw = dict(schema=2, format=FORMAT, chain=chain, quotes={})
    fd = os.open(directory/'state.json', os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(raw, stream)
        stream.flush()
        os.fsync(stream.fileno())
    with_fd = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(with_fd)
    finally:
        os.close(with_fd)


class Gate:
    def __init__(self, journal, chain, rpc, clock=time.time):
        self.journal, self.chain, self.rpc, self.clock = journal, binding(chain), rpc, clock
        self.record = validate_record(journal.read(), chain)
        self.pending = {}
        self.quarantined = set()
        self.blocked = False
        need(not restore_barrier.blocked(journal.directory), "restored_gate_blocked")
        observe(rpc('getinfo'), chain)

    def commit(self, record):
        validate_record(record, self.chain)
        try:
            self.journal.write(record)
        except Exception:
            # A replace/fsync may have succeeded before its reply was lost.
            # Keep the process alive and EVERY hook unresolved; never fall back
            # to in-memory authority or let a dying plugin continue the hook.
            self.blocked = True
            self.pending.clear()
            raise StorageError('journal_write_uncertain') from None
        self.record = record

    def channels(self):
        reply = self.rpc('listpeerchannels')
        need(type(reply) is dict and type(reply.get('channels')) is list, 'channels_unavailable')
        return reply['channels']

    def actual(self, snap, quote, *, admission):
        h = snap['htlc']
        rows = [r for r in self.channels() if r.get('short_channel_id') == h['short_channel_id']]
        need(len(rows) == 1, 'incoming_channel_unavailable')
        row = rows[0]
        pin = channel_pin(row, self.chain['profile'])
        need(pin in quote['approved_channels'] and (row.get('state') == 'CHANNELD_NORMAL'
             or (not admission and row.get('state') in CLOSING_STATES))
             and row.get('lost_state', False) is False, 'incoming_channel_changed')
        if admission:
            need(row.get('peer_connected') is True and row.get('reestablished') is True, 'channel_not_ready')
        need(type(row.get('htlcs')) is list, 'incoming_htlc_unavailable')
        matches = [i for i in row['htlcs'] if i.get('direction') == 'in' and i.get('id') == h['id']]
        need(len(matches) == 1, 'incoming_htlc_unavailable')
        item = matches[0]
        need(item.get('payment_hash') == h['payment_hash'] and item.get('amount_msat') == h['amount_msat']
             and item.get('expiry') == h['cltv_expiry'] and item.get('state') == 'RCVD_ADD_ACK_REVOCATION'
             and item.get('local_trimmed', False) is False, 'incoming_htlc_not_committed')
        return dict(channel=pin, htlc_id=h['id'])

    def register(self, quote):
        need(not self.blocked and not restore_barrier.blocked(self.journal.directory), 'gate_blocked')
        terms(quote, self.chain)
        observe(self.rpc('getinfo'), self.chain, admission=True)
        old = self.record['quotes'].get(quote['payment_hash'])
        if old is not None:
            need(old['terms'] == quote, 'quote_immutable')
            return {'registered': True}
        now = int(self.clock())
        need(now < quote['expires_at'] <= now+3600, 'quote_expiry_invalid')
        need(len(self.record['quotes']) < MAX_QUOTES, 'journal_full')
        need(not any(e['phase'] == 'held' or (e['phase'] == 'quoted' and e['terms']['expires_at'] > now)
                     for e in self.record['quotes'].values()), 'another_quote_active')
        rows = self.channels()
        for pin in quote['approved_channels']:
            matches = [r for r in rows if r.get('channel_id') == pin['channel_id']]
            need(len(matches) == 1 and channel_pin(matches[0], self.chain['profile']) == pin,
                 'approved_channel_changed')
            row = matches[0]
            need(row.get('state') == 'CHANNELD_NORMAL' and row.get('peer_connected') is True
                 and row.get('reestablished') is True and row.get('lost_state', False) is False,
                 'approved_channel_not_ready')
        new = copy.deepcopy(self.record)
        new['quotes'][quote['payment_hash']] = dict(terms=copy.deepcopy(quote), phase='quoted')
        self.commit(new)
        return {'registered': True}

    @staticmethod
    def terminal(entry):
        return (dict(result='resolve', payment_key=entry['preimage']) if entry['phase'] == 'release_intent'
                else dict(result='fail', failure_message='2002'))

    def accept(self, params, request_id):
        if self.blocked or restore_barrier.blocked(self.journal.directory):
            self.pending.clear()
            return None
        h = params['htlc']
        payment_hash = h['payment_hash']
        need(ci.hex_field(payment_hash, 64), 'hook_hash_invalid')
        entry = self.record['quotes'].get(payment_hash)
        if entry is None:
            return {'result': 'continue'}
        if payment_hash in self.quarantined:
            return None
        if entry['phase'] != 'quoted':
            try:
                snap = snapshot(params)
                need(snap == entry['accepted'], 'accepted_replay_changed')
                observe(self.rpc('getinfo'), self.chain)
                need(self.actual(snap, entry['terms'], admission=False) == entry['binding'], 'binding_changed')
                need(payment_hash not in self.pending or self.pending[payment_hash] == request_id,
                     'duplicate_hook_instance')
            except Exception:
                # Do not fail either hook, and revoke this process's ready flag.
                self.pending.pop(payment_hash, None)
                self.quarantined.add(payment_hash)
                return None
            if entry['phase'] == 'held':
                self.pending[payment_hash] = request_id
                return None
            return self.terminal(entry)
        try:
            snap = snapshot(params)
            quote = entry['terms']
            matches_terms(snap, quote)
            height = observe(self.rpc('getinfo'), self.chain, admission=True)
            need(int(self.clock()) < quote['expires_at'], 'quote_expired')
            for absolute in (snap['htlc']['cltv_expiry'], snap['onion']['outgoing_cltv_value']):
                need(quote['min_cltv_delta'] <= absolute-height <= quote['max_cltv_delta'], 'htlc_timing_invalid')
            actual = self.actual(snap, quote, admission=True)
        except (ValueError, KeyError, TypeError):
            return dict(result='fail', failure_message='2002')
        new = copy.deepcopy(self.record)
        new['quotes'][payment_hash].update(phase='held', accepted=snap, binding=actual)
        self.commit(new)
        self.pending[payment_hash] = request_id
        return None

    def status(self, payment_hash):
        need(ci.hex_field(payment_hash, 64) and payment_hash in self.record['quotes'], 'unknown_quote')
        entry = self.record['quotes'][payment_hash]
        return dict(payment_hash=payment_hash, chain=self.chain, phase=entry['phase'],
                    binding=copy.deepcopy(entry.get('binding')),
                    cltv_expiry=entry.get('accepted', {}).get('htlc', {}).get('cltv_expiry'),
                    amount_msat=entry['terms']['amount_msat'],
                    hook_ready=not self.blocked and not restore_barrier.blocked(self.journal.directory) and payment_hash in self.pending,
                    needs_attention=self.blocked or restore_barrier.blocked(self.journal.directory) or payment_hash in self.quarantined,
                    terminal_is_intent=True)

    def resolve(self, payment_hash, original_binding, *, preimage=None):
        need(not self.blocked and not restore_barrier.blocked(self.journal.directory)
             and payment_hash not in self.quarantined, 'gate_blocked')
        entry = self.record['quotes'][payment_hash]
        need(entry.get('binding') == original_binding and 'accepted' in entry, 'original_binding_required')
        releasing = preimage is not None
        phase = 'release_intent' if releasing else 'fail_intent'
        if releasing:
            need(ci.hex_field(preimage, 64) and hashlib.sha256(bytes.fromhex(preimage)).hexdigest() == payment_hash,
                 'preimage_mismatch')
        if entry['phase'] == phase:
            return None, {'recorded': phase}  # Exact retry; never emit a second hook reply.
        need(entry['phase'] == 'held' and payment_hash in self.pending, 'original_hook_unavailable')
        observe(self.rpc('getinfo'), self.chain)
        need(self.actual(entry['accepted'], entry['terms'], admission=False) == original_binding, 'binding_changed')
        new = copy.deepcopy(self.record)
        new_entry = new['quotes'][payment_hash]
        new_entry['phase'] = phase
        if releasing:
            new_entry['preimage'] = preimage
        self.commit(new)
        request_id = self.pending.pop(payment_hash)
        return (request_id, self.terminal(new_entry)), {'recorded': phase}
