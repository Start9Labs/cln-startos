"""Explicit BTC/XBT wire identities; pure checks, no RPC or persistence.

Network names, invoice HRPs and genesis hashes overlap on the privkeyio fork.
Never infer a chain from any of those alone, nor normalize getinfo/decode output.
Feature checks identify the protocol; the package must separately verify its
backend. A binding records identity, not permission to spend or resume a swap.
"""
import re

BTC = 'btc-cln-v1'
LEGACY_XBT = 'xbt-experimental-v1'
PRIVKEYIO_XBT = 'xbt-privkeyio-v1'
PROFILES = (BTC, LEGACY_XBT, PRIVKEYIO_XBT)
ENVIRONMENTS = ('mainnet', 'regtest')
ACTIVATION_HEIGHT = 961640
ACTIVATION_HASH = '0000000000000050c1e5f69672f459293be14f46e5a494e7a8c8541396f18eeb'


class IdentityError(ValueError):
    """Only fixed labels; never includes RPC results or credentials."""


def require(condition, code):
    if not condition:
        raise IdentityError(code)


def hex_field(value, size):
    return type(value) is str and re.fullmatch('[0-9a-f]{%d}' % size, value) is not None


def feature_bits(value):
    # Empty is a valid BOLT feature vector. Missing, odd-length, whitespace,
    # numbers, lists, and excessively large vectors are not hex RPC vectors.
    require(type(value) is str and len(value) <= 16384 and len(value) % 2 == 0
            and re.fullmatch('[0-9a-fA-F]*', value) is not None, 'invalid_feature_vector')
    return int(value, 16) if value else 0


def wire(profile, environment):
    require(profile in PROFILES and environment in ENVIRONMENTS, 'invalid_chain_profile')
    if profile == LEGACY_XBT:
        return ('xbt', 'xbt') if environment == 'mainnet' else ('xbt-regtest', 'xbtrt')
    return ('bitcoin', 'bc') if environment == 'mainnet' else ('regtest', 'bcrt')


def _features(value, profile, place):
    bits = feature_bits(value)
    if profile == PRIVKEYIO_XBT:
        require(bits & (1 << 512) and not bits & (1 << 513), 'blake2b_required_bit_missing')
        if place in ('init', 'node'):
            require(bits & (1 << 515) and not bits & (1 << 514), 'unified_capability_missing')
        else:
            # Unified signatures is a channel capability, not an invoice bit.
            require(not bits & ((1 << 514) | (1 << 515)), 'unexpected_invoice_chain_feature')
    else:
        require(not bits & (15 << 512), 'wrong_chain_features')
    return bits


def binding(profile, environment, node_id):
    network, _ = wire(profile, environment)
    require(type(node_id) is str and re.fullmatch('0[23][0-9a-f]{64}', node_id) is not None,
            'invalid_node_identity')
    return dict(schema=1, profile=profile, environment=environment,
                network=network, node_id=node_id)


def node(info, profile, environment, *, expected_id=None):
    expected_network, _ = wire(profile, environment)
    require(type(info) is dict and info.get('network') == expected_network, 'wrong_node_network')
    result = binding(profile, environment, info.get('id'))
    require(expected_id is None or result['node_id'] == expected_id, 'node_identity_changed')
    features = info.get('our_features')
    require(type(features) is dict, 'node_features_missing')
    for place in ('init', 'node', 'invoice'):
        _features(features.get(place), profile, place)
    require(type(info.get('blockheight')) is int and info['blockheight'] >= 0, 'invalid_blockheight')
    require(not any(k.startswith('warning') and v is not None for k, v in info.items()), 'node_not_ready')
    return result


