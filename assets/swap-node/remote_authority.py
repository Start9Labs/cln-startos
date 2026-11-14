"""Grant-scoped remote facade. Disposable regtest, trusted controller only.

The node's authenticated transport (commando or, later, CLNrest) must check
the rune before dispatching CALL. A local RPC socket remains administrative.
No price, cross-chain timing or human-confirmation proof is supplied here.
"""
import copy
import json
import os
from pathlib import Path
import re

import bounded_authority as ba
import held_gate as hg
import restore_barrier

FORMAT = 'swap-remote-authority-v1'
CALL = 'swap-authority-call'
CREDENTIAL = 'swap-authority-credential'
OPERATIONS = {
    'incoming': ('info', 'enroll', 'publish', 'reconcile', 'evidence', 'release', 'fail'),
    'outgoing': ('info', 'enroll', 'send', 'reconcile', 'evidence', 'retire'),
}
SETUP_METHODS = frozenset(('createrune', 'showrunes'))


def restrictions(gid, kind, *, operations=OPERATIONS, method=CALL):
    hg.need(ba.ci.hex_field(gid, 64) and kind in operations, 'credential_scope_invalid')
    # No time restriction: admission expiry is in the durable grant, while
    # already enrolled recovery must remain available after that deadline.
    return [['method='+method], ['pnamegrant_id='+gid], ['pnum=3'],
            ['pnameoperation='+op for op in operations[kind]]]


def token(value):
    return type(value) is str and 32 <= len(value) <= 8192 and re.fullmatch(r'[A-Za-z0-9_=-]+', value) is not None


def credential(value):
    hg.need(type(value) is dict and set(value) == {'rune', 'unique_id'} and token(value['rune'])
            and type(value['unique_id']) is str and re.fullmatch(r'0|[1-9][0-9]{0,19}', value['unique_id'])
            and int(value['unique_id']) < 2**64, 'credential_reply_invalid')
    return value


def validate(record, authority, *, format_name=FORMAT):
    hg.need(type(record) is dict and set(record) == {'schema', 'format', 'chain', 'credentials'}
            and type(record['schema']) is int and record['schema'] == 1 and record['format'] == format_name,
            'remote_format_refused')
    ba.ci.same_binding(hg.binding(record['chain']), authority.chain)
    hg.need(type(record['credentials']) is dict and len(record['credentials']) <= ba.MAX_RECORDS,
            'remote_record_invalid')
    ids, runes = set(), set()
    for gid, entry in record['credentials'].items():
        hg.need(gid in authority.record['grants'] and type(entry) is dict
                and set(entry) in ({'intent'}, {'intent', 'credential'}) and entry['intent'] is True,
                'remote_grant_changed')
        if 'credential' in entry:
            c = credential(entry['credential'])
            hg.need(c['unique_id'] not in ids and c['rune'] not in runes, 'credential_reused')
            ids.add(c['unique_id']); runes.add(c['rune'])
    return record


