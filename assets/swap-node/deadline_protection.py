"""Explicit, local protection of one recorded incoming HTLC; regtest only.

An armed enrollment authorizes at most one close dispatch, to its actual funding
pin, at the reviewed boundary. Close intent is durable before RPC. An ambiguous
dispatch is never repeated. Neither a reply nor a preimage is settlement proof.
"""
import copy

import bounded_authority as ba
import held_gate as hg

CLOSE_BEFORE = 72
FORMAT = 'swap-deadline-protection-v1'


def validate_entry(e, grant):
    p = e['protection']
    hg.need(ba.protected(grant) and 'incoming' in e and 'htlc' in e
            and type(p) is dict and set(p) in ({'armed_height'}, {'armed_height','close'})
            and hg.integer(p['armed_height'], 0, 2**32-1), 'protection_record_invalid')
    expiry = e['incoming']['expiry']
    hg.need(e['payload']['min_cltv_delta'] <= expiry-p['armed_height'] <= e['payload']['max_cltv_delta'],
            'protection_armed_too_late')
    if 'close' in p:
        c = p['close']
        hg.need(type(c) is dict and set(c) == {'height','channel','htlc'}
                and hg.integer(c['height'], max(p['armed_height'], expiry-CLOSE_BEFORE), 2**32-1)
                and ba.equal(c['channel'], e['incoming']['binding']['channel'])
                and ba.equal(c['htlc'], e['htlc']), 'protection_close_binding_changed')


def arm(a, eid):
    e, g = a.entry(eid, 'incoming')
    hg.need(ba.protected(g), 'protection_not_granted')
    if 'protection' in e:
        a.reconcile(eid)
        return a.status(eid)
    a.active(e['grant_id']); height = a.read_node(admission=True)
    a.reconcile(eid); e, g = a.entry(eid, 'incoming')
    hg.need('incoming' in e and 'decision' not in e and 'terminal' not in e, 'protection_not_held')
    a.channel(e['incoming']['binding']['channel'])
    # Re-read after all observations. Independent chain heights are never subtracted.
    height = a.read_node(admission=True)
    e['protection'] = dict(armed_height=height)
    validate_entry(e, g); a.update(eid, e)
    return a.status(eid)


def protect(a, eid):
    e, g = a.entry(eid, 'incoming')
    hg.need(ba.protected(g), 'protection_not_granted')
    if 'protection' not in e or 'terminal' in e: return a.status(eid)
    # Recovery survives admission expiry and pause; restore barriers still apply.
    a.reconcile(eid); e, g = a.entry(eid, 'incoming')
    if 'terminal' in e or e.get('decision', {}).get('action') == 'fail': return a.status(eid)
    p = e['protection']; pin = e['incoming']['binding']['channel']
    row = a.channel(pin, recovery=True)
    if row['state'] != 'CHANNELD_NORMAL' or 'close' in p: return a.status(eid)
    height = a.read_node(admission=True)
    if e['incoming']['expiry']-height > CLOSE_BEFORE: return a.status(eid)
    # Reconcile again immediately before committing: original funding, HTLC,
    # expiry and gate decision must still agree. No caller-selected close ID.
    a.reconcile(eid); e, _ = a.entry(eid, 'incoming')
    if 'terminal' in e or e.get('decision', {}).get('action') == 'fail': return a.status(eid)
    a.channel(pin)
    e['protection']['close'] = dict(height=height, channel=copy.deepcopy(pin), htlc=copy.deepcopy(e['htlc']))
    a.update(eid, e)
    a.rpc('close', id=pin['channel_id'], unilateraltimeout=1)
    return a.status(eid)  # Acknowledgment is deliberately not journaled as proof.


def inspect(a, eid):
    """Fresh, scoped chain evidence. Never caches a proof across a reorg/error."""
    import chain_recovery as chain
    e, g = a.entry(eid, 'incoming')
    hg.need(ba.protected(g) and 'protection' in e, 'protection_not_armed')
    height = a.read_node(admission=True)
    pin = e['incoming']['binding']['channel']
    a.channel(pin, recovery=True)
    rows = a.rpc('listtransactions'); funds = a.rpc('listfunds', spent=True)
    hg.need(type(rows) is dict and type(funds) is dict, 'chain_evidence_unavailable')
    result = chain.prove(dict(channel=pin, payment_hash=e['payload']['payment_hash'],
        incoming_amount_msat=e['payload']['amount_msat'], expiry=e['incoming']['expiry']),
        rows.get('transactions'), funds.get('outputs'), height, allow_spent=True)
    hg.need(a.read_node(admission=True) == height, 'chain_advanced_retry_inspection')
    return dict(format=FORMAT, entry_id=eid, height=height, **result, read_only=True,
                confirmation_source='paired_cln', independent_chain_proof=False, regtest_only=hg.regtest(a.chain))
