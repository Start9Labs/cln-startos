"""Unsigned one-part swap invoices for the new protocol; CLN signs them.

This does not register an invoice, hold an HTLC, or grant payment authority.
The caller must enroll a quote and validate the signed decode before publishing.
"""
import time
from chain_identity import BTC, PRIVKEYIO_XBT, hex_field, require, wire

CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'


def polymod(values):
    check = 1
    generators = (0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3)
    for value in values:
        top = check >> 25
        check = ((check & 0x1ffffff) << 5) ^ value
        for i, generator in enumerate(generators):
            if (top >> i) & 1:
                check ^= generator
    return check


def encode(hrp, words):
    expanded = [ord(c) >> 5 for c in hrp] + [0] + [ord(c) & 31 for c in hrp]
    check = polymod(expanded + words + [0] * 6) ^ 1
    checksum = [(check >> (5 * (5 - i))) & 31 for i in range(6)]
    return hrp + '1' + ''.join(CHARSET[w] for w in words + checksum)


def uint_words(value):
    require(type(value) is int and value >= 0, 'invalid_invoice_integer')
    words = []
    while value:
        words.insert(0, value & 31)
        value >>= 5
    return words or [0]


def byte_words(raw):
    acc = bits = 0
    words = []
    for byte in raw:
        acc = (acc << 8) | byte
        bits += 8
        while bits >= 5:
            bits -= 5
            words.append((acc >> bits) & 31)
        acc &= (1 << bits) - 1
    if bits:
        words.append((acc << (5 - bits)) & 31)
    return words


def unsigned(payment_hash, payment_secret, amount_msat, *, profile, environment,
             expiry, final_cltv, timestamp=None):
    require(profile in (BTC, PRIVKEYIO_XBT), 'invoice_profile_not_supported')
    _, currency = wire(profile, environment)
    require(hex_field(payment_hash, 64) and hex_field(payment_secret, 64), 'invalid_invoice_hashes')
    require(type(amount_msat) is int and 0 < amount_msat <= 2100000000000000000, 'invalid_invoice_amount')
    require(type(expiry) is int and 0 < expiry <= 3600, 'invalid_invoice_expiry')
    require(type(final_cltv) is int and 1 <= final_cltv <= 2016, 'invalid_invoice_cltv')
    if timestamp is None:
        timestamp = int(time.time())
    require(type(timestamp) is int and 0 <= timestamp < (1 << 35), 'invalid_invoice_timestamp')
    words = [(timestamp >> (5 * (6 - i))) & 31 for i in range(7)]

    def tag(letter, payload):
        require(len(payload) <= 1023, 'invoice_field_too_large')
        words.extend([CHARSET.index(letter), len(payload) >> 5, len(payload) & 31, *payload])

    tag('p', byte_words(bytes.fromhex(payment_hash)))
    tag('s', byte_words(bytes.fromhex(payment_secret)))
    tag('d', byte_words(b'BTC to XBT swap' if profile == BTC else b'XBT to BTC swap'))
    tag('x', uint_words(expiry))
    tag('c', uint_words(final_cltv))
    # Compulsory var_onion/payment_secret; never advertise basic_mpp.
    features = (1 << 8) | (1 << 14)
    if profile == PRIVKEYIO_XBT:
        features |= 1 << 512
    tag('9', uint_words(features))
    return encode('ln' + currency + str(amount_msat * 10) + 'p', words + [0] * 104)
