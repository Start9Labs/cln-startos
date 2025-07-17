import { matches, FileHelper } from '@start9labs/start-sdk'
import { clnConfDefaults } from '../utils'
const { object, anyOf } = matches

const stringArray = matches.array(matches.string)
const string = stringArray.map(([a]) => a).orParser(matches.string)
const number = string.map((a) => Number(a)).orParser(matches.number)
const natural = string.map((a) => Number(a)).orParser(matches.natural)
const boolean = number.map((a) => !!a).orParser(matches.boolean)
const literal = (val: string | number) => {
  return matches
    .literal([String(val)])
    .orParser(matches.literal(String(val)))
    .orParser(matches.literal(val))
    .map((a) => (typeof val === 'number' ? Number(a) : a))
}

const {
  network,
  'bitcoin-rpcconnect': bitcoinRpcconnect,
  'bitcoin-rpcport': bitcoinRpcport,
  'bitcoin-datadir': bitcoindDatadir,
  'bind-addr': bindAddr,
  'announce-addr': announceAddr,
  proxy,
  'always-use-proxy': alwaysUseProxy,
  'clnrest-host': clnrestHost,
  'clnrest-port': clnrestPort,
  alias,
  rgb,
  'autoclean-cycle': autocleanCycle,
  'autoclean-succeededforwards-age': autocleanSucceededforwardsAge,
  'autoclean-failedforwards-age': autocleanFailedforwardsAge,
  'autoclean-succeededpays-age': autocleanSucceededpaysAge,
  'autoclean-failedpays-age': autocleanFailedpaysAge,
  'autoclean-paidinvoices-age': autocleanPaidinvoicesAge,
  'autoclean-expiredinvoices-age': autocleanExpiredinvoicesAge,
  'fee-base': feeBase,
  'fee-per-satoshi': feePerSatoshi,
  'min-capacity-sat': minCapacitySat,
  'ignore-fee-limits': ignoreFeeLimits,
  'funding-confirms': fundingConfirms,
  'cltv-delta': cltvDelta,
  'htlc-minimum-msat': htlcMinimumMsat,
  'htlc-maximum-msat': htlcMaximumMsat,
  'xpay-handle-pay': xpayHandlePay,
  plugin,
  'funder-lease-requests-only': funderLeaseRequestsOnly,
  'funder-policy': funderPolicy,
  'lease-fee-base-sat': leaseFeeBaseSat,
  'lease-fee-basis': LeaseFeeBasis,
  'lease-funding-weight': leaseFundingWeight,
  'channel-fee-max-base-msat': channelFeeMaxBaseMsat,
  'channel-fee-max-proportional-thousandths':
    channelFeeMaxProportionalThousandths,
  'funder-fuzz-percent': funderFuzzPercent,
  'funder-fund-probability': funderFundProbability,
  'funder-policy-mod': funderPolicyMod,
  'funder-min-their-funding': funderMinTheirFunding,
  'funder-max-their-funding': funderMaxTheirFunding,
  'funder-per-channel-min': funderPerChannelMin,
  'funder-per-channel-max': funderPerChannelMax,
  'funder-reserve-tank': funderReserveTank,
} = clnConfDefaults

const shape = object({
  // Static options
  // TODO expose other network options namely testnet4
  network: literal(network).onMismatch(network),
  'bitcoin-rpcconnect':
    literal(bitcoinRpcconnect).onMismatch(bitcoinRpcconnect),
  'bitcoin-rpcport': literal(bitcoinRpcport).onMismatch(bitcoinRpcport),
  'bitcoin-datadir': literal(bitcoindDatadir).onMismatch(bitcoindDatadir),
  'bind-addr': stringArray.onMismatch(bindAddr),

  'announce-addr': stringArray.optional().onMismatch(announceAddr),
  proxy: string.optional().onMismatch(proxy),
  'always-use-proxy': boolean.optional().onMismatch(alwaysUseProxy),
  'clnrest-host': literal(clnrestHost).optional().onMismatch(clnrestHost),
  'clnrest-port': literal(clnrestPort).optional().onMismatch(clnrestPort),
  alias: string.optional().onMismatch(alias),
  rgb: string.optional().onMismatch(rgb),

  // Autoclean
  'autoclean-cycle': natural.optional().onMismatch(autocleanCycle),
  'autoclean-succeededforwards-age': natural
    .optional()
    .onMismatch(autocleanSucceededforwardsAge),
  'autoclean-failedforwards-age': natural
    .optional()
    .onMismatch(autocleanFailedforwardsAge),
  'autoclean-succeededpays-age': natural
    .optional()
    .onMismatch(autocleanSucceededpaysAge),
  'autoclean-failedpays-age': natural
    .optional()
    .onMismatch(autocleanFailedpaysAge),
  'autoclean-paidinvoices-age': natural
    .optional()
    .onMismatch(autocleanPaidinvoicesAge),
  'autoclean-expiredinvoices-age': natural
    .optional()
    .onMismatch(autocleanExpiredinvoicesAge),

  // Advanced
  'fee-base': natural.optional().onMismatch(feeBase),
  'fee-per-satoshi': natural.optional().onMismatch(feePerSatoshi),
  'min-capacity-sat': natural.optional().onMismatch(minCapacitySat),
  'ignore-fee-limits': boolean.optional().onMismatch(ignoreFeeLimits),
  'funding-confirms': natural.optional().onMismatch(fundingConfirms),
  'cltv-delta': natural.optional().onMismatch(cltvDelta),
  'htlc-minimum-msat': natural.optional().onMismatch(htlcMinimumMsat),
  'htlc-maximum-msat': natural.optional().onMismatch(htlcMaximumMsat),
  'xpay-handle-pay': boolean.optional().onMismatch(xpayHandlePay),
  plugin: stringArray.optional().onMismatch(plugin),

  // Dual Funding
  'funder-lease-requests-only': boolean
    .optional()
    .onMismatch(funderLeaseRequestsOnly),
  'funder-policy': anyOf(
    literal('match'),
    literal('available'),
    literal('fixed'),
  )
    .optional()
    .onMismatch(funderPolicy),
  'lease-fee-base-sat': natural.optional().onMismatch(leaseFeeBaseSat),
  'lease-fee-basis': natural.optional().onMismatch(LeaseFeeBasis),
  'lease-funding-weight': natural.optional().onMismatch(leaseFundingWeight),
  'channel-fee-max-base-msat': natural
    .optional()
    .onMismatch(channelFeeMaxBaseMsat),
  'channel-fee-max-proportional-thousandths': natural
    .optional()
    .onMismatch(channelFeeMaxProportionalThousandths),
  'funder-fuzz-percent': natural.optional().onMismatch(funderFuzzPercent),
  'funder-fund-probability': natural
    .optional()
    .onMismatch(funderFundProbability),
  'funder-policy-mod': natural.optional().onMismatch(funderPolicyMod),
  'funder-min-their-funding': natural
    .optional()
    .onMismatch(funderMinTheirFunding),
  'funder-max-their-funding': natural
    .optional()
    .onMismatch(funderMaxTheirFunding),
  'funder-per-channel-min': natural.optional().onMismatch(funderPerChannelMin),
  'funder-per-channel-max': natural.optional().onMismatch(funderPerChannelMax),
  'funder-reserve-tank': natural.optional().onMismatch(funderReserveTank),
})

export const clnConfig = FileHelper.ini(
  {
    volumeId: 'main',
    subpath: '/config',
  },
  shape,
)
