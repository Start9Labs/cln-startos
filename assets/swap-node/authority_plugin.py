#!/usr/bin/env python3
"""Static environment-bound RPC facade; authentication belongs to CLN's rune transport."""
import json
from pathlib import Path
import socket
import sys
import time

import bounded_authority as ba
import gate_plugin as gp
import held_gate as hg
import remote_authority as remote
import route_plan as rp

AUTHORITY_DIR = 'bounded-authority-v1'
REMOTE_DIR = 'remote-authority-v1'


def manifest():
    return dict(options=[dict(name='swap-authority-profile', type='string',
                              description='Explicit BTC/XBT protocol')],
        rpcmethods=[dict(name=remote.CALL, usage='grant_id operation body', description='Scoped coordinator authority'),
                    dict(name=remote.CREDENTIAL, usage='grant_id confirmed', description='Local credential setup')],
        subscriptions=[], hooks=[], dynamic=False, nonnumericids=True)


class RPC:
    methods = ba.METHODS | remote.SETUP_METHODS

    def __init__(self, configuration):
        self.path = gp.ReadRPC(configuration).path

    def __call__(self, method, **params):
        hg.need(method in self.methods, 'local_rpc_refused')
        request = dict(jsonrpc='2.0', id='authority-local', method=method, params=params)
        try:
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as conn:
                conn.settimeout(30); conn.connect(self.path)
                conn.sendall(json.dumps(request, allow_nan=False).encode()+b'\n\n')
                data = b''
                while b'\n\n' not in data:
                    chunk = conn.recv(65536)
                    hg.need(bool(chunk) and len(data)+len(chunk) <= hg.MAX_BYTES, 'rpc_reply_unavailable')
                    data += chunk
                reply = json.loads(data.split(b'\n\n', 1)[0], object_pairs_hook=hg.unique_object)
            hg.need(type(reply) is dict and reply.get('id') == request['id'], 'rpc_reply_unavailable')
            if 'error' in reply:
                error = reply['error']
                code = error.get('code') if type(error) is dict and type(error.get('code')) is int else None
                message = error.get('message') if type(error) is dict else None
                # Classify one known read-only routing refusal; never forward text.
                unknown = method == 'getroutes' and code == 205 and type(message) is str and message.lower().startswith('unknown destination')
                raise rp.RPCError(code, unknown_destination=unknown)
            hg.need('result' in reply, 'rpc_reply_unavailable')
            return reply['result']
        except (OSError, UnicodeError, json.JSONDecodeError):
            raise RuntimeError('rpc_reply_unavailable') from None


class Service:
    def __init__(self, configuration, profile, rpc_factory=RPC, clock=time.time):
        import node_bootstrap
        hg.need(profile in (ba.ci.BTC, ba.ci.PRIVKEYIO_XBT), 'profile_refused')
        self.root,self.environment = node_bootstrap.plugin_root(configuration,profile)
        self.rpc = rpc_factory(configuration)
        self.clock = clock
        self.chain = self.invoke(None, None, profile)

    def invoke(self, method, params, profile=None):
        # Fixed lock ordering, fresh disk state for every operation. No request
        # chooses a directory, endpoint, RPC method or authority instance.
        journal = hg.Journal(self.root/AUTHORITY_DIR)
        other = None
        try:
            chain = hg.binding(journal.read()['chain'])
            hg.need(chain['environment']==self.environment, 'environment_changed')
            if profile is not None: hg.need(chain['profile'] == profile, 'profile_changed')
            else: ba.ci.same_binding(chain, self.chain)
            authority = ba.Authority(journal, chain, self.rpc, self.clock)
            other = hg.Journal(self.root/REMOTE_DIR)
            facade = remote.Remote(authority, other, self.rpc)
            facade.guard()
            if method is None: return chain
            if method == remote.CREDENTIAL:
                hg.need(type(params) is dict and set(params) == {'grant_id', 'confirmed'}, 'local_setup_invalid')
                return facade.enable(params['grant_id'], confirmed=params['confirmed'])
            hg.need(method == remote.CALL, 'remote_method_refused')
            return facade.call(params)
        finally:
            if other is not None: other.close()
            journal.close()


def main(rpc_factory=RPC, service_factory=Service, manifest_factory=manifest):
    service = None
    for request in gp.requests(sys.stdin):
        method = request['method']
        if method == 'getmanifest':
            gp.emit(gp.response(request['id'], manifest_factory())); continue
        if method == 'init':
            hg.need(service is None, 'already_initialized')
            p = request['params']
            service = service_factory(p['configuration'], p['options']['swap-authority-profile'], rpc_factory)
            gp.emit(gp.response(request['id'], {}))
            if hasattr(service, 'start_watchdog'): service.start_watchdog()
            continue
        hg.need(service is not None, 'authority_not_initialized')
        try:
            result = service.invoke(method, request.get('params', {}))
            reply = gp.response(request['id'], result)
        except (ValueError, TypeError, KeyError):
            reply = dict(jsonrpc='2.0', id=request['id'], error=dict(code=-32602, message='swap authority request refused'))
        except Exception:
            reply = dict(jsonrpc='2.0', id=request['id'], error=dict(code=-32603, message='swap authority reply uncertain'))
        gp.emit(reply)


if __name__ == '__main__':
    try: main()
    except Exception:
        print('swap authority startup or framing refused', file=sys.stderr)
        raise SystemExit(1) from None