def initialize_fixture(directory, chain, *, format_name=FORMAT):
    """Fresh fixture state; never import or renew old credentials."""
    directory = Path(directory); hg.binding(chain)
    hg.need(not any(p.is_symlink() for p in (directory, *directory.parents)), 'remote_symlink_refused')
    hg.need(not restore_barrier.blocked(directory), "restored_initialization_blocked")
    directory.mkdir(mode=0o700)
    value = dict(schema=1, format=format_name, chain=chain, credentials={})
    fd = os.open(directory/'state.json', os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(value, stream); stream.flush(); os.fsync(stream.fileno())
    for path in (directory, directory.parent):
        fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try: os.fsync(fd)
        finally: os.close(fd)


def decoded_restrictions(row):
    values = row.get('restrictions')
    hg.need(type(values) is list, 'rune_inventory_invalid')
    result = []
    for group in values:
        hg.need(type(group) is dict and type(group.get('alternatives')) is list, 'rune_inventory_invalid')
        alternatives = []
        for a in group['alternatives']:
            hg.need(type(a) is dict and all(type(a.get(k)) is str for k in ('fieldname', 'condition', 'value'))
                    and len(a['condition']) == 1, 'rune_inventory_invalid')
            alternatives.append(a['fieldname']+a['condition']+a['value'])
        result.append(alternatives)
    return result


class Remote:
    """Caller holds authority lock THEN credential lock for the whole request."""
    format_name, method, operations = FORMAT, CALL, OPERATIONS

    def restrictions(self, gid, kind):
        return restrictions(gid, kind, operations=self.operations, method=self.method)

    def __init__(self, authority, journal, setup_rpc):
        self.authority, self.journal, self.rpc = authority, journal, setup_rpc
        self.record = copy.deepcopy(validate(journal.read(), authority, format_name=self.format_name))
        self.blocked = False

    def guard(self):
        self.authority.guard()
        hg.need(not self.blocked and self.journal.lock_fd is not None, 'remote_blocked')
        hg.need(not restore_barrier.blocked(self.journal.directory), 'restored_remote_blocked')

    def commit(self, record):
        self.guard(); validate(record, self.authority, format_name=self.format_name)
        try: self.journal.write(record)
        except Exception:
            self.blocked = True
            raise hg.StorageError('credential_write_uncertain') from None
        self.record = record

    def stored(self, gid, kind):
        result = self.rpc('showrunes')
        hg.need(type(result) is dict and type(result.get('runes')) is list, 'rune_inventory_invalid')
        matches = []
        for row in result['runes']:
            hg.need(type(row) is dict, 'rune_inventory_invalid')
            if ba.equal(decoded_restrictions(row), self.restrictions(gid, kind)):
                hg.need(row.get('stored', True) is True and row.get('our_rune', True) is True
                        and row.get('blacklisted', False) is False, 'credential_unavailable')
                matches.append(credential({k: row.get(k) for k in ('rune', 'unique_id')}))
        hg.need(len(matches) <= 1, 'credential_outcome_ambiguous')
        return matches[0] if matches else None

    def enable(self, gid, *, confirmed=False):
        """Local setup only. One mint intent, recover exact stored rune on loss.

        Zero matches after an intent never authorizes another mint. Local
        setup must inspect that ambiguity; no remote capability is returned.
        """
        self.guard(); hg.need(confirmed is True, 'confirmation_required')
        hg.need(type(gid) is str and gid in self.authority.record['grants'], 'unknown_grant')
        self.authority.read_node()
        kind = self.authority.record['grants'][gid]['terms']['kind']
        saved = self.record['credentials'].get(gid)
        found = self.stored(gid, kind)
        if saved is None:
            self.authority.active(gid); self.authority.read_node(admission=True)
            hg.need(found is None, 'unowned_credential')
            new = copy.deepcopy(self.record); new['credentials'][gid] = dict(intent=True)
            self.commit(new)
            result = credential(self.rpc('createrune', restrictions=self.restrictions(gid, kind)))
            found = self.stored(gid, kind)
            hg.need(ba.equal(result, found), 'credential_reply_uncertain')
        else:
            hg.need(found is not None, 'credential_outcome_unknown')
            if 'credential' in saved:
                hg.need(ba.equal(saved['credential'], found), 'credential_changed')
        if self.record['credentials'][gid].get('credential') != found:
            new = copy.deepcopy(self.record); new['credentials'][gid]['credential'] = found
            self.commit(new)
        return dict(format=self.format_name, chain=copy.deepcopy(self.authority.chain), grant_id=gid, **found)

    def call(self, params):
        """Only for a request already authorized by the node's rune transport."""
        self.guard()
        hg.need(type(params) is dict and set(params) == {'grant_id', 'operation', 'body'}, 'remote_parameters_invalid')
        gid, op, body = (params[k] for k in ('grant_id', 'operation', 'body'))
        hg.need(type(gid) is str and gid in self.authority.record['grants'], 'unknown_grant')
        saved = self.record['credentials'].get(gid)
        hg.need(saved is not None and 'credential' in saved, 'credential_setup_unfinished')
        a = self.authority; g = a.record['grants'][gid]['terms']
        hg.need(type(op) is str and op in self.operations[g['kind']] and type(body) is dict,
                'remote_operation_refused')
        if op == 'info':
            hg.need(not body, 'remote_parameters_invalid'); a.read_node()
            own = [e for e in a.record['entries'].values() if e['grant_id'] == gid]
            return dict(format=self.format_name, grant=copy.deepcopy(g), paused=a.record['grants'][gid]['paused'],
                current=a.record['current'][g['kind']] == gid, remaining=g['limits']['max_swaps']-len(own),
                reserved_msat=sum(ba.payload(e['payload'], g) for e in own), regtest_only=hg.regtest(g['chain']))
        if op == 'enroll':
            hg.need(set(body) == {'data', 'confirmation'} and type(body['confirmation']) is str
                    and body['confirmation'] == ba.digest(body['data']), 'confirmation_required')
            # This binds the caller's explicit request, not proof of human UX
            # or an incoming payment on the other chain.
            return dict(entry_id=a.enroll(gid, body['data'], confirmed=True))
        fields = {'entry_id'} | ({'preimage'} if op == 'release' else {'confirmation'} if op == 'retire' else set())
        hg.need(set(body) == fields, 'remote_parameters_invalid')
        eid = body['entry_id']; entry, _ = a.entry(eid)
        hg.need(entry['grant_id'] == gid, 'enrollment_outside_grant')
        if op == 'publish': return a.publish(eid)
        if op == 'send': return a.send(eid)
        if op == 'reconcile': return a.reconcile(eid)
        if op == 'release':
            hg.need(ba.ci.hex_field(body['preimage'], 64), 'preimage_mismatch')
            return a.resolve(eid, payment_preimage=body['preimage'])
        if op == 'fail': return a.resolve(eid)
        if op == 'retire':
            hg.need(body['confirmation'] == eid, 'confirmation_required')
            return a.retire(eid, confirmed=True)
        hg.need(op == 'evidence', 'remote_operation_refused')
        a.reconcile(eid)
        # Private execution evidence for this enrollment only. Never publish
        # this response in operator status/logs; it can contain the preimage.
        return dict(entry_id=eid, entry=copy.deepcopy(a.record['entries'][eid]), status=a.status(eid))
