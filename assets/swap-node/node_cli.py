"""Fixed package launch and explicit coordinator bootstrap; no payments."""
import argparse
import json
import os
from pathlib import Path
import sys

import chain_identity as ci
import held_gate as hg
import node_bootstrap as boot


def main():
    p=argparse.ArgumentParser(description=__doc__)
    mode=p.add_mutually_exclusive_group(required=True)
    mode.add_argument('--mainnet',action='store_true')
    mode.add_argument('--disposable-regtest',action='store_true')
    p.add_argument('--profile',choices=(ci.BTC,ci.PRIVKEYIO_XBT),required=True)
    p.add_argument('--root',type=Path,required=True)
    p.add_argument('mode',choices=('prepare','launch','status'))
    p.add_argument('arguments',nargs=argparse.REMAINDER)
    a=p.parse_args();os.umask(0o077)
    environment='mainnet' if a.mainnet else 'regtest'
    wire=ci.wire(a.profile,environment)[0]
    root=a.root.absolute();network=root/wire;state=network/boot.DIRECTORY
    if a.mode=='launch':
        args=a.arguments
        hg.need(not any(x.startswith(('--network','--lightning-dir','--plugin-dir','--swap-')) for x in args),'launch_arguments_refused')
        extra=[]
        if os.path.lexists(state):
            boot.activation(state,a.profile,environment)
            package=Path(__file__).parent
            extra=['--important-plugin='+str(package/'package_gate.py'),
                   '--swap-gate-profile='+a.profile,'--important-plugin='+str(package/'package_customer.py'),
                   '--swap-authority-profile='+a.profile]
        asset='btc' if a.profile==ci.BTC else 'xbt'
        binary='/usr/local/bin/lightningd'
        if os.path.lexists(state):
            import subprocess
            subprocess.run(['/usr/bin/python3', '-I', '/usr/local/libexec/swap-compatibility.py'], check=True)
        os.execv(binary,[binary,'--network='+wire,'--lightning-dir='+str(root),*args,*extra])
    hg.need(not a.arguments,'node_request_invalid')
    if a.mode=='status':
        ready=os.path.lexists(state)
        if ready:boot.activation(state,a.profile,environment)
        print(json.dumps(dict(initialized=ready,read_only=True)));return
    import authority_plugin
    raw=sys.stdin.buffer.read(1025)
    hg.need(len(raw)<=1024,'node_request_invalid')
    request=json.loads(raw,object_pairs_hook=hg.unique_object)
    hg.need(request=={'confirmed':True} and type(request['confirmed']) is bool,'confirmation_required')
    rpc=authority_plugin.RPC({'lightning-dir':str(network),'rpc-file':'lightning-rpc'})
    print(json.dumps(boot.prepare(network,a.profile,rpc,confirmed=True,environment=environment)))
