import { z } from '@start9labs/start-sdk'
import {
  InputSpec,
  Value,
  Variants,
} from '@start9labs/start-sdk/base/lib/actions/input/builder'
import { clnConfig, fullConfigSpec, shape } from '../../fileModels/config'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

const experimentalSpec = fullConfigSpec
  .filter({ 'xpay-handle-pay': true })
  .add({
    'shutdown-wrong-funding': Value.triState({
      name: i18n('Shutdown Wrong Funding'),
      default: null,
      description: i18n(
        "Allow channel shutdown with alternate txids.  If a remote node has opened a channel, but claims it used the incorrect txid (and the channel hasn't yet been used) this allows them to negotiate a clean shutdown with the txid they offer.  <b>Default: False</b>",
      ),
      footnote: `${i18n('Default')}: false`,
    }),
    splicing: Value.triState({
      name: i18n('Splicing'),
      default: null,
      description: i18n(
        'Enables support for the splicing protocol (bolt #863), allowing both parties to dynamically adjust the size a channel. These changes can be built interactively using PSBT and combined with other channel actions including dual fund, additional channel splices, or generic transaction activity. The operations will be bundled into a single transaction. The channel will remain active while awaiting splice confirmation, however you can only spend the smaller of the prior channel balance and the new one.  <b>Default: Disabled</b>',
      ),
      footnote: `${i18n('Default')}: false`,
    }),
    'dual-fund': Value.union({
      name: i18n('Dual Funding And Liquidity Ads'),
      description: i18n(
        'Dual Funding enables use of the channel opening protocol v2, in which both channel parties commit funds into the channel at opening. This potentially solves all sorts of problems with liquidity on the Lightning Network, but is currently experimental and only implemented by Core Lightning so far.<br>See https://blog.blockstream.com/setting-up-liquidity-ads-in-c-lightning/ for more details.  <b>Default: Disabled</b>',
      ),
      warning: i18n(
        'Dual funding is an experimental feature which can cause your node to automatically commit on-chain funds into channels that may or may not be profitable. <b>Use at your own risk!</b>',
      ),
      default: 'disabled',
      variants: Variants.of({
        disabled: { name: i18n('Disabled'), spec: InputSpec.of({}) },
        enabled: {
          name: i18n('Enabled'),
          spec: InputSpec.of({
            strategy: Value.union({
              name: i18n('Dual-Funding Channel Acceptance Strategy'),
              description: i18n(
                "Select from two different operating strategies: Incognito, or Liquidity Merchant, and fine-tune your selected strategy's settings.<br><ul><li><b>Incognito: </b>Wait for others to stumble upon your unadvertised node and open a dual-fund request, then react in a more complex way</li><li><b>Liquidity Merchant: </b>Advertise and sell liquidity on the market in a straightforward way (i.e., always match 100% of requested funds, and don't accept dual-funding requests that aren't channel lease requests).</li></ul><br><b>Default: Incognito</b>",
              ),
              default: 'incognito',
              variants: Variants.of({
                incognito: {
                  name: i18n('Incognito'),
                  spec: InputSpec.of({
                    policy: Value.union({
                      name: i18n('Policy'),
                      description: i18n(
                        '<ul><li><b>Match: </b>Contribute a percentage of their requested funds.</li><li><b>Available: </b>Contribute policy_mod percent of our available node wallet funds.</li><li><b>Fixed: </b>Contribute a fixed number of sats to v2 channel open requests.</li></ul><br><b>Default: Fixed</b>',
                      ),
                      warning: null,
                      default: 'fixed',
                      variants: Variants.of({
                        match: {
                          name: i18n('Match'),
                          spec: InputSpec.of({
                            'policy-mod': Value.number({
                              name: i18n(
                                'Percentage of Requested Funds to Commit',
                              ),
                              description: i18n(
                                'Percentage of requested funds to commit to the channel. If this is a channel lease request, we match based on their requested funds. If it is not a channel lease request (and leases only is false, which is is by default), then we match their funding amount. Note: any lease match less than 100 will likely fail, as clients will not accept a lease less than their request.  <b>Default: 100</b>',
                              ),
                              default: null,
                              required: false,
                              min: 0,
                              max: 200,
                              integer: true,
                              units: 'percent',
                              footnote: `${i18n('Default')}: 100 percent`,
                            }),
                          }),
                        },
                        available: {
                          name: i18n('Available'),
                          spec: InputSpec.of({
                            'policy-mod': Value.number({
                              name: i18n(
                                'Percentage of Available Funds to Commit',
                              ),
                              description: i18n(
                                'Percentage of available on-chain funds to commit to the channel.  <b>Default: 100</b>',
                              ),
                              default: null,
                              required: false,
                              min: 0,
                              max: 100,
                              integer: true,
                              units: 'percent',
                              footnote: `${i18n('Default')}: 100 percent`,
                            }),
                          }),
                        },
                        fixed: {
                          name: i18n('Fixed'),
                          spec: InputSpec.of({
                            'policy-mod': Value.number({
                              name: i18n('Fixed Number of Satoshis to Commit'),
                              description: i18n(
                                'Fixed number of sats to contribute to the channel.  <b>Default: 10000</b>',
                              ),
                              default: null,
                              required: false,
                              min: 0,
                              max: 10_000_000_000,
                              integer: true,
                              units: 'satoshis',
                              footnote: `${i18n('Default')}: 10000 satoshis`,
                            }),
                          }),
                        },
                      }),
                    }),
                    'fuzz-percent': Value.number({
                      name: i18n('Fuzz Percentage'),
                      description: i18n(
                        'A percentage to fuzz the resulting contribution amount by.<b>WARNING: Fuzzing with a Match 100% policy can cause random failures.<b><br><b>Defaults to 0% (no fuzz)</b>',
                      ),
                      default: null,
                      required: false,
                      min: 0,
                      max: 100,
                      integer: true,
                      units: 'percent',
                      footnote: `${i18n('Default')}: 0 percent`,
                    }),
                    'fund-probability': Value.number({
                      name: i18n('Fund Probability'),
                      description: i18n(
                        'The percent of v2 channel open requests to apply our policy to. Valid values are integers from 0 (fund no requests) to 100 (fund every request). Useful for randomizing opens that receive funds.  <b>Default: 100</b>',
                      ),
                      default: null,
                      required: false,
                      min: 0,
                      max: 100,
                      integer: true,
                      units: 'percent',
                      footnote: `${i18n('Default')}: 100 percent`,
                    }),
                  }),
                },
                merchant: {
                  name: i18n('Liquidity Merchant'),
                  spec: InputSpec.of({
                    'lease-fee-base-sat': Value.number({
                      name: i18n('Fixed Lease Fee'),
                      description: i18n(
                        'The flat fee for a channel lease. Node will receive this much extra added to their channel balance, paid by the opening node.  <b>Default: 2000</b>',
                      ),
                      default: null,
                      required: false,
                      min: 1,
                      max: 10_000_000_000,
                      integer: true,
                      units: 'satoshis',
                      footnote: `${i18n('Default')}: 2000 satoshis`,
                    }),
                    'lease-fee-basis': Value.number({
                      name: i18n('Fee as Percentage of Requested Funds'),
                      description: i18n(
                        "A basis fee that's calculated as 1/10k of the total requested funds the peer is asking for. Node will receive the total of the lease fee basis * requested funds / 10k satoshis added to their channel balance, paid by the opening node. <b>Default: 0.65% (65 basis points)</b>",
                      ),
                      default: null,
                      required: false,
                      min: 0,
                      max: 1_000_000,
                      integer: true,
                      units: 'basis points (hundredths of a percent)',
                      footnote: `${i18n('Default')}: 65 basis points`,
                    }),
                    'funding-weight': Value.number({
                      name: i18n('Funding Weight'),
                      description: i18n(
                        'Transaction weight the channel opener will pay us for a leased funding transaction. Node will have this funding fee added to their channel balance, paid by the opening node. <b>Default: dynamically calculated for 2 inputs + 1 P2WPKH output</b>',
                      ),
                      default: null,
                      required: false,
                      min: 0,
                      max: 10_000,
                      integer: true,
                      units: 'weight units',
                      footnote: `${i18n('Default')}: dynamically calculated`,
                    }),
                    'channel-fee-max-base-msat': Value.number({
                      name: i18n('Channel Fee Max Base'),
                      description: i18n(
                        'A commitment to a maximum channel_fee_base_msat that your node will charge for routing payments over this leased channel during the lease duration. <b>Default: 5000000</b>',
                      ),
                      default: null,
                      required: false,
                      min: 0,
                      max: 10_000_000_000_000,
                      integer: true,
                      units: 'millisatoshis',
                      footnote: `${i18n('Default')}: 5000000 millisatoshis`,
                    }),
                    'channel-fee-max-proportional-thousandths': Value.number({
                      name: i18n('Channel Fee Max Proportional'),
                      description: i18n(
                        "A commitment to a maximum channel_fee_proportional_millionths that your node will charge for routing payments over this leased channel during the lease duration. Note that it's denominated in 'thousandths'. A setting of 1 is equal to 1k ppm; 5 is 5k ppm, etc. <b>Default: 100 (100k ppm)</b>",
                      ),
                      default: null,
                      required: false,
                      min: 0,
                      max: 1_000,
                      integer: true,
                      units: 'thousandths',
                      footnote: `${i18n('Default')}: 100 thousandths`,
                    }),
                  }),
                },
              }),
            }),
            other: Value.object(
              {
                name: i18n('Other Settings'),
                description: i18n(
                  'Additional settings that apply to both operating strategies',
                ),
              },
              InputSpec.of({
                'min-their-funding-msat': Value.number({
                  name: i18n('Minimum Their Funding'),
                  description: i18n(
                    'The minimum funding msats that we require in order to activate our contribution policy to the v2 open.  <b>Default: 10000000</b>',
                  ),
                  default: null,
                  required: false,
                  min: 0,
                  max: 10_000_000_000_000,
                  integer: true,
                  units: 'millisatoshis',
                  footnote: `${i18n('Default')}: 10000000 millisatoshis`,
                }),
                'max-their-funding-msat': Value.number({
                  name: i18n('Maximum Their Funding'),
                  description: i18n(
                    'The maximum funding msats that we will consider to activate our contribution policy to the v2 open. Any channel open above this will not be funded.  <b>Default: No max</b>',
                  ),
                  default: null,
                  required: false,
                  min: 0,
                  max: 10_000_000_000_000,
                  integer: true,
                  units: 'millisatoshis',
                  footnote: `${i18n('Default')}: no maximum`,
                }),
                'per-channel-min-msat': Value.number({
                  name: i18n('Per-Channel Minimum'),
                  description: i18n(
                    'The minimum amount that we will contribute to a channel open.  <b>Default: 10000000',
                  ),
                  default: null,
                  required: false,
                  min: 0,
                  max: 10_000_000_000_000,
                  integer: true,
                  units: 'millisatoshis',
                  footnote: `${i18n('Default')}: 10000000 millisatoshis`,
                }),
                'per-channel-max-msat': Value.number({
                  name: i18n('Per-Channel Maximum'),
                  description: i18n(
                    'The maximum amount that we will contribute to a channel open.  <b>Default: 10000000</b>',
                  ),
                  default: null,
                  required: false,
                  min: 0,
                  max: 10_000_000_000_000,
                  integer: true,
                  units: 'millisatoshis',
                  footnote: `${i18n('Default')}: 10000000 millisatoshis`,
                }),
                'reserve-tank-msat': Value.number({
                  name: i18n('Reserve Tank'),
                  description: i18n(
                    'The amount of msats to leave available in the node wallet.  <b>Default: Nothing (can use all on-chain funds)</b>',
                  ),
                  default: null,
                  required: false,
                  min: 0,
                  max: 10_000_000_000_000,
                  integer: true,
                  units: 'millisatoshis',
                  footnote: `${i18n('Default')}: 0 millisatoshis`,
                }),
              }),
            ),
          }),
        },
      }),
    }),
  })

