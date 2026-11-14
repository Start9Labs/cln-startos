"""Integrity preflight for immutable packaged code; never reads a node volume."""
import hashlib
import json
from pathlib import Path
import re


def verify(directory, role):
    root = Path(directory)
    raw = (root/'runtime-manifest.json').read_bytes()
    if len(raw) > 65536: raise ValueError('runtime_manifest_invalid')
    m = json.loads(raw)
    old = (m.get('schema')==1 and m.get('fixture')=='0098' and m.get('regtest_only') is True
           and set(m)=={'schema','fixture','role','generation','regtest_only','files'})
    live = (m.get('schema')==2 and m.get('fixture')=='0102' and m.get('regtest_only') is False
            and m.get('environments')==['regtest','mainnet']
            and set(m)=={'schema','fixture','role','generation','regtest_only','files','environments'})
    if (not (old or live) or m['role']!=role or m['generation'] not in ('a','b')
            or not isinstance(m['files'],dict) or not m['files']):
        raise ValueError('runtime_manifest_invalid')
    present = {p.name for p in root.iterdir()}
    if present != set(m['files']) | {'runtime-manifest.json'}:
        raise ValueError('runtime_files_changed')
    for name, expected in m['files'].items():
        p = root/name
        if (re.fullmatch(r'[a-z][a-z0-9_]*\.py',name) is None
                or name.startswith(('test_','fixture_')) or p.is_symlink() or not p.is_file()
                or hashlib.sha256(p.read_bytes()).hexdigest() != expected):
            raise ValueError('runtime_files_changed')
    return m
