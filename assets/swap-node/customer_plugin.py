#!/usr/bin/env python3
"""Static customer facade for explicitly initialized coordinator journals."""
from pathlib import Path
import sys
import time
import threading

import authority_plugin as plugin
import bounded_authority as ba
import customer_invoice as invoice
import customer_remote as remote
import held_gate as hg

REMOTE_DIR = 'customer-remote-v1'
INVOICE_DIR = 'customer-invoices-v1'


def manifest():
    result = plugin.manifest()
    result['rpcmethods'] = [
        dict(name=remote.CALL, usage='grant_id operation body', description='Scoped customer contract operations'),
        dict(name=remote.CREDENTIAL, usage='grant_id confirmed', description='Local customer credential setup')]
    return result


class RPC(plugin.RPC):
    methods = remote.METHODS


class Service(plugin.Service):
    def __init__(self, configuration, profile, rpc_factory=RPC, clock=time.time):
        self.serial = threading.RLock()
        super().__init__(configuration, profile, rpc_factory, clock)

    def protect_once(self):
        with self.serial: self._protect_once()

    def _protect_once(self):
        import deadline_protection as protection
        # Same nonblocking journal lock as RPC. A busy lock is retried by the
        # next tick; no cached authority survives a request or node restart.
        journal = hg.Journal(self.root/plugin.AUTHORITY_DIR)
        try:
            a = ba.Authority(journal, self.chain, self.rpc, self.clock)
            a.guard()
            for eid, e in list(a.record['entries'].items()):
                if 'protection' in e and 'terminal' not in e:
                    protection.protect(a, eid)
        finally: journal.close()

    def start_watchdog(self):
        def run():
            while True:
                try: self.protect_once()
                except Exception:
                    # Retry observations, never a saved close/send dispatch.
                    # Remote evidence retains ambiguity; no secret is logged.
                    pass
                time.sleep(1)
        threading.Thread(target=run, name='swap-deadline-watchdog', daemon=True).start()

    def invoke(self, method, params, profile=None):
        with self.serial:
            try: return self._invoke(method, params, profile)
            except ValueError as error:
                # Only finite, read-only admission failures may cross the boundary.
                safe = {'grant_closed', 'channel_requires_recovery', 'previous_enrollment_requires_recovery', 'recipient_invoice_timing', 'recipient_invoice_limits',
                        'route_hint_entry_unknown', 'route_hint_path_unavailable', 'route_hint_fee_limit', 'route_hint_delay_limit', 'route_hint_hop_limit', 'recipient_route_unknown', 'recipient_invoice_cltv_limit', 'bounded_route_unavailable',
                        'outgoing_channel_not_ready', 'route_outside_approved_channels',
                        'route_fee_or_delay_limit', 'approved_channel_changed', 'incoming_channel_disconnected', 'incoming_channel_busy', 'incoming_liquidity_insufficient', 'incoming_amount_below_safe_minimum', 'incoming_htlc_policy_limit', 'incoming_hint_unavailable', 'incoming_channels_unavailable', 'channel_fee_metadata_invalid', 'channel_alias_metadata_invalid', 'outside_grant', 'node_not_synced'}
                if method == remote.CALL and type(params) is dict and params.get('operation') in ('plan', 'inspect') and str(error) in safe:
                    return dict(admission_error=str(error), **({'admission_details': error.details} if isinstance(error, (invoice.AdmissionError, plugin.rp.RouteAdmissionError)) else {}))
                raise

    def _invoke(self, method, params, profile=None):
        journals = []
        try:
            for name in (plugin.AUTHORITY_DIR, REMOTE_DIR, INVOICE_DIR):
                journals.append(hg.Journal(self.root/name))
            chain = hg.binding(journals[0].read()['chain'])
            hg.need(chain['environment']==self.environment, 'environment_changed')
            if profile is not None: hg.need(chain['profile'] == profile, 'profile_changed')
            else: ba.ci.same_binding(chain, self.chain)
            a = ba.Authority(journals[0], chain, self.rpc, self.clock)
            p = invoice.Publisher(a, journals[2]); r = remote.Remote(a, journals[1], self.rpc, p)
            r.guard()
            if method is None: return chain
            if method == remote.CREDENTIAL:
                hg.need(type(params) is dict and set(params) == {'grant_id', 'confirmed'}, 'local_setup_invalid')
                return r.enable(params['grant_id'], confirmed=params['confirmed'])
            hg.need(method == remote.CALL, 'remote_method_refused')
            return r.call(params)
        finally:
            for journal in reversed(journals): journal.close()


if __name__ == '__main__':
    try: plugin.main(RPC, Service, manifest)
    except Exception:
        print('customer facade startup or framing refused', file=sys.stderr)
        raise SystemExit(1) from None