type ExperimentalSpec = typeof experimentalSpec._TYPE
type PartialExperimentalSpec = typeof experimentalSpec._PARTIAL

export const experimental = sdk.Action.withInput(
  // id
  'experimental',

  // metadata
  async ({ effects }) => ({
    name: i18n('Experimental Features'),
    description: i18n(
      'Experimental features are those that have not yet been standardized across other major Lightning Network implementations.',
    ),
    warning: i18n(
      'Experimental options are subject to breakage between releases: they are made available for advanced users who want to test proposed features.',
    ),
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  // form input specification
  experimentalSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    const form = await clnConfig.read().once()
    if (!form) return {}
    const raw = form.raw as z.infer<typeof shape> | undefined

    return {
      ...form,
      'shutdown-wrong-funding': raw?.['experimental-shutdown-wrong-funding'],
      splicing: raw?.['experimental-splicing'],
      'dual-fund': computeDualFundPrefill(raw),
    }
  },

  // the execution function
  async ({ effects, input }) => {
    const { 'dual-fund': dualFund } = input
    const funderFields = dualFundToRaw(dualFund)

    const form = await clnConfig.read().once()
    await clnConfig.merge(effects, {
      'xpay-handle-pay': input['xpay-handle-pay'],
      raw: {
        ...(form?.raw ?? {}),
        ...funderFields,
        'experimental-dual-fund': dualFund.selection === 'enabled' || undefined,
        'experimental-shutdown-wrong-funding':
          input['shutdown-wrong-funding'] || undefined,
        'experimental-splicing': input.splicing || undefined,
      },
    })
  },
)

function computeDualFundPrefill(
  raw: z.infer<typeof shape> | undefined,
): PartialExperimentalSpec['dual-fund'] {
  if (!raw || !raw['experimental-dual-fund']) {
    return { selection: 'disabled' as const }
  }

  const other = {
    'min-their-funding-msat': raw['funder-min-their-funding'],
    'max-their-funding-msat': raw['funder-max-their-funding'],
    'per-channel-min-msat': raw['funder-per-channel-min'],
    'per-channel-max-msat': raw['funder-per-channel-max'],
    'reserve-tank-msat': raw['funder-reserve-tank'],
  }

  // Determine strategy: if lease fee fields are set, it's merchant; otherwise incognito
  if (
    raw['lease-fee-base-sat'] ||
    raw['lease-fee-basis'] ||
    raw['lease-funding-weight'] ||
    raw['channel-fee-max-base-msat'] ||
    raw['channel-fee-max-proportional-thousandths']
  ) {
    return {
      selection: 'enabled',
      value: {
        strategy: {
          selection: 'merchant',
          value: {
            'lease-fee-base-sat': raw['lease-fee-base-sat'],
            'lease-fee-basis': raw['lease-fee-basis'],
            'funding-weight': raw['lease-funding-weight'],
            'channel-fee-max-base-msat': raw['channel-fee-max-base-msat'],
            'channel-fee-max-proportional-thousandths':
              raw['channel-fee-max-proportional-thousandths'],
          },
        },
        other,
      },
    }
  }

  return {
    selection: 'enabled',
    value: {
      strategy: {
        selection: 'incognito',
        value: {
          policy: {
            selection: raw['funder-policy'],
            value: {
              'policy-mod': raw['funder-policy-mod'],
            },
          },
          'fuzz-percent': raw['funder-fuzz-percent'],
          'fund-probability': raw['funder-fund-probability'],
        },
      },
      other,
    },
  }
}

function dualFundToRaw(
  dualFund: ExperimentalSpec['dual-fund'],
): Partial<z.infer<typeof shape>> {
  if (dualFund.selection !== 'enabled') {
    // When disabled, clear all funder fields (CLN uses internal defaults)
    return {
      'funder-lease-requests-only': undefined,
      'funder-policy': undefined,
      'funder-policy-mod': undefined,
      'funder-fuzz-percent': undefined,
      'funder-fund-probability': undefined,
      'funder-min-their-funding': undefined,
      'funder-max-their-funding': undefined,
      'funder-per-channel-min': undefined,
      'funder-per-channel-max': undefined,
      'funder-reserve-tank': undefined,
      'lease-fee-base-sat': undefined,
      'lease-fee-basis': undefined,
      'lease-funding-weight': undefined,
      'channel-fee-max-base-msat': undefined,
      'channel-fee-max-proportional-thousandths': undefined,
    }
  }

  const { strategy, other } = dualFund.value

  const commonOther = {
    'funder-min-their-funding': other['min-their-funding-msat'] ?? undefined,
    'funder-max-their-funding': other['max-their-funding-msat'] ?? undefined,
    'funder-per-channel-min': other['per-channel-min-msat'] ?? undefined,
    'funder-per-channel-max': other['per-channel-max-msat'] ?? undefined,
    'funder-reserve-tank': other['reserve-tank-msat'] ?? undefined,
  }

  if (strategy.selection === 'incognito') {
    return {
      'funder-lease-requests-only': undefined,
      'funder-policy': strategy.value.policy.selection,
      'funder-policy-mod':
        strategy.value.policy.value['policy-mod'] ?? undefined,
      'funder-fuzz-percent': strategy.value['fuzz-percent'] ?? undefined,
      'funder-fund-probability':
        strategy.value['fund-probability'] ?? undefined,
      'lease-fee-base-sat': undefined,
      'lease-fee-basis': undefined,
      'lease-funding-weight': undefined,
      'channel-fee-max-base-msat': undefined,
      'channel-fee-max-proportional-thousandths': undefined,
      ...commonOther,
    }
  }

  // merchant
  return {
    'funder-lease-requests-only': 'true',
    'funder-policy': 'match',
    'funder-policy-mod': 100,
    'funder-fuzz-percent': 0,
    'funder-fund-probability': 100,
    'lease-fee-base-sat': strategy.value['lease-fee-base-sat'] ?? undefined,
    'lease-fee-basis': strategy.value['lease-fee-basis'] ?? undefined,
    'lease-funding-weight': strategy.value['funding-weight'] ?? undefined,
    'channel-fee-max-base-msat':
      strategy.value['channel-fee-max-base-msat'] ?? undefined,
    'channel-fee-max-proportional-thousandths':
      strategy.value['channel-fee-max-proportional-thousandths'] ?? undefined,
    ...commonOther,
  }
}
