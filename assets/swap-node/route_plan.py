"""Protocol-bound read-only route adapter. Explicit environment and protocol binding.

A plan is data, never a grant. No payment, layer, credential or journal writes.
The future coordinator must revalidate the invoice/channel, reserve authority
and persist a send intent before using a plan. Observation never retries a send.
"""
import copy
import hashlib
import json
import time

import chain_identity as ci
from held_gate import binding, channel_pin, integer, need, scid, validate_pin

FORMAT = 'swap-route-plan-v1'
LIMIT_KEYS = {'max_fee_msat', 'max_delay_blocks', 'max_hops'}
READ_METHODS = frozenset(('getinfo', 'decode', 'listpeerchannels', 'getroutes', 'listsendpays'))


class RouteAdmissionError(ValueError):
    def __init__(self, reason, **details):
        super().__init__(reason)
        self.details = details


class RPCError(ValueError):
    """Transport adapter supplies only a numeric RPC code, never raw replies."""
    def __init__(self, code=None, *, unknown_destination=False):
        super().__init__('route_rpc_unavailable')
        self.code = code if type(code) is int else None
        self.unknown_destination = unknown_destination is True


def limits(value):
    need(type(value) is dict and set(value) == LIMIT_KEYS, 'route_limits_invalid')
    need(integer(value['max_fee_msat'], 0, 10000)
         and integer(value['max_delay_blocks'], 1, 576)
         and integer(value['max_hops'], 1, 4), 'route_limits_invalid')
    return value


def pubkey(value):
    ci.binding(ci.BTC, 'regtest', value)
    return value


def validate_route(route, source, destination, amount, final_cltv, bounds):
    limits(bounds)
    pubkey(source); pubkey(destination)
    need(source != destination and integer(amount, 1, 10000010000)
         and integer(final_cltv, 1, bounds['max_delay_blocks']), 'route_endpoints_invalid')
    need(type(route) is list and 1 <= len(route) <= bounds['max_hops'], 'route_hop_limit')
    nodes, channels = {source}, set()
    previous_amount, previous_delay = amount + bounds['max_fee_msat'], bounds['max_delay_blocks']
    for hop in route:
        need(type(hop) is dict and set(hop) == {'id', 'channel', 'amount_msat', 'delay'}, 'route_fields_invalid')
        pubkey(hop['id'])
        need(hop['id'] not in nodes and scid(hop['channel']) and hop['channel'] not in channels,
             'route_loop_or_channel_invalid')
        need(integer(hop['amount_msat'], amount, previous_amount)
             and integer(hop['delay'], final_cltv, previous_delay), 'route_fee_or_delay_limit')
        nodes.add(hop['id']); channels.add(hop['channel'])
        previous_amount, previous_delay = hop['amount_msat'], hop['delay']
    need(route[-1] == dict(id=destination, channel=route[-1]['channel'], amount_msat=amount, delay=final_cltv),
         'route_recipient_changed')
    return route


def convert(reply, source, destination, amount, final_cltv, bounds):
    need(type(reply) is dict and type(reply.get('routes')) is list and len(reply['routes']) == 1,
         'one_route_required')
    chosen = reply['routes'][0]
    need(type(chosen) is dict and type(chosen.get('amount_msat')) is int and chosen['amount_msat'] == amount
         and type(chosen.get('final_cltv')) is int and chosen['final_cltv'] == final_cltv
         and type(chosen.get('path')) is list and 1 <= len(chosen['path']) <= bounds['max_hops'],
         'planner_amount_delay_or_hops_changed')
    previous, result = None, []
    for hop in chosen['path']:
        need(type(hop) is dict and type(hop.get('short_channel_id_dir')) is str, 'planner_path_invalid')
        directed = hop['short_channel_id_dir'].split('/')
        need(len(directed) == 2 and scid(directed[0]) and directed[1] in ('0', '1'), 'planner_channel_invalid')
        a, b = pubkey(hop.get('node_id_in')), pubkey(hop.get('node_id_out'))
        need(int(directed[1]) == int(a > b), 'planner_direction_changed')
        need(all(integer(hop.get(k), 0, 2**63-1) for k in ('amount_in_msat', 'amount_out_msat', 'cltv_in', 'cltv_out'))
             and hop['amount_in_msat'] >= hop['amount_out_msat'] and hop['cltv_in'] >= hop['cltv_out'],
             'planner_fee_or_delay_invalid')
        if previous is None:
            need(a == source and hop['amount_in_msat'] == hop['amount_out_msat']
                 and hop['cltv_in'] == hop['cltv_out'], 'planner_source_not_free')
        else:
            need(a == previous['node_id_out'] and hop['amount_in_msat'] == previous['amount_out_msat']
                 and hop['cltv_in'] == previous['cltv_out'], 'planner_path_discontinuous')
        result.append(dict(id=b, channel=directed[0], amount_msat=hop['amount_out_msat'], delay=hop['cltv_out']))
        previous = hop
    return validate_route(result, source, destination, amount, final_cltv, bounds)


