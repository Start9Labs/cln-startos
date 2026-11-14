#!/usr/bin/env python3
"""Local fixed-action adapter; explicit environment, no raw RPC forwarding."""
import argparse
import json
import os
from pathlib import Path
import sys

import authority_plugin as ap
import coordinator_admin as admin
import held_gate as hg


def main():
    p = argparse.ArgumentParser(description=__doc__)
    mode=p.add_mutually_exclusive_group(required=True)
    mode.add_argument('--disposable-regtest', action='store_true')
    mode.add_argument('--mainnet', action='store_true')
    p.add_argument('--network-directory', type=Path, required=True)
    p.add_argument('--profile', choices=(admin.ba.ci.BTC, admin.ba.ci.PRIVKEYIO_XBT), required=True)
    args = p.parse_args(); os.umask(0o077)
    raw = sys.stdin.buffer.read(16385)
    hg.need(len(raw) <= 16384, 'admin_request_too_large')
    request = json.loads(raw, object_pairs_hook=hg.unique_object)
    network_root = args.network_directory.absolute()
    import node_bootstrap
    environment='mainnet' if args.mainnet else 'regtest'
    root=node_bootstrap.state_root(network_root,environment)
    if args.mainnet:
        hg.need(network_root.name=='bitcoin','mainnet_directory_required')
        node_bootstrap.activation(root,args.profile)
    j = hg.Journal(root/ap.AUTHORITY_DIR)
    try: chain = hg.binding(j.read()['chain'])
    finally: j.close()
    hg.need(chain['profile'] == args.profile and chain['environment']==environment, 'profile_changed')
    rpc = ap.RPC({'lightning-dir':str(network_root), 'rpc-file':'lightning-rpc'})
    print(json.dumps(admin.execute(root, chain, rpc, request)))


if __name__ == '__main__':
    try: main()
    except Exception as error:
        # No node IDs, RPC replies, paths, credentials or input text in output.
        print(json.dumps(dict(result='REFUSED', error_type=type(error).__name__)))
        raise SystemExit(1) from None
