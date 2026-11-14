#!/usr/bin/python3 -I
"""Local administrator opt-in; automatic scoped grants, never a payment API."""
import argparse
import copy
import json
import os
from pathlib import Path
import secrets
import sys
import time

if __name__ == '__main__':
    sys.dont_write_bytecode = True
    sys.path.insert(0, '/usr/local/libexec/swap-node')
    import package_verify
    package_verify.verify('/usr/local/libexec/swap-node', 'node')

import bounded_authority as ba
import coordinator_admin as ca
import held_gate as hg
import restore_barrier

DIRECTORY = 'local-controller-trust-v1'
FORMAT = 'local-controller-trust-v1'


def initial(chain):
    return dict(format=FORMAT, chain=chain, enabled=True, owned=[], current={}, pending=None)


def initialize(path, chain):
    hg.need(not restore_barrier.blocked(path), 'trust_restored')
    for p in (path, *path.parents): hg.need(not p.is_symlink(), 'trust_path_invalid')
    path.mkdir(mode=0o700)
    fd = os.open(path/'state.json', os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as f:
        json.dump(initial(chain), f); f.flush(); os.fsync(f.fileno())
    for p in (path, path.parent):
        fd=os.open(p, os.O_RDONLY | os.O_DIRECTORY)
        try: os.fsync(fd)
        finally: os.close(fd)


def validate(r, chain):
    hg.need(type(r) is dict and set(r)=={'format','chain','enabled','owned','current','pending'}
            and r['format']==FORMAT and type(r['enabled']) is bool, 'trust_record_invalid')
    ba.ci.same_binding(hg.binding(r['chain']), chain)
    hg.need(type(r['owned']) is list and len(r['owned'])<=ba.MAX_RECORDS
            and len(set(r['owned']))==len(r['owned']) and all(ba.ci.hex_field(x,64) for x in r['owned']), 'trust_record_invalid')
    hg.need(type(r['current']) is dict and set(r['current'])<=set(ba.KINDS)
            and all(x in r['owned'] for x in r['current'].values()), 'trust_record_invalid')
    if r['pending'] is not None: ba.grant(r['pending'], chain)
    return r


class Trust:
    def __init__(self, admin, journal):
        self.admin, self.auth, self.journal = admin, admin.authority, journal
        self.r=copy.deepcopy(validate(journal.read(),self.auth.chain))
        self.failed=False
        for gid in self.r['owned']:
            hg.need(gid in self.auth.record['grants'], 'trust_authority_missing')
    def save(self, r):
        hg.need(not self.failed, 'trust_write_uncertain'); self.admin.guard()
        validate(r,self.auth.chain)
        try: self.journal.write(r)
        except Exception:
            self.failed=True;raise hg.StorageError('trust_write_uncertain') from None
        self.r=copy.deepcopy(r)
    def enable(self):
        self.admin.guard()
        if not self.r['enabled']:
            r=copy.deepcopy(self.r);r['enabled']=True;r['current']={};self.save(r)
    def finish_pending(self):
        g=self.r['pending']
        if g is None:return
        gid=ba.digest(g)
        if gid not in self.auth.record['grants']:
            if not self.r['enabled'] or g['expires_at'] <= int(self.admin.clock()):
                r=copy.deepcopy(self.r);r['pending']=None;self.save(r);return
            self.auth.install_grant(g,confirmed=True)
        # The authority write may have succeeded before a lost reply. Never mint
        # a replacement on retry; finish recording precisely that original grant.
        hg.need(ba.equal(self.auth.record['grants'][gid]['terms'],g),'trust_grant_changed')
        if gid not in self.admin.record['reviews']:
            a=copy.deepcopy(self.admin.record);a['reviews'][gid]=dict(grant=g,phase='saved');self.admin.commit(a)
        r=copy.deepcopy(self.r)
        if gid not in r['owned']:r['owned'].append(gid)
        r['current'][g['kind']]=gid;r['pending']=None;self.save(r)
    def disable(self):
        r=copy.deepcopy(self.r);r['enabled']=False;self.save(r)
        self.finish_pending()
        for gid in self.r['owned']:
            if not self.auth.record['grants'][gid]['paused']:self.auth.pause(gid)
        return dict(state='disabled',enabled=False)
    def plan(self,kind):
        self.auth.read_node(admission=True)
        rows=self.auth.rpc('listpeerchannels').get('channels')
        hg.need(type(rows) is list,'channels_unavailable')
        fee=10000 if kind=='outgoing' else 0
        usable=[]
        for row in rows:
            if (row.get('state')!='CHANNELD_NORMAL' or row.get('peer_connected') is not True
                    or row.get('reestablished') is not True or row.get('lost_state',False) is not False or row.get('htlcs')!=[]):continue
            available=row.get('receivable_msat' if kind=='incoming' else 'spendable_msat')
            if not hg.integer(available,fee+1000,2**63-1):continue
            try:pin=hg.channel_pin(row,self.auth.chain['profile'])
            except (ValueError,KeyError,TypeError):continue
            usable.append((available-fee,pin))
        if not usable:return None
        amount=min(100000000,max(n for n,_ in usable))//1000*1000
        # The per-swap ceiling is a maximum, not a minimum channel size.
        # Keep smaller channels eligible for smaller payments. Route admission
        # still checks actual spendable/receivable liquidity on the selected pin.
        selected=sorted(usable,key=lambda item:(-item[0],item[1]['channel_id']))[:8]
        pins=sorted((p for _,p in selected),key=lambda p:p['channel_id'])
        limits=dict(max_swaps=4,max_amount_msat=amount,total_amount_msat=amount*3)
        limits.update(dict(min_cltv_delta=350,max_cltv_delta=2016,close_before_blocks=72) if kind=='incoming'
                      else dict(max_fee_msat=fee,max_delay_blocks=576,max_hops=4))
        now=int(self.admin.clock())
        return ba.grant(dict(schema=1,format=ba.grant_format(limits),chain=self.auth.chain,nonce=secrets.token_hex(32),kind=kind,
                             created_at=now,expires_at=now+86400,limits=limits,channels=pins),self.auth.chain)
    def maintain(self):
        self.admin.guard()
        if not self.r['enabled']:return self.disable()
        # A manual pause of an automatically managed current grant stops trust.
        if any(self.auth.record['grants'][g]['paused'] for g in self.r['current'].values()):
            self.disable();return dict(state='paused',enabled=False)
        # Preserve all outstanding contracts. Never replace their authority while
        # recovery or an uncertain payment is pending.
        if any('terminal' not in e for e in self.auth.record['entries'].values()):
            return dict(state='waiting_for_recovery',enabled=True)
        self.finish_pending()
        # A pause can arrive after the authority write but before ownership was
        # durably recorded. Recover that ownership before honoring the pause.
        if any(self.auth.record['grants'][g]['paused'] for g in self.r['current'].values()):
            self.disable();return dict(state='paused',enabled=False)
        states={}
        for kind in ba.KINDS:
            replacement=None
            gid=self.auth.record['current'][kind]
            if gid:
                item=self.auth.record['grants'][gid];g=item['terms']
                entries=[e for e in self.auth.record['entries'].values() if e['grant_id']==gid]
                spent=sum(ba.payload(e['payload'],g) for e in entries)
                remaining=g['limits']['total_amount_msat']-spent
                # Change channel scopes only for idle, automatically owned authority.
                # Add ready channels without removing temporarily illiquid/offline pins;
                # permanently closed/missing channels may be replaced outright.
                if gid in self.r['owned'] and not item['paused']:
                    rows=self.auth.rpc('listpeerchannels').get('channels')
                    hg.need(type(rows) is list,'channels_unavailable')
                    live={r.get('channel_id') for r in rows
                          if r.get('state') in ('CHANNELD_NORMAL','CHANNELD_AWAITING_LOCKIN')}
                    old_ids={p['channel_id'] for p in g['channels']}
                    retired=not old_ids.issubset(live)
                    candidate=self.plan(kind)
                    new_ids={p['channel_id'] for p in candidate['channels']} if candidate else set()
                    if retired and candidate is None:
                        states[kind]='waiting_for_channels';continue
                    if candidate and (retired or old_ids < new_ids):
                        replacement=candidate
                # Promote idle, automatically owned authority when liquidity permits.
                if (gid in self.r['owned'] and not item['paused']
                        and g['limits']['max_amount_msat']==10000000):
                    candidate=self.plan(kind)
                    if candidate and candidate['limits']['max_amount_msat']>g['limits']['max_amount_msat']:
                        replacement=candidate
                # Refresh only our idle outgoing grants. Earlier guards preserve
                # active recovery and respect manual pauses and manual authority.
                if (gid in self.r['owned'] and kind=='outgoing' and not item['paused']
                        and g['limits']['max_delay_blocks']<576):
                    candidate=self.plan(kind)
                    if candidate:replacement=candidate
                if replacement is None and not item['paused'] and g['expires_at']>int(self.admin.clock())+300 and len(entries)<g['limits']['max_swaps'] and remaining>=g['limits']['max_amount_msat']:
                    states[kind]='ready';continue
                if gid not in self.r['owned'] and item['paused']:
                    states[kind]='manual_grant_paused';continue
            if len(self.auth.record['grants'])>=ba.MAX_RECORDS or len(self.admin.record['reviews'])>=ba.MAX_RECORDS or len(self.auth.record['entries'])>=ba.MAX_RECORDS:
                states[kind]='history_full';continue
            g=replacement or self.plan(kind)
            if g is None:states[kind]='waiting_for_channels';continue
            r=copy.deepcopy(self.r);r['pending']=g;self.save(r)
            self.finish_pending();states[kind]='ready'
        return dict(state='ready' if all(v=='ready' for v in states.values()) else 'waiting',enabled=True,roles=states)


def execute(network, profile, action):
    import authority_plugin as ap
    import node_bootstrap as nb
    root=nb.state_root(network,'mainnet')
    nb.activation(root,profile,'mainnet')
    journals=[]
    try:
        journals.append(hg.Journal(root/ap.AUTHORITY_DIR));chain=hg.binding(journals[0].read()['chain'])
        hg.need(chain['profile']==profile and chain['environment']=='mainnet','trust_identity_changed')
        rpc=ap.RPC({'lightning-dir':str(network),'rpc-file':'lightning-rpc'})
        auth=ba.Authority(journals[0],chain,rpc,time.time)
        journals.append(hg.Journal(root/ca.DIRECTORY));admin=ca.Admin(auth,journals[1]);admin.guard()
        path=root/DIRECTORY
        if action=='enable' and not path.exists():initialize(path,chain)
        journals.append(hg.Journal(path));trust=Trust(admin,journals[2])
        if action=='enable':trust.enable()
        return trust.disable() if action=='disable' else trust.maintain()
    finally:
        for j in reversed(journals):j.close()


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--network-directory',type=Path,required=True)
    p.add_argument('--profile',choices=(ba.ci.BTC,ba.ci.PRIVKEYIO_XBT),required=True)
    p.add_argument('action',choices=('enable','maintain','disable'))
    args=p.parse_args();os.umask(0o077)
    try:
        print(json.dumps(execute(args.network_directory,args.profile,args.action)))
    except Exception:
        print('{"state":"unavailable","enabled":false}');raise SystemExit(1) from None

if __name__=='__main__':main()