def hinted_tail(hint, source, destination, amount, final_cltv, bounds):
    need(type(hint) is list and 1 <= len(hint) <= bounds['max_hops'], 'hint_length_invalid')
    nodes, channels = {destination}, set()
    for index, hop in enumerate(hint):
        need(type(hop) is dict and set(hop) == {'pubkey', 'short_channel_id', 'fee_base_msat',
             'fee_proportional_millionths', 'cltv_expiry_delta'}, 'hint_fields_invalid')
        pubkey(hop['pubkey'])
        need(hop['pubkey'] not in nodes and (hop['pubkey'] != source or index == 0)
             and scid(hop['short_channel_id']) and hop['short_channel_id'] not in channels,
             'hint_loop_or_channel_invalid')
        need(integer(hop['fee_base_msat'], 0, 2**32-1)
             and integer(hop['fee_proportional_millionths'], 0, 2**32-1)
             and integer(hop['cltv_expiry_delta'], 0, 65535), 'hint_fee_or_delay_invalid')
        nodes.add(hop['pubkey']); channels.add(hop['short_channel_id'])
    tail, entry, delay = [], destination, final_cltv
    for hop in reversed(hint):
        tail.insert(0, dict(id=entry, channel=hop['short_channel_id'], amount_msat=amount, delay=delay))
        if hop['pubkey'] != source:
            amount += hop['fee_base_msat'] + amount * hop['fee_proportional_millionths'] // 1000000
            delay += hop['cltv_expiry_delta']
        entry = hop['pubkey']
    return tail, entry, amount, delay


def query(rpc, source, destination, amount, final_cltv, bounds):
    return rpc('getroutes', source=source, destination=destination, amount_msat=amount,
               layers=['auto.localchans', 'auto.sourcefree'], maxfee_msat=bounds['max_fee_msat'],
               final_cltv=final_cltv, maxdelay=bounds['max_delay_blocks'], maxparts=1)


def search(rpc, decoded, source, bounds):
    destination, amount = decoded['payee'], decoded['amount_msat']
    final_cltv = max(40, decoded['min_final_cltv_expiry'])
    need(final_cltv <= bounds['max_delay_blocks'], 'route_fee_or_delay_limit')
    hints = decoded.get('routes', [])
    need(type(hints) is list and len(hints) <= 8, 'hint_count_invalid')
    unknown_destination = False
    failures = {}
    def rejected(reason): failures[reason] = failures.get(reason, 0) + 1
    try:
        reply = query(rpc, source, destination, amount, final_cltv, bounds)
    except RPCError as error:
        # These are read-only candidate searches, never payment retries.
        if error.code not in (205, 206): raise
        unknown_destination = error.unknown_destination
    else:
        return convert(reply, source, destination, amount, final_cltv, bounds)
    for hint in hints:
        # Malformed authenticated hints remain errors, not guesses to repair.
        tail, entry, entry_amount, entry_delay = hinted_tail(hint, source, destination, amount, final_cltv, bounds)
        if entry_amount-amount > bounds['max_fee_msat']:
            rejected('route_hint_fee_limit'); continue
        if entry_delay > bounds['max_delay_blocks']:
            rejected('route_hint_delay_limit'); continue
        prefix = []
        if entry != source:
            if len(tail) >= bounds['max_hops']:
                rejected('route_hint_hop_limit'); continue
            prefix_bounds = dict(bounds, max_fee_msat=bounds['max_fee_msat']-(entry_amount-amount),
                                 max_hops=bounds['max_hops']-len(tail))
            try:
                reply = query(rpc, source, entry, entry_amount, entry_delay, prefix_bounds)
            except RPCError as error:
                if error.code not in (205, 206): raise
                rejected('route_hint_entry_unknown' if error.unknown_destination else 'route_hint_path_unavailable')
                continue
            prefix = convert(reply, source, entry, entry_amount, entry_delay, prefix_bounds)
        result = prefix + tail
        if len({source, *(h['id'] for h in result)}) != len(result)+1 or len({h['channel'] for h in result}) != len(result):
            rejected('route_hint_path_unavailable'); continue
        return validate_route(result, source, destination, amount, final_cltv, bounds)
    reason = ('recipient_route_unknown' if unknown_destination and not hints else
              next(iter(failures)) if len(failures)==1 else 'bounded_route_unavailable')
    raise RouteAdmissionError(reason, route_hint_count=len(hints), **bounds, **failures)

