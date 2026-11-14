#!/usr/bin/python3 -I
"""Packaged customer authority and deadline watchdog; static regtest only."""
from pathlib import Path
import sys
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    import package_verify
    manifest = package_verify.verify(Path(__file__).parent, 'node')
    if '--mainnet' in sys.argv and manifest.get('environments') != ['regtest','mainnet']:
        raise ValueError('runtime_environment_refused')
    import authority_plugin
    import customer_plugin
    authority_plugin.main(customer_plugin.RPC, customer_plugin.Service, customer_plugin.manifest)
except Exception:
    print('packaged customer authority refused; original records retained', file=sys.stderr)
    raise SystemExit(1) from None
