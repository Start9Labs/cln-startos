"""Local, finite grant administration for the environment-bound coordinator.

The package adapter supplies the node directory and protocol profile. No SCID,
RPC method, credential, or endpoint comes from an administration request.
Initialization does not initialize missing authority/gate/payment journals.
"""
import copy
import json
import os
from pathlib import Path
import secrets
import time

import bounded_authority as ba
import held_gate as hg
import restore_barrier

DIRECTORY = 'coordinator-admin-v1'
FORMAT = 'swap-coordinator-admin-v1'
REVIEW_SECONDS = 120


def validate(record, chain):
    hg.need(type(record) is dict and set(record) == {'schema','format','chain','reviews'}
            and type(record['schema']) is int and record['schema'] == 1
            and record['format'] == FORMAT and type(record['reviews']) is dict
            and len(record['reviews']) <= ba.MAX_RECORDS, 'admin_record_invalid')
    ba.ci.same_binding(hg.binding(record['chain']), chain)
    for gid, item in record['reviews'].items():
        hg.need(type(item) is dict and set(item) == {'grant','phase'}
                and item['phase'] in ('review','intent','saved','cancelled')
                and gid == ba.digest(ba.grant(item['grant'], chain)), 'admin_review_changed')
    return record


def initialize(directory, chain):
    directory = Path(directory); hg.binding(chain)
    hg.need(not restore_barrier.blocked(directory), 'admin_restored')
    hg.need(not any(p.is_symlink() for p in (directory, *directory.parents)), 'admin_path_refused')
    directory.mkdir(mode=0o700)
    # O_EXCL and a fresh directory: partial initialization is never reconstructed.
    fd = os.open(directory/'state.json', os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as f:
        json.dump(dict(schema=1, format=FORMAT, chain=chain, reviews={}), f)
        f.flush(); os.fsync(f.fileno())
    for p in (directory, directory.parent):
        fd = os.open(p, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try: os.fsync(fd)
        finally: os.close(fd)


class Admin:
    def __init__(self, authority, journal, clock=time.time):
        self.authority, self.journal, self.clock = authority, journal, clock
        self.record = copy.deepcopy(validate(journal.read(), authority.chain))
        self.blocked = False

    def guard(self):
        hg.need(not self.blocked and self.journal.lock_fd is not None, 'admin_blocked')
        hg.need(not restore_barrier.blocked(self.journal.directory), 'admin_restored')
        self.authority.guard()

    def commit(self, record):
        self.guard(); validate(record, self.authority.chain)
        try: self.journal.write(record)
        except Exception:
            self.blocked = True
            raise hg.StorageError('admin_write_uncertain') from None
        self.record = copy.deepcopy(record)

    def channels(self, kind, amount):
        self.authority.read_node(admission=True)
        reply = self.authority.rpc('listpeerchannels')
        hg.need(type(reply) is dict and type(reply.get('channels')) is list, 'channels_unavailable')
        result = []
        for row in reply['channels']:
            hg.need(type(row) is dict, 'channels_unavailable')
            if (row.get('state') != 'CHANNELD_NORMAL' or row.get('peer_connected') is not True
                    or row.get('reestablished') is not True or row.get('lost_state', False) is not False
                    or row.get('htlcs') != []): continue
            if not hg.integer(row.get('receivable_msat' if kind == 'incoming' else 'spendable_msat'),
                              amount, 2**63-1): continue
            try: pin = hg.channel_pin(row, self.authority.chain['profile'])
            except (ValueError, KeyError, TypeError): continue
            result.append(pin)
        hg.need(bool(result), 'admin_no_eligible_channels')
        hg.need(len(result) <= 8, 'admin_too_many_channels')
        result.sort(key=lambda p:p['channel_id'])
        ba.pins(result, self.authority.chain['profile'])
        return result

    def review(self, kind, limits, lifetime_seconds):
        self.guard(); ba.limits(limits, kind)
        hg.need(hg.integer(lifetime_seconds, 300, 86400), 'admin_lifetime_invalid')
        hg.need(not any(x['phase'] == 'intent' for x in self.record['reviews'].values()), 'admin_setup_unfinished')
        hg.need(len(self.record['reviews']) < ba.MAX_RECORDS, 'admin_history_full')
        required = limits['max_amount_msat'] + limits.get('max_fee_msat', 0)
        pins = self.channels(kind, required); now = int(self.clock())
        g = ba.grant(dict(schema=1, format=ba.grant_format(limits), chain=self.authority.chain,
            nonce=secrets.token_hex(32), kind=kind, created_at=now, expires_at=now+lifetime_seconds,
            limits=copy.deepcopy(limits), channels=pins), self.authority.chain)
        gid = ba.digest(g); r = copy.deepcopy(self.record)
        r['reviews'][gid] = dict(grant=g, phase='review'); self.commit(r)
        return self.summary(gid)

    def summary(self, gid):
        hg.need(type(gid) is str and gid in self.record['reviews'], 'admin_unknown_review')
        item = self.record['reviews'][gid]; g = item['grant']
        saved = self.authority.record['grants'].get(gid)
        result = dict(confirmation=gid, kind=g['kind'], phase=item['phase'],
            profile=g['chain']['profile'], channel_count=len(g['channels']),
            limits=copy.deepcopy(g['limits']), expires_at=g['expires_at'],
            confirm_before=min(g['created_at']+REVIEW_SECONDS, g['expires_at']),
            current=self.authority.record['current'][g['kind']] == gid,
            paused=None if saved is None else saved['paused'], regtest_only=hg.regtest(self.authority.chain))
        if ba.protected(g):
            result['protection'] = dict(close_before_blocks=g['limits']['close_before_blocks'],
                scope='The actual incoming channel may be force-closed, including its other payments.',
                close_dispatches_per_enrollment=1)
        return result

    def confirm(self, confirmation, confirmed):
        self.guard(); hg.need(confirmed is True, 'confirmation_required')
        gid = confirmation; self.summary(gid); item = self.record['reviews'][gid]; g = item['grant']
        hg.need(item['phase'] != 'cancelled', 'admin_review_cancelled')
        hg.need(item['phase'] != 'saved' or gid in self.authority.record['grants'],
                'admin_saved_authority_missing')
        if gid not in self.authority.record['grants']:
            hg.need(g['created_at'] <= int(self.clock()) < min(g['created_at']+REVIEW_SECONDS, g['expires_at']),
                    'admin_review_expired')
            required = g['limits']['max_amount_msat'] + g['limits'].get('max_fee_msat', 0)
            hg.need(ba.equal(self.channels(g['kind'], required), g['channels']),
                    'admin_channels_changed')
        if item['phase'] == 'review':
            r = copy.deepcopy(self.record); r['reviews'][gid]['phase'] = 'intent'; self.commit(r)
        self.authority.install_grant(g, confirmed=True)
        if item['phase'] != 'saved':
            r = copy.deepcopy(self.record); r['reviews'][gid]['phase'] = 'saved'; self.commit(r)
        return self.summary(gid)

    def cancel(self, confirmation):
        self.guard(); gid = confirmation; self.summary(gid)
        hg.need(gid not in self.authority.record['grants'], 'admin_grant_already_saved')
        r = copy.deepcopy(self.record); r['reviews'][gid]['phase'] = 'cancelled'; self.commit(r)
        return self.summary(gid)

    def pause(self, grant_id, confirmed):
        self.guard(); hg.need(confirmed is True, 'confirmation_required')
        self.authority.pause(grant_id)
        return dict(paused=True, recovery_preserved=True)

    def recovery_review(self, entry_id):
        self.guard()
        import onchain_retirement as retirement
        return retirement.review(self.authority, entry_id)

    def recovery_confirm(self, entry_id, confirmation, confirmed):
        self.guard()
        import onchain_retirement as retirement
        return retirement.confirm(self.authority, entry_id, confirmation, confirmed=confirmed)

    def status(self):
        return dict(read_only=True, regtest_only=hg.regtest(self.authority.chain),
            blocked=self.blocked or restore_barrier.blocked(self.journal.directory)
                or self.authority.status()['blocked'],
            reviews=[self.summary(gid) for gid in self.record['reviews']],
            authority=self.authority.status())


def execute(root, chain, rpc, request, *, clock=time.time):
    hg.binding(chain); root = Path(root)
    hg.need(type(request) is dict and type(request.get('action')) is str, 'admin_request_invalid')
    action = request['action']
    fields = {'initialize':{'confirmed'}, 'review':{'kind','limits','lifetime_seconds'},
              'confirm':{'confirmation','confirmed'}, 'cancel':{'confirmation'},
              'pause':{'grant_id','confirmed'}, 'status':set(),
              'recovery_review':{'entry_id'},
              'recovery_confirm':{'entry_id','confirmation','confirmed'}}
    hg.need(action in fields and set(request) == {'action'} | fields[action], 'admin_request_invalid')
    # Same lock order as every facade: authority first. No RPC into the facade
    # while holding its journal; credential minting remains its separate action.
    journals = []
    try:
        journals.append(hg.Journal(root/'bounded-authority-v1'))
        authority = ba.Authority(journals[0], chain, rpc, clock)
        if action == 'initialize':
            hg.need(request['confirmed'] is True, 'confirmation_required')
            authority.read_node(admission=True)
            initialize(root/DIRECTORY, chain)
            return dict(initialized=True, regtest_only=hg.regtest(chain))
        journals.append(hg.Journal(root/DIRECTORY)); admin = Admin(authority, journals[1], clock)
        return getattr(admin, action)(**{k:v for k,v in request.items() if k != 'action'})
    finally:
        for j in reversed(journals): j.close()