def validate_plan(plan):
    need(type(plan) is dict and set(plan) == {'schema', 'format', 'chain', 'invoice', 'payment_hash',
         'payment_secret', 'recipient', 'amount_msat', 'created_at', 'expires_at', 'limits', 'channel', 'route'},
         'plan_fields_invalid')
    need(type(plan['schema']) is int and plan['schema'] == 1 and plan['format'] == FORMAT, 'plan_format_invalid')
    binding(plan['chain']); limits(plan['limits'])
    need(ci.invoice_text(plan['invoice'],plan['chain']),
         'plan_invoice_invalid')
    need(ci.hex_field(plan['payment_hash'], 64) and ci.hex_field(plan['payment_secret'], 64)
         and integer(plan['amount_msat'], 1, 10000000000 if plan['chain']['profile']==ci.PRIVKEYIO_XBT else 1000000000)
         and integer(plan['created_at'], 1, 2**35-1)
         and integer(plan['expires_at'], plan['created_at']+1, 2**35-1), 'plan_terms_invalid')
    validate_pin(plan['channel'], plan['chain']['profile'])
    need(type(plan['route']) is list and 1 <= len(plan['route']) <= plan['limits']['max_hops']
         and type(plan['route'][-1]) is dict, 'plan_route_invalid')
    final_cltv = plan['route'][-1].get('delay')
    need(integer(final_cltv, 40, plan['limits']['max_delay_blocks']), 'recipient_invoice_cltv_limit')
    validate_route(plan['route'], plan['chain']['node_id'], plan['recipient'], plan['amount_msat'], final_cltv, plan['limits'])
    first = plan['route'][0]
    need(first['channel'] == plan['channel']['short_channel_id'] and first['id'] == plan['channel']['peer_id'],
         'plan_first_hop_changed')
    return plan


