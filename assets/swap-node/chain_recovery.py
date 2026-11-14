"""Scoped raw-transaction checks for this pinned non-lease channel template.

Adapted from the existing controller's claim_verification.py. Hashes, funding
links, HTLC scripts, preimages, locktimes and CSV spends are checked locally.
Heights and wallet ownership are authenticated CLN observations, NOT independent
chain proofs. Results are fresh reads, never durable authorization or automatic
permission to reuse a closed channel. Both supported chains use SHA256 txids.
"""
import hashlib
import re
from held_gate import need as require

def sha(value):return hashlib.sha256(value).digest()


class Wire:
    def __init__(self,raw):self.raw=raw;self.pos=0
    def take(self,n):
        require(0<=n<=len(self.raw)-self.pos,'truncated_transaction')
        value=self.raw[self.pos:self.pos+n];self.pos+=n;return value
    def num(self,n):return int.from_bytes(self.take(n),'little')
    def varint(self):
        n=self.num(1)
        if n<253:return n
        size={253:2,254:4,255:8}[n];value=self.num(size)
        require(value>={2:253,4:65536,8:4294967296}[size],'noncanonical_varint')
        return value
    def vector(self):return self.take(self.varint())


def transaction(rawhex):
    require(type(rawhex) is str and 20<=len(rawhex)<=8000000 and len(rawhex)%2==0
            and re.fullmatch('[0-9a-fA-F]+',rawhex),'invalid_raw_transaction')
    w=Wire(bytes.fromhex(rawhex));version=w.take(4)
    segwit=w.raw[w.pos:w.pos+2]==b'\x00\x01'
    if segwit:w.take(2)
    start=w.pos;n=w.varint();require(0<n<=10000,'invalid_input_count')
    inputs=[]
    for _ in range(n):
        txid=w.take(32)[::-1].hex();index=w.num(4);w.vector();sequence=w.num(4)
        inputs.append(dict(txid=txid,index=index,sequence=sequence,witness=[]))
    n=w.varint();require(0<n<=10000,'invalid_output_count');outputs=[]
    for _ in range(n):
        amount=w.num(8);require(amount<=2100000000000000,'invalid_output_value')
        outputs.append(dict(amount_msat=amount*1000,script=w.vector()))
    stripped=version+w.raw[start:w.pos]
    if segwit:
        for txin in inputs:
            n=w.varint();require(n<=10000,'invalid_witness_count')
            txin['witness']=[w.vector() for _ in range(n)]
    locktime=w.take(4);require(w.pos==len(w.raw),'trailing_transaction_data')
    return dict(txid=sha(sha(stripped+locktime))[::-1].hex(),version=int.from_bytes(version,'little'),
                locktime=int.from_bytes(locktime,'little'),inputs=inputs,outputs=outputs)


def csv_delay(script):
    # Exact non-lease to_local template used by these pinned regtest channels.
    w=Wire(script);require(w.take(2)==b'\x63\x21','unsupported_delayed_script')
    require(w.take(33)[0] in (2,3) and w.take(1)==b'\x67','unsupported_delayed_script')
    op=w.num(1)
    if 81<=op<=96:delay=op-80
    else:
        require(1<=op<=3,'invalid_csv_delay');value=w.take(op)
        require(not value[-1]&128 and (value[-1]!=0 or (len(value)>1 and value[-2]&128)),'noncanonical_csv_delay')
        delay=int.from_bytes(value,'little');require(delay>16,'noncanonical_csv_delay')
    require(1<=delay<=2016 and w.take(3)==b'\xb2\x75\x21','unsupported_delayed_script')
    require(w.take(33)[0] in (2,3) and w.take(2)==b'\x68\xac' and w.pos==len(script),'unsupported_delayed_script')
    return delay


def p2wsh(script,witness):return script==b'\x00\x20'+sha(witness)


