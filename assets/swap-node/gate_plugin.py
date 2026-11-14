#!/usr/bin/env python3
"""Static, environment-bound CLN plugin for held_gate. No remote authority."""
import json
from pathlib import Path
import socket
import sys

import held_gate as hg

METHODS = {'swap-gate-register': 'quote', 'swap-gate-status': 'payment_hash',
           'swap-gate-release': 'payment_hash binding preimage',
           'swap-gate-fail': 'payment_hash binding'}


def manifest():
    return dict(options=[dict(name='swap-gate-profile', type='string',
                              description='Explicit BTC/XBT protocol profile')],
                rpcmethods=[dict(name=name, usage=usage, description='Regtest held HTLC gate')
                            for name, usage in METHODS.items()],
                subscriptions=[], hooks=[dict(name='htlc_accepted')],
                dynamic=False, nonnumericids=True)


class ReadRPC:
    def __init__(self, configuration):
        rpc_path = Path(configuration['rpc-file'])
        if not rpc_path.is_absolute():
            rpc_path = Path(configuration['lightning-dir'])/rpc_path
        self.path = str(rpc_path)

    def __call__(self, method):
        hg.need(method in ('getinfo', 'listpeerchannels'), 'read_only_rpc_required')
        request = dict(jsonrpc='2.0', id='gate-read', method=method, params={})
        try:
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as conn:
                conn.settimeout(10)
                conn.connect(self.path)
                conn.sendall(json.dumps(request).encode()+b'\n\n')
                data = b''
                while b'\n\n' not in data:
                    chunk = conn.recv(65536)
                    if not chunk or len(data)+len(chunk) > hg.MAX_BYTES:
                        raise RuntimeError('rpc_unavailable')
                    data += chunk
                reply = json.loads(data.split(b'\n\n', 1)[0], object_pairs_hook=hg.unique_object)
            hg.need(reply.get('id') == 'gate-read' and 'error' not in reply and 'result' in reply,
                    'rpc_unavailable')
            return reply['result']
        except (OSError, ValueError, KeyError, TypeError):
            raise RuntimeError('rpc_unavailable') from None


def response(request_id, result):
    return dict(jsonrpc='2.0', id=request_id, result=result)


def emit(reply):
    print(json.dumps(reply, separators=(',', ':')), end='\n\n', flush=True)


def arguments(method, params):
    names = METHODS[method].split()
    if isinstance(params, list):
        hg.need(len(params) == len(names), 'argument_count_invalid')
        return dict(zip(names, params))
    hg.need(type(params) is dict and set(params) == set(names), 'argument_fields_invalid')
    return params


def dispatch(gate, request):
    method, params, request_id = request['method'], request.get('params', {}), request['id']
    if method == 'htlc_accepted':
        reply = gate.accept(params, request_id)
        return [] if reply is None else [response(request_id, reply)]
    p = arguments(method, params)
    if method == 'swap-gate-register':
        result = gate.register(p['quote'])
    elif method == 'swap-gate-status':
        result = gate.status(p['payment_hash'])
    else:
        hook, result = gate.resolve(p['payment_hash'], p['binding'],
                                    preimage=p['preimage'] if method == 'swap-gate-release' else None)
        if hook:
            return [response(*hook), response(request_id, result)]
    return [response(request_id, result)]


def requests(stream):
    raw = ''
    for line in stream:
        raw += line
        hg.need(len(raw) <= hg.MAX_BYTES, 'plugin_frame_too_large')
        if line.strip():
            continue
        if raw.strip():
            yield json.loads(raw, object_pairs_hook=hg.unique_object)
        raw = ''


def main():
    gate = journal = None
    try:
        for request in requests(sys.stdin):
            method = request['method']
            if method == 'getmanifest':
                emit(response(request['id'], manifest()))
                continue
            if method == 'init':
                # Refuse startup rather than returning disable: CLN removes the
                # importance flag for plugins that disable themselves.
                hg.need(gate is None, 'already_initialized')
                p = request['params']
                config = p['configuration']
                profile = p['options']['swap-gate-profile']
                hg.need(profile in (hg.ci.BTC, hg.ci.PRIVKEYIO_XBT), 'profile_refused')
                import node_bootstrap
                root,environment = node_bootstrap.plugin_root(config,profile)
                journal = hg.Journal(root/'swap-gate-v1')
                saved = journal.read()
                chain = saved['chain']
                hg.need(chain['profile'] == profile and chain['environment']==environment, 'profile_changed')
                gate = hg.Gate(journal, chain, ReadRPC(config))
                emit(response(request['id'], {}))
                continue
            hg.need(gate is not None, 'gate_not_initialized')
            try:
                replies = dispatch(gate, request)
            except (ValueError, KeyError, TypeError):
                # A malformed hook cannot be classified safely. Never supply
                # an automatic failure/continue response for it.
                if method == 'htlc_accepted':
                    gate.blocked = True
                    gate.pending.clear()
                    replies = []
                else:
                    replies = [dict(jsonrpc='2.0', id=request['id'], error=dict(
                        code=-32602, message='swap gate request refused'))]
            except Exception:
                gate.blocked = True
                gate.pending.clear()
                replies = [] if method == 'htlc_accepted' else [dict(
                    jsonrpc='2.0', id=request['id'], error=dict(
                        code=-32603, message='swap gate blocked; journal or node reply uncertain'))]
            for reply in replies:
                emit(reply)
    finally:
        if journal is not None:
            journal.close()


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Startup/framing failure only: fixed text, never the raw journal or RPC.
        print('swap gate startup or framing refused', file=sys.stderr)
        raise SystemExit(1) from None
