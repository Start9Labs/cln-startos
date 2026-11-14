#!/usr/bin/python3 -I
"""Packaged important plugin; no fixture fault controls or volume imports."""
from pathlib import Path
import sys
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    import package_verify
    manifest = package_verify.verify(Path(__file__).parent, 'node')
    if '--mainnet' in sys.argv and manifest.get('environments') != ['regtest','mainnet']:
        raise ValueError('runtime_environment_refused')
    import gate_plugin
    gate_plugin.main()
except Exception:
    print('packaged gate refused; original records retained', file=sys.stderr)
    raise SystemExit(1) from None