def invoice(decoded, profile, environment):
    """Check an authenticated CLN decode result; CLN verifies the signature.

    Amount, expiry, route and grant bounds still require their usual checks.
    An optional MPP feature in a recipient invoice does not require MPP: the
    controller may send one complete part. This function authorizes no payment.
    """
    _, currency = wire(profile, environment)
    require(type(decoded) is dict and decoded.get('valid') is True
            and decoded.get('type') == 'bolt11 invoice' and decoded.get('currency') == currency,
            'wrong_invoice_network')
    _features(decoded.get('features'), profile, 'invoice')
    require(type(decoded.get('amount_msat')) is int and 0 < decoded['amount_msat'] <= 2100000000000000000
            and hex_field(decoded.get('payment_hash'), 64)
            and hex_field(decoded.get('payment_secret'), 64), 'invalid_invoice_fields')
    binding(profile, environment, decoded.get('payee'))
    return decoded


def same_binding(saved, observed):
    """Never upgrade an absent/legacy authority binding by inference."""
    require(type(saved) is dict and type(observed) is dict, 'chain_binding_required')
    for value in (saved, observed):
        require(set(value) == {'schema', 'profile', 'environment', 'network', 'node_id'}
                and type(value['schema']) is int and value['schema'] == 1,
                'invalid_chain_binding')
        require(value == binding(value['profile'], value['environment'], value['node_id']),
                'invalid_chain_binding')
    require(saved == observed, 'chain_binding_changed')


def pair(btc, xbt):
    same_binding(btc, btc)
    same_binding(xbt, xbt)
    require(btc['profile'] == BTC and xbt['profile'] in (LEGACY_XBT, PRIVKEYIO_XBT)
            and btc['environment'] == xbt['environment'] and btc['node_id'] != xbt['node_id'],
            'invalid_chain_pair')
    return {'btc': dict(btc), 'xbt': dict(xbt)}


def channel(row, profile):
    """New-fork grant admission must require the persisted signing type."""
    require(profile in PROFILES and type(row) is dict, 'invalid_channel_identity')
    value = row.get('channel_type')
    require(type(value) is dict and type(value.get('bits')) is list, 'channel_type_missing')
    bits = value['bits']
    require(all(type(b) is int and 0 <= b <= 65535 for b in bits) and len(bits) == len(set(bits)),
            'invalid_channel_type')
    if profile == PRIVKEYIO_XBT:
        require(514 in bits and 515 not in bits, 'unified_channel_required')
    else:
        require(514 not in bits and 515 not in bits, 'wrong_channel_signing_type')
    return row


def mainnet_xbt_backend(chain, deployments, checkpoint):
    """Port of the installed package's pinned mainnet startup policy.

    Kept separate from feature identity: a feature declaration is not evidence
    that a backend is following the intended chain. No regtest bypass here.
    """
    require(type(chain) is dict and chain.get('chain') == 'main'
            and chain.get('initialblockdownload') is False and chain.get('pruned') is False
            and type(chain.get('blocks')) is int and chain['blocks'] >= ACTIVATION_HEIGHT,
            'xbt_backend_not_ready')
    require(type(deployments) is dict and type(deployments.get('blake2b')) is dict,
            'xbt_deployment_missing')
    deployment = deployments['blake2b']
    require(deployment.get('active') is True and type(deployment.get('height')) is int
            and deployment['height'] == ACTIVATION_HEIGHT and checkpoint == ACTIVATION_HASH,
            'wrong_xbt_backend')


def invoice_text(value, chain):
    """Cheap pre-decode HRP boundary. Signature and bit 512 checks remain mandatory."""
    same_binding(chain,chain)
    if type(value) is not str or not 1 <= len(value) <= 16384:return False
    # BOLT11 uses Bech32: all-uppercase and all-lowercase are valid;
    # mixed case is invalid. Normalize only for this pre-decode boundary.
    if value != value.lower() and value != value.upper(): return False
    value=value.lower()
    currency=wire(chain['profile'],chain['environment'])[1]
    if chain['environment']=='regtest':return value.startswith('ln'+currency)
    return re.fullmatch(r'ln'+currency+r'[0-9]+[munp]?1[023456789acdefghjklmnpqrstuvwxyz]+',value) is not None
