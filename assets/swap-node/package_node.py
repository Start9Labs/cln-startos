#!/usr/bin/python3 -I
"""Verified production node entry point; all authority requires explicit setup."""
from pathlib import Path
import sys
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
try:
    import package_verify
    m=package_verify.verify(Path(__file__).parent,'node')
    if m.get('environments')!=['regtest','mainnet']:raise ValueError('runtime_environment_refused')
    import node_cli
    node_cli.main()
except Exception:
    print('{"result":"REFUSED","reason":"node_setup_or_startup_refused","records_preserved":true}')
    raise SystemExit(1) from None
