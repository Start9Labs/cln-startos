import {
  InputSpec,
  Value,
  Variants,
} from '@start9labs/start-sdk/base/lib/actions/input/builder'
import { sdk } from '../../sdk'
import { clnConfig } from '../../fileModels/config'
import { clnConfDefaults } from '../../utils'
import { storeJson } from '../../fileModels/store.json'

const {
  'funder-lease-requests-only': funderLeaseRequestsOnly,
  'funder-policy': funderPolicy,
  'lease-fee-base-sat': leaseFeeBaseSat,
  'lease-fee-basis': leaseFeeBasis,
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

const experimentalSpec = InputSpec.of({
  'shutdown-wrong-funding': Value.toggle({
    name: 'Shutdown Wrong Funding',
    default: false,
    description:
      "Allow channel shutdown with alternate txids.  If a remote node has opened a channel, but claims it used the incorrect txid (and the channel hasn't yet been used) this allows them to negotiate a clean shutdown with the txid they offer.  <b>Default: False</b>",
    warning: null,
  }),
  splicing: Value.toggle({
    name: 'Splicing',
    default: false,
    description:
      'Enables support for the splicing protocol (bolt #863), allowing both parties to dynamically adjust the size a channel. These changes can be built interactively using PSBT and combined with other channel actions including dual fund, additional channel splices, or generic transaction activity. The operations will be bundled into a single transaction. The channel will remain active while awaiting splice confirmation, however you can only spend the smaller of the prior channel balance and the new one.  <b>Default: Disabled</b>',
    warning: null,
  }),
  'xpay-handle-pay': Value.toggle({
    name: 'Xpay',
    default: false,
    description:
      'Setting this makes xpay intercept simply pay commands (default false). Note that the response will be different from the normal pay command, however.  <b>Default: Disabled</b>',
    warning: null,
  }),
  'dual-fund': Value.union({
    name: 'Dual Funding And Liquidity Ads',
    description:
      'Dual Funding enables use of the channel opening protocol v2, in which both channel parties commit funds into the channel at opening. This potentially solves all sorts of problems with liquidity on the Lightning Network, but is currently experimental and only implemented by Core Lightning so far.<br>See https://blog.blockstream.com/setting-up-liquidity-ads-in-c-lightning/ for more details.  <b>Default: Disabled</b>',
    warning:
      'Dual funding is an experimental feature which can cause your node to automatically commit on-chain funds into channels that may or may not be profitable. <b>Use at your own risk!</b>',
    default: 'disabled',
    variants: Variants.of({
      disabled: { name: 'Disabled', spec: InputSpec.of({}) },
      enabled: {
        name: 'Enabled',
        spec: InputSpec.of({
          strategy: Value.union({
            name: 'Dual-Funding Channel Acceptance Strategy',
            description:
              "Select from two different operating strategies: Incognito, or Liquidity Merchant, and fine-tune your selected strategy's settings.<br><ul><li><b>Incognito: </b>Wait for others to stumble upon your unadvertised node and open a dual-fund request, then react in a more complex way</li><li><b>Liquidity Merchant: </b>Advertise and sell liquidity on the market in a straightforward way (i.e., always match 100% of requested funds, and don't accept dual-funding requests that aren't channel lease requests).</li></ul><br><b>Default: Incognito</b>",
            warning: null,
            default: 'incognito',
            variants: Variants.of({
              incognito: {
                name: 'Incognito',
                spec: InputSpec.of({
                  policy: Value.union({
                    name: 'Policy',
                    description:
                      '<ul><li><b>Match: </b>Contribute a percentage of their requested funds.</li><li><b>Available: </b>Contribute policy_mod percent of our available node wallet funds.</li><li><b>Fixed: </b>Contribute a fixed number of sats to v2 channel open requests.</li></ul><br><b>Default: Match</b>',
                    warning: null,
                    default: 'match',
                    variants: Variants.of({
                      match: {
                        name: 'Match',
                        spec: InputSpec.of({
                          'policy-mod': Value.number({
                            name: 'Percentage of Requested Funds to Commit',
                            description:
                              'Percentage of requested funds to commit to the channel. If this is a channel lease request, we match based on their requested funds. If it is not a channel lease request (and leases only is false, which is is by default), then we match their funding amount. Note: any lease match less than 100 will likely fail, as clients will not accept a lease less than their request.  <b>Default: 100</b>',
                            warning: null,
                            default: 100,
                            required: false,
                            min: 0,
                            max: 200,
                            step: null,
                            integer: true,
                            units: 'percent',
                            placeholder: null,
                          }),
                        }),
                      },
                      available: {
                        name: 'Available',
                        spec: InputSpec.of({
                          'policy-mod': Value.number({
                            name: 'Percentage of Available Funds to Commit',
                            description:
                              'Percentage of available on-chain funds to commit to the channel.  <b>Default: 100</b>',
                            warning: null,
                            default: 100,
                            required: false,
                            min: 0,
                            max: 100,
                            step: null,
                            integer: true,
                            units: 'percent',
                            placeholder: null,
                          }),
                        }),
                      },
                      fixed: {
                        name: 'Fixed',
                        spec: InputSpec.of({
                          'policy-mod': Value.number({
                            name: 'Fixed Number of Satoshis to Commit',
                            description:
                              'Fixed number of sats to contribute to the channel.  <b>Default: 10000</b>',
                            warning: null,
                            default: 10000,
                            required: false,
                            min: 0,
                            max: 10_000_000_000,
                            step: null,
                            integer: true,
                            units: 'satoshis',
                            placeholder: null,
                          }),
                        }),
                      },
                    }),
                  }),
                  'fuzz-percent': Value.number({
                    name: 'Fuzz Percentage',
                    description:
                      'A percentage to fuzz the resulting contribution amount by.<b>WARNING: Fuzzing with a Match 100% policy can cause random failures.<b><br><b>Defaults to 0% (no fuzz)</b>',
                    warning: null,
                    default: null,
                    required: false,
                    min: 0,
                    max: 100,
                    step: null,
                    integer: true,
                    units: 'percent',
                    placeholder: null,
                  }),
                  'fund-probability': Value.number({
                    name: 'Fund Probability',
                    description:
                      'The percent of v2 channel open requests to apply our policy to. Valid values are integers from 0 (fund no requests) to 100 (fund every request). Useful for randomizing opens that receive funds.  <b>Default: 100</b>',
                    warning: null,
                    default: 100,
                    required: false,
                    min: 0,
                    max: 100,
                    step: null,
                    integer: true,
                    units: 'percent',
                    placeholder: null,
                  }),
                }),
              },
              merchant: {
                name: 'Liquidity Merchant',
                spec: InputSpec.of({
                  'lease-fee-base-sat': Value.number({
                    name: 'Fixed Lease Fee',
                    description:
                      'The flat fee for a channel lease. Node will receive this much extra added to their channel balance, paid by the opening node.  <b>Default: 2000</b>',
                    warning: null,
                    default: 2000,
                    required: false,
                    min: 1,
                    max: 10_000_000_000,
                    step: null,
                    integer: true,
                    units: 'satoshis',
                    placeholder: null,
                  }),
                  'lease-fee-basis': Value.number({
                    name: 'Fee as Percentage of Requested Funds',
                    description:
                      "A basis fee that's calculated as 1/10k of the total requested funds the peer is asking for. Node will receive the total of the lease fee basis * requested funds / 10k satoshis added to their channel balance, paid by the opening node. <b>Default: 0.65% (65 basis points)</b>",
                    warning: null,
                    default: 65,
                    required: false,
                    min: 0,
                    max: 1_000_000,
                    step: null,
                    integer: true,
                    units: 'basis points (hundredths of a percent)',
                    placeholder: null,
                  }),
                  'funding-weight': Value.number({
                    name: 'Funding Weight',
                    description:
                      'Transaction weight the channel opener will pay us for a leased funding transaction. Node will have this funding fee added to their channel balance, paid by the opening node. <b>Default: dynamically calculated for 2 inputs + 1 P2WPKH output</b>',
                    warning: null,
                    default: null,
                    required: false,
                    min: 0,
                    max: 10_000,
                    step: null,
                    integer: true,
                    units: 'weight units',
                    placeholder: null,
                  }),
                  'channel-fee-max-base-msat': Value.number({
                    name: 'Channel Fee Max Base',
                    description:
                      'A commitment to a maximum channel_fee_base_msat that your node will charge for routing payments over this leased channel during the lease duration. <b>Default: 5000000</b>',
                    warning: null,
                    default: 5000000,
                    required: false,
                    min: 0,
                    max: 10_000_000_000_000,
                    step: null,
                    integer: true,
                    units: 'millisatoshis',
                    placeholder: null,
                  }),
                  'channel-fee-max-proportional-thousandths': Value.number({
                    name: 'Channel Fee Max Proportional',
                    description:
                      "A commitment to a maximum channel_fee_proportional_millionths that your node will charge for routing payments over this leased channel during the lease duration. Note that it's denominated in 'thousandths'. A setting of 1 is equal to 1k ppm; 5 is 5k ppm, etc. <b>Default: 100 (100k ppm)</b>",
                    warning: null,
                    default: 100,
                    required: false,
                    min: 0,
                    max: 1_000,
                    step: null,
                    integer: true,
                    units: 'thousandths',
                    placeholder: null,
                  }),
                }),
              },
            }),
          }),
          other: Value.object(
            {
              name: 'Other Settings',
              description:
                'Additional settings that apply to both operating strategies',
            },
            InputSpec.of({
              'min-their-funding-msat': Value.number({
                name: 'Minimum Their Funding',
                description:
                  'The minimum funding msats that we require in order to activate our contribution policy to the v2 open.  <b>Default: 10000000</b>',
                warning: null,
                default: 10000000,
                required: false,
                min: 0,
                max: 10_000_000_000_000,
                step: null,
                integer: true,
                units: 'millisatoshis',
                placeholder: null,
              }),
              'max-their-funding-msat': Value.number({
                name: 'Maximum Their Funding',
                description:
                  'The maximum funding msats that we will consider to activate our contribution policy to the v2 open. Any channel open above this will not be funded.  <b>Default: No max</b>',
                warning: null,
                default: null,
                required: false,
                min: 0,
                max: 10_000_000_000_000,
                step: null,
                integer: true,
                units: 'millisatoshis',
                placeholder: null,
              }),
              'per-channel-min-msat': Value.number({
                name: 'Per-Channel Minimum',
                description:
                  'The minimum amount that we will contribute to a channel open.  <b>Default: 10000000',
                warning: null,
                default: 10000000,
                required: false,
                min: 0,
                max: 10_000_000_000_000,
                step: null,
                integer: true,
                units: 'millisatoshis',
                placeholder: null,
              }),
              'per-channel-max-msat': Value.number({
                name: 'Per-Channel Maximum',
                description:
                  'The maximum amount that we will contribute to a channel open.  <b>Default: 10000000</b>',
                warning: null,
                default: 10000000,
                required: false,
                min: 0,
                max: 10_000_000_000_000,
                step: null,
                integer: true,
                units: 'millisatoshis',
                placeholder: null,
              }),
              'reserve-tank-msat': Value.number({
                name: 'Reserve Tank',
                description:
                  'The amount of msats to leave available in the node wallet.  <b>Default: Nothing (can use all on-chain funds)</b>',
                warning: null,
                default: null,
                required: false,
                min: 0,
                max: 10_000_000_000_000,
                step: null,
                integer: true,
                units: 'millisatoshis',
                placeholder: null,
              }),
            }),
          ),
        }),
      },
    }),
  }),
})

export const experimental = sdk.Action.withInput(
  // id
  'experimental',

  // metadata
  async ({ effects }) => ({
    name: 'Experimental Features',
    description:
      'Experimental features are those that have not yet been standardized across other major Lightning Network implementations.',
    warning:
      'Experimental options are subject to breakage between releases: they are made available for advanced users who want to test proposed features.',
    allowedStatuses: 'any',
    group: 'Config',
    visibility: 'enabled',
  }),

  // form input specification
  experimentalSpec,

  // optionally pre-fill the input form
  async ({ effects }) => read(effects),

  // the execution function
  async ({ effects, input }) => write(effects, input),
)

async function read(effects: any): Promise<PartialExperimentalSpec> {
  const conf = await clnConfig.read().const(effects)
  const store = await storeJson.read().const(effects)
  if (!conf || !store) return {}

  const {
    'lease-fee-base-sat': leaseFeeBaseSat,
    'lease-fee-basis': LeaseFeeBasis,
    'lease-funding-weight': leaseFundingWeight,
    'channel-fee-max-base-msat': channelFeeMaxBaseMsat,
    'channel-fee-max-proportional-thousandths':
      channelFeeMaxProportionalThousandths,
    'funder-lease-requests-only': funderLeaseRequestsOnly,
    'funder-policy': funderPolicy,
    'funder-fuzz-percent': funderFuzzPercent,
    'funder-fund-probability': funderFundProbability,
    'funder-policy-mod': funderPolicyMod,
    'funder-min-their-funding': funderMinTheirFunding,
    'funder-max-their-funding': funderMaxTheirFunding,
    'funder-per-channel-min': funderPerChannelMin,
    'funder-per-channel-max': funderPerChannelMax,
    'funder-reserve-tank': funderReserveTank,
  } = conf

  let dualFunding: PartialExperimentalSpec = {
    'dual-fund': {
      selection: 'disabled' as const,
    },
  }

  if (store['experimental-dual-fund']) {
    const other = {
      'min-their-funding-msat': funderMinTheirFunding,
      'max-their-funding-msat': funderMaxTheirFunding,
      'per-channel-min-msat': funderPerChannelMin,
      'per-channel-max-msat': funderPerChannelMax,
      'reserve-tank-msat': funderReserveTank,
    }

    if (
      leaseFeeBaseSat ||
      LeaseFeeBasis ||
      leaseFundingWeight ||
      channelFeeMaxBaseMsat ||
      channelFeeMaxProportionalThousandths
    ) {
      const merchant: PartialExperimentalSpec = {
        'dual-fund': {
          selection: 'enabled',
          value: {
            strategy: {
              selection: 'merchant',
              value: {
                'lease-fee-base-sat': leaseFeeBaseSat,
                'lease-fee-basis': LeaseFeeBasis,
                'funding-weight': leaseFundingWeight,
                'channel-fee-max-base-msat': channelFeeMaxBaseMsat,
                'channel-fee-max-proportional-thousandths':
                  channelFeeMaxProportionalThousandths,
              },
            },
            other,
          },
        },
      }
      Object.assign(dualFunding, merchant)
    } else {
      const incognito: PartialExperimentalSpec = {
        'dual-fund': {
          selection: 'enabled',
          value: {
            strategy: {
              selection: 'incognito',
              value: {
                policy: {
                  selection: funderPolicy as 'match' | 'fixed' | 'available',
                  value: {
                    'policy-mod': funderPolicyMod,
                  },
                },
                'fuzz-percent': funderFuzzPercent,
                'fund-probability': funderFundProbability,
              },
            },
            other,
          },
        },
      }
      Object.assign(dualFunding, incognito)
    }
  }

  return {
    ...dualFunding,
    'shutdown-wrong-funding': store['experimental-shutdown-wrong-funding'],
    splicing: store['experimental-splicing'],
    'xpay-handle-pay': conf['xpay-handle-pay'],
  }
}

async function write(effects: any, input: ExperimentalSpec) {
  const {
    'shutdown-wrong-funding': shutdownWrongFunding,
    'xpay-handle-pay': xpayHandlePay,
    splicing,
    'dual-fund': { selection, value },
  } = input

  await storeJson.merge(effects, {
    'experimental-dual-fund': selection === 'enabled',
    'experimental-shutdown-wrong-funding': shutdownWrongFunding,
    'experimental-splicing': splicing,
  })

  let dualFunding = {}

  if (selection === 'enabled') {
    const other = {
      'funder-min-their-funding':
        value.other['min-their-funding-msat'] || funderMinTheirFunding,
      'funder-max-their-funding':
        value.other['max-their-funding-msat'] || funderMaxTheirFunding,
      'funder-per-channel-min':
        value.other['per-channel-min-msat'] || funderPerChannelMin,
      'funder-per-channel-max':
        value.other['per-channel-max-msat'] || funderPerChannelMax,
      'funder-reserve-tank':
        value.other['reserve-tank-msat'] || funderReserveTank,
    }
    if (value.strategy.selection === 'incognito') {
      const incognito = {
        'funder-lease-requests-only': false,
        'funder-policy': value.strategy.value.policy.selection,
        'lease-fee-base-sat': leaseFeeBaseSat,
        'lease-fee-basis': leaseFeeBasis,
        'lease-funding-weight': leaseFundingWeight,
        'channel-fee-max-base-msat': channelFeeMaxBaseMsat,
        'channel-fee-max-proportional-thousandths': channelFeeMaxBaseMsat,
        'funder-fuzz-percent':
          value.strategy.value['fuzz-percent'] || funderFuzzPercent,
        'funder-fund-probability':
          value.strategy.value['fund-probability'] || funderFundProbability,
        'funder-policy-mod':
          value.strategy.value.policy.value['policy-mod'] || 100,
        ...other,
      }
      Object.assign(dualFunding, incognito)
    } else {
      const merchant = {
        'funder-lease-requests-only': true,
        'funder-policy': 'match',
        'lease-fee-base-sat':
          value.strategy.value['lease-fee-base-sat'] || leaseFeeBaseSat,
        'lease-fee-basis':
          value.strategy.value['lease-fee-basis'] || leaseFeeBasis,
        'lease-funding-weight':
          value.strategy.value['funding-weight'] || leaseFundingWeight,
        'channel-fee-max-base-msat':
          value.strategy.value['channel-fee-max-base-msat'] ||
          channelFeeMaxBaseMsat,
        'channel-fee-max-proportional-thousandths':
          value.strategy.value['channel-fee-max-proportional-thousandths'] ||
          channelFeeMaxBaseMsat,
        'funder-fuzz-percent': funderFuzzPercent,
        'funder-fund-probability': funderFundProbability,
        'funder-policy-mod': 100,
        ...other,
      }
      Object.assign(dualFunding, merchant)
    }
  } else {
    const disableDualFunding = {
      'funder-lease-requests-only': funderLeaseRequestsOnly,
      'funder-policy': funderPolicy,
      'lease-fee-base-sat': leaseFeeBaseSat,
      'lease-fee-basis': leaseFeeBasis,
      'lease-funding-weight': leaseFundingWeight,
      'channel-fee-max-base-msat': channelFeeMaxBaseMsat,
      'channel-fee-max-proportional-thousandths': channelFeeMaxBaseMsat,
      'funder-fuzz-percent': funderFuzzPercent,
      'funder-fund-probability': funderFundProbability,
      'funder-policy-mod': funderPolicyMod,
      'funder-min-their-funding': funderMinTheirFunding,
      'funder-max-their-funding': funderMaxTheirFunding,
      'funder-per-channel-min': funderPerChannelMin,
      'funder-per-channel-max': funderPerChannelMax,
      'funder-reserve-tank': funderReserveTank,
    }
    Object.assign(dualFunding, disableDualFunding)
  }

  const experimentalSettings = {
    ...dualFunding,
    'xpay-handle-pay': xpayHandlePay,
  }

  await clnConfig.merge(effects, experimentalSettings)
}

type ExperimentalSpec = typeof experimentalSpec._TYPE
type PartialExperimentalSpec = typeof experimentalSpec._PARTIAL