def prove(spec,rows,funds,height,*,allow_spent=False):
    """No fixture-provided transaction IDs; discover descendants of funding."""
    require(type(height) is int and height>0 and type(rows) is list and len(rows)<=10000 and type(funds) is list,'invalid_chain_evidence')
    confirmed={}
    for row in rows:
        h=row.get('blockheight')
        require(type(h) is int and 0<=h<=height,'invalid_confirmation_height')
        if not h:continue
        tx=transaction(row.get('rawtx'));require(tx['txid']==row.get('hash'),'transaction_hash_mismatch')
        require(tx['txid'] not in confirmed,'duplicate_transaction')
        tx['height']=h;confirmed[tx['txid']]=tx
    def spends(tx,txid,index):return [i for i in tx['inputs'] if i['txid']==txid and i['index']==index]
    pin=spec['channel']
    commits=[t for t in confirmed.values() if spends(t,pin['funding_txid'],pin['funding_outnum'])]
    require(len(commits)<=1,'ambiguous_commitment')
    if not commits:return dict(phase='awaiting_commitment',verified=False)
    commit=commits[0];successes=[];timeouts=[]
    for n,output in enumerate(commit['outputs']):
        if output['amount_msat']!=spec['incoming_amount_msat']:continue
        for tx in confirmed.values():
            for txin in spends(tx,commit['txid'],n):
                witness=txin['witness']
                require(witness and p2wsh(output['script'],witness[-1]),'htlc_witness_mismatch')
                received_script(witness[-1],spec['payment_hash'],spec['expiry'])
                if len(witness)==3 and witness[1]==b'':
                    require(tx['locktime']>=spec['expiry'] and tx['locktime']<500000000
                            and txin['sequence']<0xffffffff and tx['height']>spec['expiry'], 'premature_htlc_timeout')
                    timeouts.append(dict(commitment=commit['txid'],timeout=tx['txid'],
                                         heights=[commit['height'],tx['height']]))
                    continue
                require(len(witness)==5 and witness[0]==b'' and len(witness[-2])==32,'not_htlc_success')
                require(sha(witness[-2]).hex()==spec['payment_hash'],'htlc_preimage_mismatch')
                require(commit['height']<=tx['height']<spec['expiry'],'late_htlc_claim')
                successes.append(tx)
    require(len(successes)+len(timeouts)<=1,'ambiguous_htlc_resolution')
    if timeouts:return dict(phase='timeout_verified',verified=True,proof=timeouts[0])
    if not successes:return dict(phase='awaiting_htlc_success',verified=False)
    success=successes[0];sweeps=[]
    for n,output in enumerate(success['outputs']):
        if not 0<output['amount_msat']<=spec['incoming_amount_msat']:continue
        for tx in confirmed.values():
            for txin in spends(tx,success['txid'],n):
                witness=txin['witness']
                require(len(witness)==3 and witness[1]==b'' and p2wsh(output['script'],witness[-1]),'delayed_witness_mismatch')
                delay=csv_delay(witness[-1]);sequence=txin['sequence']
                require(tx['version']>=2 and not sequence&((1<<31)|(1<<22)) and (sequence&65535)>=delay,'invalid_csv_sequence')
                require(tx['height']-success['height']>=delay,'premature_csv_sweep')
                owned=[]
                for f in funds:
                    if f.get('txid')!=tx['txid'] or f.get('status') not in (('confirmed','spent') if allow_spent else ('confirmed',)):continue
                    index=f.get('output');require(type(index) is int and 0<=index<len(tx['outputs']),'invalid_wallet_outpoint')
                    o=tx['outputs'][index]
                    require(type(f.get('amount_msat')) is int and f['amount_msat']==o['amount_msat'] and
                            f.get('scriptpubkey')==o['script'].hex() and
                            (f.get('blockheight')==tx['height'] or (allow_spent and f.get('status')=='spent'
                             and 'blockheight' not in f)), 'wallet_output_mismatch')
                    require(index not in owned,'duplicate_wallet_output');owned.append(index)
                # A wallet fee input may be aggregated into this spend. Require
                # every value-bearing output to return to the wallet, rather
                # than inventing a percentage limit on the one HTLC input.
                require(owned and sum(tx['outputs'][i]['amount_msat'] for i in owned)>0
                        and all(i in owned or o['amount_msat']==0 for i,o in enumerate(tx['outputs'])),
                        'wallet_sweep_not_confirmed')
                sweeps.append(dict(commitment=commit['txid'],success=success['txid'],sweep=tx['txid'],csv_delay=delay,
                                   heights=[commit['height'],success['height'],tx['height']],wallet_outputs=owned))
    require(len(sweeps)<=1,'ambiguous_csv_sweep')
    if not sweeps:return dict(phase='awaiting_csv_sweep',verified=False)
    return dict(phase='claim_and_sweep_verified',verified=True,proof=sweeps[0])



def script_number(n):
    if 1<=n<=16:return bytes([80+n])
    raw=n.to_bytes((n.bit_length()+7)//8,'little')
    if raw[-1]&128:raw+=b'\x00'
    return bytes([len(raw)])+raw


def received_script(script,payment_hash,expiry):
    w=Wire(script)
    require(w.take(3)==b'\x76\xa9\x14','unsupported_htlc_script');w.take(20)
    require(w.take(5)==b'\x87\x63\xac\x67\x21','unsupported_htlc_script')
    require(w.take(33)[0] in (2,3),'unsupported_htlc_script')
    require(w.take(8)==b'\x7c\x82\x01\x20\x87\x63\xa9\x14', 'unsupported_htlc_script')
    require(w.take(20)==hashlib.new('ripemd160',bytes.fromhex(payment_hash)).digest(),'htlc_script_hash_mismatch')
    require(w.take(4)==b'\x88\x52\x7c\x21','unsupported_htlc_script')
    require(w.take(33)[0] in (2,3),'unsupported_htlc_script')
    tail=b'\x52\xae\x67\x75'+script_number(expiry)+b'\xb1\x75\xac\x68'
    require(w.take(len(tail))==tail,'htlc_script_expiry_mismatch')
    require(w.take(len(script)-w.pos) in (b'\x68',b'\x51\xb2\x75\x68'),'unsupported_htlc_script')
