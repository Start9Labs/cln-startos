"""Freshly scoped planning/publication credentials; disposable regtest only.

Old remote journals and runes remain on the old method and operation set.
Local setup explicitly approves this additional read/sign capability. Payment
and release still use the same immutable bounded authority underneath.
"""
import copy

import bounded_authority as ba
import customer_invoice as invoice
import held_gate as hg
import remote_authority as base
import route_plan as rp

FORMAT = 'swap-customer-remote-v1'
CALL = 'swap-customer-call'
CREDENTIAL = 'swap-customer-credential'
OPERATIONS = {kind: ops+('inspect',)+(('invoice',) if kind == 'incoming' else ('plan',))
              for kind, ops in base.OPERATIONS.items()}
METHODS = ba.METHODS | base.SETUP_METHODS | {'signinvoice', 'getroutes', 'listfunds', 'close', 'listtransactions'}


def operations(grant):
    return OPERATIONS[grant['kind']] + (('arm', 'protect', 'chain') if ba.protected(grant) else ())


def initialize_fixture(directory, chain):
    base.initialize_fixture(directory, chain, format_name=FORMAT)


def reserve(reply):
    hg.need(type(reply) is dict and type(reply.get('outputs')) is list, 'reserve_unavailable')
    total = 0; seen = set()
    for row in reply['outputs']:
        hg.need(type(row) is dict and ba.ci.hex_field(row.get('txid'), 64)
                and hg.integer(row.get('output'), 0, 2**32-1)
                and hg.integer(row.get('amount_msat'), 0, 2**63-1)
                and type(row.get('reserved')) is bool and type(row.get('status')) is str, 'reserve_unavailable')
        key = (row['txid'], row['output']); hg.need(key not in seen, 'reserve_duplicate_output'); seen.add(key)
        if row['status'] == 'confirmed' and not row['reserved']: total += row['amount_msat']
    return total


class Remote(base.Remote):
    format_name, method, operations = FORMAT, CALL, OPERATIONS

    def __init__(self, authority, journal, setup_rpc, publisher):
        self.publisher = publisher
        super().__init__(authority, journal, setup_rpc)

    def guard(self):
        super().guard(); self.publisher.guard()

    def restrictions(self, gid, kind):
        g = self.authority.record['grants'][gid]['terms']
        hg.need(kind == g['kind'], 'credential_scope_invalid')
        return base.restrictions(gid, kind, operations={kind:operations(g)}, method=self.method)

    def call(self, params):
        self.guard()
        hg.need(type(params) is dict and set(params) == {'grant_id', 'operation', 'body'}, 'remote_parameters_invalid')
        if params['operation'] not in ('plan', 'inspect', 'invoice', 'arm', 'protect', 'chain'):
            return super().call(params)
        gid, op, body = (params[k] for k in ('grant_id', 'operation', 'body'))
        info = super().call(dict(grant_id=gid, operation='info', body={}))
        g = info['grant']; a = self.authority
        hg.need(op in operations(g) and type(body) is dict, 'remote_operation_refused')
        if op in ('arm', 'protect', 'chain'):
            import deadline_protection as protection
            hg.need(set(body) == {'entry_id'}, 'remote_parameters_invalid')
            e, _ = a.entry(body['entry_id'], 'incoming')
            hg.need(e['grant_id'] == gid, 'enrollment_outside_grant')
            return {'arm':protection.arm, 'protect':protection.protect, 'chain':protection.inspect}[op](a, body['entry_id'])
        if op == 'plan':
            hg.need(set(body) == {'invoice'}, 'remote_parameters_invalid')
            a.active(gid)
            plan = rp.plan(a.rpc, a.chain, body['invoice'], g['channels'],
                {k:g['limits'][k] for k in rp.LIMIT_KEYS}, clock=a.clock)
            ba.payload(plan, g)
            return plan
        if op == 'inspect':
            enrolled = set(body) == {'entry_id'}
            if enrolled:
                e, _ = a.entry(body['entry_id'], g['kind'])
                hg.need(e['grant_id'] == gid, 'enrollment_outside_grant')
            else:
                hg.need(set(body) == ({'amount_msat'} if g['kind'] == 'incoming' else set()), 'remote_parameters_invalid')
            height = a.read_node(admission=True)
            result = dict(format=FORMAT, checked_at=int(a.clock()), info=info,
                          blockheight=height, reserve_msat=reserve(a.rpc('listfunds')))
            if enrolled:
                # Same scoped read authority, exact enrollment only. A held
                # channel is no longer available to advertise another invoice.
                result['entry_id'] = body['entry_id']
                pin = e['payload']['channel'] if g['kind'] == 'outgoing' else e.get('incoming', {}).get('binding', {}).get('channel')
                row = a.channel(pin) if pin is not None else None
                result['channel_ready'] = row is not None and row.get('peer_connected') is True \
                    and row.get('reestablished') is True and (g['kind'] == 'incoming' or row['htlcs'] == [])
            elif g['kind'] == 'incoming':
                amount = body['amount_msat']
                hg.need(hg.integer(amount, 1, g['limits']['max_amount_msat']), 'outside_grant')
                # Hints describe reachability; approved funding pins remain in
                # the grant and actual arriving HTLC decides the binding.
                result['hints'] = invoice.select_hints(a, dict(amount_msat=amount, approved_channels=g['channels']))
            return copy.deepcopy(result)
        hg.need(set(body) == {'entry_id'}, 'remote_parameters_invalid')
        e, _ = a.entry(body['entry_id'], 'incoming')
        hg.need(e['grant_id'] == gid, 'enrollment_outside_grant')
        return self.publisher.issue(body['entry_id'])
