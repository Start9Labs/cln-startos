import hashlib
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('compatibility', ROOT/'assets/swap-compatibility.py')
compatibility = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compatibility)


class Compatibility(unittest.TestCase):
    def test_shipped_draft_refuses_activation(self):
        policy = json.loads((ROOT/'assets/swap-compatibility.json').read_text())
        self.assertEqual(policy['approved_engines'], [])
        with self.assertRaisesRegex(ValueError, 'Ordinary Lightning'):
            compatibility.check(policy, b'stock engine')

    def test_review_requires_exact_binary_and_test_receipt(self):
        entry = dict(sha256=hashlib.sha256(b'engine').hexdigest(), upstream_release='vTEST', recovery_test_receipt='synthetic-test-only')
        policy = dict(schema=1, approved_engines=[entry])
        compatibility.check(policy, b'engine')
        with self.assertRaises(ValueError):
            compatibility.check(policy, b'other engine')
        del entry['recovery_test_receipt']
        with self.assertRaises(ValueError):
            compatibility.check(policy, b'engine')

    def test_invalid_policy_is_not_an_approval(self):
        for policy in [{}, {'schema': 1, 'approved_engines': None}]:
            with self.assertRaises(ValueError): compatibility.check(policy, b'engine')

    def test_sealed_runtime_integrity(self):
        runtime = ROOT/'assets/swap-node'
        spec = importlib.util.spec_from_file_location('verify', runtime/'package_verify.py')
        verify = importlib.util.module_from_spec(spec); spec.loader.exec_module(verify)
        self.assertEqual(verify.verify(runtime, 'node')['role'], 'node')

    def test_plain_node_launch_does_not_require_swap_approval(self):
        import sys, tempfile
        from unittest.mock import patch
        sys.path.insert(0, str(ROOT/'assets/swap-node'))
        import node_cli
        with tempfile.TemporaryDirectory() as directory:
            argv = ['launcher', '--mainnet', '--profile', 'btc-cln-v1', '--root', directory, 'launch', '--database-upgrade=true']
            with patch.object(sys, 'argv', argv), patch.object(node_cli.os, 'execv', side_effect=SystemExit) as execute:
                with self.assertRaises(SystemExit): node_cli.main()
            binary, arguments = execute.call_args.args
            self.assertEqual(binary, '/usr/local/bin/lightningd')
            self.assertIn('--database-upgrade=true', arguments)
            self.assertFalse(any('important-plugin' in item for item in arguments))

    def test_existing_swap_namespace_requires_approval_before_launch(self):
        import sys, tempfile, subprocess
        from unittest.mock import patch
        sys.path.insert(0, str(ROOT/'assets/swap-node'))
        import node_cli
        with tempfile.TemporaryDirectory() as directory:
            (Path(directory)/'bitcoin/swap-coordinator-v1').mkdir(parents=True)
            argv = ['launcher', '--mainnet', '--profile', 'btc-cln-v1', '--root', directory, 'launch']
            with patch.object(sys, 'argv', argv), patch.object(node_cli.boot, 'activation'), patch.object(node_cli.os, 'execv') as execute, patch('subprocess.run', side_effect=subprocess.CalledProcessError(1, 'compatibility')):
                with self.assertRaises(subprocess.CalledProcessError): node_cli.main()
            execute.assert_not_called()
