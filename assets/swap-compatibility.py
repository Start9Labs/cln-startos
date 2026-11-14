#!/usr/bin/python3 -I
"""Require reviewed stock engine bytes before enabling swap authority.

This is an image-owned policy, never a volume setting or administrator override.
Ordinary node startup does not call this check unless a swap namespace exists.
"""
import hashlib
import json
from pathlib import Path
import sys

POLICY = Path('/usr/local/share/swap-compatibility.json')
ENGINE = Path('/usr/local/bin/lightningd')


def check(policy, binary):
    if policy.get('schema') != 1 or not isinstance(policy.get('approved_engines'), list):
        raise ValueError('Swap compatibility policy is invalid; no authority was created.')
    digest = hashlib.sha256(binary).hexdigest()
    for entry in policy['approved_engines']:
        if (entry.get('sha256') == digest and entry.get('upstream_release')
                and entry.get('recovery_test_receipt')):
            return
    raise ValueError('Swap Controller support is not yet enabled for this stock CLN build. '
                     'CLN 26.06.10 has the important-hook crash and shutdown-replay fixes, '
                     'but anchor recovery fee weight and closing-replay compatibility still '
                     'require validation. No swap authority was created. Ordinary Lightning '
                     'payments remain available.')


if __name__ == '__main__':
    try:
        check(json.loads(POLICY.read_text()), ENGINE.read_bytes())
    except Exception as error:
        print(str(error) if isinstance(error, ValueError) else 'Swap compatibility evidence is unavailable; no authority was created.')
        sys.exit(1)
