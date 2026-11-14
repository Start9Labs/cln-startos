"""Explicit local retirement of resolved incoming history; disposable regtest.

No rune operation is added. Review is read-only; confirmation rechecks the node
and atomically retains the proof beside the original entry. This does not attest
to the other chain: the controller separately reviews the original outgoing
attempt. Confirmations and wallet ownership are trusted CLN observations.
"""
import copy
import bounded_authority as ba
import chain_recovery as chain
import held_gate as hg

FORMAT = 'swap-onchain-retirement-v1'
DEPTH = 100
OUTCOMES = {'release': ('claim_and_sweep_verified', 'onchain_claimed'),
            'fail': ('timeout_verified', 'onchain_timed_out')}


def closed_channel(a, pin):
    rows = a.rpc('listclosedchannels')
    hg.need(type(rows) is dict and type(rows.get('closedchannels')) is list,
            'closed_history_unavailable')
    matches = [r for r in rows['closedchannels'] if r.get('channel_id') == pin['channel_id']]
    hg.need(len(matches) == 1 and ba.equal(hg.channel_pin(matches[0], a.chain['profile']), pin),
            'closed_funding_changed')
    row = matches[0]
    hg.need(row.get('leased') is False and row.get('funding_withheld') is False
            and row.get('closer') == 'local' and ba.ci.hex_field(row.get('last_commitment_txid'),64),
            'closed_history_unresolved')
    return row['last_commitment_txid']


def proof_shape(value, phase):
    hg.need(type(value) is dict, 'retirement_proof_invalid')
    success = phase == 'claim_and_sweep_verified'
    names = ('commitment','success','sweep') if success else ('commitment','timeout')
    hg.need(set(value) == set(names)|{'heights'}|({'csv_delay','wallet_outputs'} if success else set()),
            'retirement_proof_invalid')
    hg.need(all(ba.ci.hex_field(value[k],64) for k in names)
            and len({value[k] for k in names}) == len(names)
            and type(value['heights']) is list and len(value['heights']) == len(names)
            and all(hg.integer(h,1,2**32-1) for h in value['heights'])
            and value['heights'] == sorted(value['heights']), 'retirement_proof_invalid')
    if success:
        hg.need(hg.integer(value['csv_delay'],1,2016)
                and type(value['wallet_outputs']) is list and bool(value['wallet_outputs'])
                and all(hg.integer(i,0,9999) for i in value['wallet_outputs'])
                and len(set(value['wallet_outputs'])) == len(value['wallet_outputs']), 'retirement_proof_invalid')


def validate(e, g):
    r = e['onchain_retirement']
    hg.need(ba.protected(g) and e.get('closing') is True and 'close' in e.get('protection',{})
            and type(r) is dict and set(r) == {'evidence','confirmation','confirmed_height','confirmed_at'},
            'retirement_record_invalid')
    v = r['evidence']; action = e.get('decision',{}).get('action')
    hg.need(action in OUTCOMES and type(v) is dict
            and set(v) == {'format','entry_id','grant_id','channel','htlc','decision','phase','proof'},
            'retirement_record_invalid')
    phase, outcome = OUTCOMES[action]
    expected = dict(format=FORMAT, entry_id=ba.digest(dict(grant_id=e['grant_id'],payload=e['payload'])),
        grant_id=e['grant_id'], channel=e['incoming']['binding']['channel'], htlc=e['htlc'], decision=e['decision'],
        phase=phase, proof=v['proof'])
    hg.need(ba.equal(v,expected) and e.get('terminal') == outcome and r['confirmation'] == ba.digest(v),
            'retirement_binding_changed')
    proof_shape(v['proof'], phase)
    hg.need(hg.integer(r['confirmed_height'],max(v['proof']['heights'])+DEPTH-1,2**32-1)
            and hg.integer(r['confirmed_at'],1,2**35-1), 'retirement_confirmation_invalid')


def snapshot(a, eid):
    e, g = a.entry(eid,'incoming')
    hg.need(ba.protected(g) and e.get('closing') is True and 'htlc' in e
            and 'close' in e.get('protection',{}) and e.get('decision',{}).get('action') in OUTCOMES,
            'retirement_not_ready')
    height = a.read_node(admission=True); pin = e['incoming']['binding']['channel']
    # A status string or a close reply is not completion. Require absence from
    # active channels AND an exact fully closed record, including signing type.
    rows = a.rpc('listpeerchannels')
    hg.need(type(rows) is dict and type(rows.get('channels')) is list, 'channels_unavailable')
    hg.need(not any(r.get('channel_id') == pin['channel_id'] for r in rows['channels']),
            'retirement_channel_not_closed')
    commitment = closed_channel(a,pin)
    rows = a.rpc('listtransactions'); funds = a.rpc('listfunds',spent=True)
    hg.need(type(rows) is dict and type(funds) is dict, 'chain_evidence_unavailable')
    result = chain.prove(dict(channel=pin,payment_hash=e['payload']['payment_hash'],
        incoming_amount_msat=e['payload']['amount_msat'],expiry=e['incoming']['expiry']),
        rows.get('transactions'),funds.get('outputs'),height,allow_spent=True)
    phase, _ = OUTCOMES[e['decision']['action']]
    hg.need(result.get('verified') is True and result['phase'] == phase, 'retirement_resolution_unverified')
    proof = result['proof']; proof_shape(proof,phase)
    hg.need(proof['commitment'] == commitment and height-max(proof['heights'])+1 >= DEPTH,
            'retirement_confirmations_insufficient')
    hg.need(a.read_node(admission=True) == height, 'chain_advanced_retry_inspection')
    value = dict(format=FORMAT,entry_id=eid,grant_id=e['grant_id'],channel=copy.deepcopy(pin),
        htlc=copy.deepcopy(e['htlc']),decision=copy.deepcopy(e['decision']),phase=phase,proof=proof)
    return value, height


def recheck(a, eid):
    e, _ = a.entry(eid,'incoming'); r = e['onchain_retirement']
    value, height = snapshot(a,eid)
    hg.need(ba.equal(value,r['evidence']) and height >= r['confirmed_height'], 'retirement_evidence_regressed')
    return value, height


def summary(value, height, confirmed, chain):
    return dict(confirmation=ba.digest(value),entry_id=value['entry_id'],phase=value['phase'],
        checked_height=height,minimum_confirmations=DEPTH,confirmed=confirmed,
        read_only=True,regtest_only=hg.regtest(chain),confirmation_source='paired_cln',independent_chain_proof=False,
        next_step='Review the original outgoing attempt in the controller before retiring the swap.')


def review(a, eid):
    e, _ = a.entry(eid,'incoming')
    value, height = recheck(a,eid) if 'onchain_retirement' in e else snapshot(a,eid)
    return summary(value,height,'onchain_retirement' in e,a.chain)


def confirm(a, eid, confirmation, *, confirmed=False):
    hg.need(confirmed is True, 'confirmation_required')
    e, g = a.entry(eid,'incoming')
    value, height = recheck(a,eid) if 'onchain_retirement' in e else snapshot(a,eid)
    hg.need(type(confirmation) is str and confirmation == ba.digest(value), 'exact_confirmation_required')
    if 'onchain_retirement' not in e:
        e['onchain_retirement'] = dict(evidence=value,confirmation=confirmation,
            confirmed_height=height,confirmed_at=int(a.clock()))
        e['terminal'] = OUTCOMES[e['decision']['action']][1]
        validate(e,g); a.update(eid,e)
    result = summary(value,height,True,a.chain); result['read_only'] = False
    return result
