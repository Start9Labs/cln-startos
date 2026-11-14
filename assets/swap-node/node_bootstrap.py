"""Explicit coordinator setup on an authenticated running node.

One atomic namespace publication. Startup never creates journals, imports old
state, or repairs a missing journal. Incomplete staging remains private evidence.
"""
import json
import os
from pathlib import Path
import stat
import tempfile

import chain_identity as ci
import held_gate as hg
import bounded_authority as ba
import coordinator_admin as admin
import customer_invoice as invoice
import customer_remote as remote
import restore_barrier

DIRECTORY = 'swap-coordinator-v1'
ACTIVATION = 'activation.json'
JOURNALS = ('swap-gate-v1','bounded-authority-v1','customer-remote-v1','customer-invoices-v1','coordinator-admin-v1')


def state_root(network_root, environment):
    hg.need(environment in ci.ENVIRONMENTS, 'unsupported_swap_environment')
    namespace=Path(network_root)/DIRECTORY
    return namespace if environment == 'mainnet' or os.path.lexists(namespace) else Path(network_root)


def sync(path):
    fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try: os.fsync(fd)
    finally: os.close(fd)


def activation(root, profile, environment='mainnet'):
    root = Path(root)
    hg.need(not restore_barrier.blocked(root/'authority'), 'restored_authority_blocked')
    for p in (root,*root.parents): hg.need(not p.is_symlink(), 'bootstrap_path_refused')
    st = root.stat()
    hg.need(stat.S_ISDIR(st.st_mode) and st.st_uid == os.getuid() and st.st_mode & 0o077 == 0,
            'bootstrap_directory_not_private')
    fd = os.open(root/ACTIVATION, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd,'rb') as f:
        hg.Journal.check_file(f.fileno()); raw=f.read(4097)
    hg.need(len(raw)<=4096,'activation_invalid')
    r=json.loads(raw,object_pairs_hook=hg.unique_object)
    hg.need(type(r) is dict and set(r)=={'schema','chain','journals'} and type(r['schema']) is int and r['schema']==1
            and r['journals']==list(JOURNALS),'activation_invalid')
    c=hg.binding(r['chain'])
    hg.need(c['profile']==profile and c['environment']==environment,'activation_chain_changed')
    # Read only file shape here: live gate owns its journal lock. Complete
    # semantic validation is performed by each owner before any operation.
    for name in JOURNALS:
        p=root/name
        hg.need(not p.is_symlink(),'bootstrap_path_refused')
        st=p.stat()
        hg.need(stat.S_ISDIR(st.st_mode) and st.st_uid==os.getuid() and st.st_mode & 0o077==0,'bootstrap_directory_not_private')
        fd=os.open(p/'state.json',os.O_RDONLY|os.O_NOFOLLOW)
        with os.fdopen(fd,'rb') as f:
            hg.Journal.check_file(f.fileno()); raw=f.read(hg.MAX_BYTES+1)
        hg.need(len(raw)<=hg.MAX_BYTES,'activation_journal_invalid')
        data=json.loads(raw,object_pairs_hook=hg.unique_object)
        ci.same_binding(data.get('chain'),c)
    return c


def prepare(network_root, profile, rpc, *, confirmed=False, environment='mainnet'):
    hg.need(confirmed is True,'confirmation_required')
    hg.need(profile in (ci.BTC,ci.PRIVKEYIO_XBT),'profile_refused')
    network_root=Path(network_root)
    hg.need(network_root.name==ci.wire(profile,environment)[0],'network_directory_required')
    root=network_root/DIRECTORY
    hg.need(not restore_barrier.blocked(root/'authority'),'restored_authority_blocked')
    chain=ci.node(rpc('getinfo'),profile,environment)
    # Existing namespace is recovery, never an initializer. A repeated successful
    # setup checks identity and returns the saved activation without rewriting it.
    if os.path.lexists(root):
        ci.same_binding(activation(root,profile,environment),chain)
        return dict(initialized=True,restart_required=True,existing_records=True)
    for p in (network_root,*network_root.parents):hg.need(not p.is_symlink(),'bootstrap_path_refused')
    # Direct journals belong to the regtest-era layout; do not gain mainnet authority.
    hg.need(not any(os.path.lexists(network_root/n) for n in JOURNALS),'foreign_authority_present')
    stage=Path(tempfile.mkdtemp(prefix='.swap-setup-',dir=network_root))
    hg.initialize_fixture(stage/'swap-gate-v1',chain)
    ba.initialize_fixture(stage/'bounded-authority-v1',chain)
    remote.initialize_fixture(stage/'customer-remote-v1',chain)
    invoice.initialize_fixture(stage/'customer-invoices-v1',chain)
    admin.initialize(stage/'coordinator-admin-v1',chain)
    fd=os.open(stage/ACTIVATION,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
    with os.fdopen(fd,'w') as f:
        json.dump(dict(schema=1,chain=chain,journals=list(JOURNALS)),f);f.flush();os.fsync(f.fileno())
    activation(stage,profile,environment)
    ci.same_binding(ci.node(rpc('getinfo'),profile,environment),chain)
    sync(stage)
    # rename refuses an existing nonempty namespace; concurrent setup cannot
    # overwrite an activation. Retain staging on any error for inspection.
    os.rename(stage,root);sync(network_root)
    return dict(initialized=True,restart_required=True,existing_records=False)


def plugin_root(configuration, profile):
    network=configuration.get('network')
    hg.need(configuration.get('startup') is True and network in ('bitcoin','regtest'),'static_network_required')
    environment='mainnet' if network=='bitcoin' else 'regtest'
    hg.need(type(configuration.get('lightning-dir')) is str,'static_network_required')
    root=state_root(configuration['lightning-dir'],environment)
    if environment=='mainnet':
        import package_verify
        manifest=package_verify.verify(Path(__file__).parent,'node')
        hg.need(manifest.get('environments')==['regtest','mainnet'],'runtime_environment_refused')
        activation(root,profile,environment)
    elif root.name==DIRECTORY:activation(root,profile,environment)
    return root,environment