def digest(plan):
    validate_plan(plan)
    return hashlib.sha256(json.dumps(plan, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def plan(rpc, chain, invoice, approved_channels, bounds, *, clock=time.time):
    binding(chain); limits(bounds)
    need(ci.invoice_text(invoice,chain), 'recipient_invoice_invalid')
    ci.same_binding(chain, ci.node(rpc('getinfo'), chain['profile'], chain['environment']))
    decoded = ci.invoice(rpc('decode', string=invoice), chain['profile'], chain['environment'])
    now = int(clock())
    need(integer(decoded.get('created_at'), 1, now) and integer(decoded.get('expiry'), 1, 2**35-1)
         and now+120 <= decoded['created_at']+decoded['expiry'] < 2**35,
         'recipient_invoice_timing')
    need(integer(decoded['amount_msat'], 1, 10000000000 if chain['profile']==ci.PRIVKEYIO_XBT else 1000000000), 'recipient_invoice_limits')
    need(integer(decoded.get('min_final_cltv_expiry'), 1, bounds['max_delay_blocks']),
         'recipient_invoice_cltv_limit')
    need(type(approved_channels) is list and 1 <= len(approved_channels) <= 8, 'approved_channels_invalid')
    for pin in approved_channels:
        validate_pin(pin, chain['profile'])
    for field in ('channel_id', 'short_channel_id'):
        need(len({p[field] for p in approved_channels}) == len(approved_channels), 'duplicate_channel')
    reply = rpc('listpeerchannels')
    need(type(reply) is dict and type(reply.get('channels')) is list, 'channels_unavailable')
    rows = reply['channels']
    # Reject changed/missing pins before querying public gossip.
    for pin in approved_channels:
        matches = [r for r in rows if r.get('channel_id') == pin['channel_id']]
        need(len(matches) == 1 and channel_pin(matches[0], chain['profile']) == pin, 'approved_channel_changed')
    route = search(rpc, decoded, chain['node_id'], bounds)
    pins = [p for p in approved_channels if p['short_channel_id'] == route[0]['channel'] and p['peer_id'] == route[0]['id']]
    need(len(pins) == 1, 'route_outside_approved_channels')
    row = next(r for r in rows if r['channel_id'] == pins[0]['channel_id'])
    need(row.get('state') == 'CHANNELD_NORMAL' and row.get('peer_connected') is True
         and row.get('reestablished') is True and row.get('lost_state', False) is False
         and row.get('htlcs') == [] and integer(row.get('spendable_msat'), route[0]['amount_msat'], 2**63-1),
         'outgoing_channel_not_ready')
    return copy.deepcopy(validate_plan(dict(schema=1, format=FORMAT, chain=chain, invoice=invoice,
        payment_hash=decoded['payment_hash'], payment_secret=decoded['payment_secret'], recipient=decoded['payee'],
        amount_msat=decoded['amount_msat'], created_at=now, expires_at=decoded['created_at']+decoded['expiry'],
        limits=bounds, channel=pins[0], route=route)))


ATTEMPT_FIELDS = ('payment_hash', 'groupid', 'partid', 'destination', 'amount_msat', 'amount_sent_msat',
                  'created_index', 'created_at')


def observe_attempt(rpc, saved_plan, original=None):
    """Zero rows means UNKNOWN, never failed or permission to submit again.

    This reads wallet history even after invoice expiry. A complete row must
    prove the hash; persisted attempt identity must never change. This does not
    inspect the incoming chain or authorize release of an incoming HTLC.
    """
    validate_plan(saved_plan)
    chain = saved_plan['chain']
    ci.same_binding(chain, ci.node(rpc('getinfo'), chain['profile'], chain['environment']))
    reply = rpc('listsendpays', payment_hash=saved_plan['payment_hash'])
    need(type(reply) is dict and type(reply.get('payments')) is list, 'attempts_unavailable')
    rows = reply['payments']
    if not rows:
        need(original is None, 'original_attempt_missing')
        return {'state': 'not_observed'}
    need(len(rows) == 1 and type(rows[0]) is dict, 'one_attempt_required')
    row = rows[0]
    expected = dict(payment_hash=saved_plan['payment_hash'], groupid=1, partid=0,
                    destination=saved_plan['recipient'], amount_msat=saved_plan['amount_msat'],
                    amount_sent_msat=saved_plan['route'][0]['amount_msat'])
    # Core omits partid for a non-MPP payment. No other missing field defaults.
    observed = dict(row, partid=row.get('partid', 0))
    need(all(type(observed.get(k)) is type(v) and observed.get(k) == v for k, v in expected.items())
         and integer(row.get('created_index'), 1, 2**64-1) and integer(row.get('created_at'), 1, 2**35-1)
         and ci.invoice_text(row.get('bolt11'), chain)
         and row['bolt11'].lower() == saved_plan['invoice'].lower(), 'attempt_changed')
    identity = {k: observed[k] for k in ATTEMPT_FIELDS}
    if original is not None:
        need(type(original) is dict and set(original) == set(ATTEMPT_FIELDS)
             and all(type(original[k]) is type(identity[k]) and original[k] == identity[k] for k in identity),
             'attempt_changed')
    status = row.get('status')
    need(status in ('pending', 'complete', 'failed'), 'attempt_status_invalid')
    result = dict(state=status, identity=identity)
    if status == 'complete':
        preimage = row.get('payment_preimage')
        need(ci.hex_field(preimage, 64) and hashlib.sha256(bytes.fromhex(preimage)).hexdigest() == saved_plan['payment_hash'],
             'attempt_preimage_invalid')
        result['preimage'] = preimage
    else:
        need('payment_preimage' not in row, 'attempt_preimage_unexpected')
    return result
