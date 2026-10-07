import {
  clnConfig,
  clbossZerobasefees,
  fullConfigSpec,
} from '../../fileModels/config'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

const { InputSpec, Value, Variants } = sdk

const slingPlugin = '/usr/local/libexec/c-lightning/plugins/sling'
export const clbossPlugin = '/usr/local/libexec/c-lightning/plugins/clboss'

const pluginsSpec = fullConfigSpec.filter({ clnrest: true }).add({
  sling: Value.toggle({
    name: i18n('Sling'),
    default: false,
    description: i18n(
      'Automatically rebalance multiple channels. This is a CLI-only tool.  <b>Default: Disabled</b><br><b>Source:  https://github.com/daywalker90/sling</b>',
    ),
  }),
  clboss: Value.union({
    name: i18n('CLBOSS settings'),
    description: i18n(
      'CLBOSS is an automated manager for Core Lightning forwarding nodes. Source: https://github.com/ZmnSCPxj/clboss\n- Disabled: you open channels and set fees yourself.\n- Enabled: CLBOSS opens channels, buys inbound liquidity, rebalances channels and sets forwarding fees on its own.',
    ),
    warning: i18n(
      "CLBOSS automatically manages your CLN node. It is experimental software and will probably not be profitable to run. It will automatically open channels, buy incoming liquidity, rebalance channels, and set forwarding fees. If you don't want this behavior or don't understand what this means, please keep this option disabled. Source: https://github.com/ZmnSCPxj/clboss#operating",
    ),
    default: 'disabled',
    variants: Variants.of({
      disabled: { name: i18n('Disabled'), spec: InputSpec.of({}) },
      enabled: {
        name: i18n('Enabled'),
        spec: InputSpec.of({
          'min-onchain': Value.number({
            name: i18n('Minimum On-Chain'),
            description: i18n(
              'The minimum amount that CLBOSS will leave in the on-chain wallet. The intent is that this amount will be used in the future, by your node, to manage anchor-commitment channels, or post-Taproot Decker-Russell-Osuntokun channels. These channel types need some small amount of on-chain funds to unilaterally close, so it is not recommended to set it to 0. The amount specified is a ballpark figure, and CLBOSS may leave slightly lower or slightly higher than this amount.  <b>Default: 30000</b>',
            ),
            default: null,
            required: false,
            min: 0,
            max: 10_000_000_000,
            integer: true,
            units: 'satoshis',
            footnote: `${i18n('Default')}: 30000 satoshis`,
          }),
          'auto-close': Value.triState({
            name: i18n('Auto Close'),
            default: null,
            description: i18n(
              'Enable if you want CLBOSS to have the ability to close channels it deems unprofitable.  This can be costly, please understand the ramifications before enabling.  <b>Default: False</b>',
            ),
            warning: i18n('This feature is EXPERIMENTAL AND DANGEROUS!'),
            footnote: `${i18n('Default')}: false`,
          }),
          zerobasefee: Value.select({
            name: i18n('Zero Base Fee'),
            description: i18n(
              "How CLBOSS advertises this node's base fee. Some pathfinding algorithms favor nodes with a zero or low base fee.\n- default: same as allow.\n- required: the base fee is always 0.\n- allow: CLBOSS sets the base fee to 0 when its heuristics favor it, and to whatever they choose otherwise.\n- disallow: the base fee is never 0; where the heuristics would choose 0, CLBOSS sets 1.",
            ),
            default: 'default',
            values: Object.fromEntries(
              clbossZerobasefees.map((v) => [v, v]),
            ) as {
              [K in (typeof clbossZerobasefees)[number]]: K
            },
          } as const),
          'min-channel': Value.number({
            name: i18n('Min Channel Size'),
            description: i18n(
              'The smallest channel CLBOSS opens. CLBOSS raises any value below 500,000 satoshis to 500,000.',
            ),
            default: null,
            required: false,
            min: 0,
            max: 10_000_000_000,
            integer: true,
            units: 'satoshis',
            placeholder: null,
            footnote: `${i18n('Default')}: 500000 satoshis`,
          }),
          'max-channel': Value.number({
            name: i18n('Max Channel Size'),
            description: i18n(
              'The largest channel CLBOSS opens. CLBOSS raises it to at least twice the minimum channel size.',
            ),
            default: null,
            required: false,
            min: 0,
            max: 10_000_000_000,
            integer: true,
            units: 'satoshis',
            placeholder: null,
            footnote: `${i18n('Default')}: 16777215 satoshis`,
          }),
        }),
      },
    }),
  }),
})

export const plugins = sdk.Action.withInput(
  // id
  'plugins',

  // metadata
  async ({ effects }) => ({
    name: i18n('Plugins'),
    description: i18n(
      'Plugins are subprocesses that provide extra functionality and run alongside the lightningd process inside the main Core Lightning container in order to communicate directly with it. Their source is maintained separately from that of Core Lightning itself.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  // form input specification
  pluginsSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    const form = await clnConfig.read().once()
    const raw = form?.raw
    const plugins = raw?.plugin || []

    return {
      ...form,
      sling: plugins.includes(slingPlugin),
      clboss: plugins.includes(clbossPlugin)
        ? {
            selection: 'enabled' as const,
            value: {
              'min-onchain': raw?.['clboss-min-onchain'],
              'auto-close':
                raw?.['clboss-auto-close'] === undefined
                  ? null
                  : raw['clboss-auto-close'] === 'true',
              zerobasefee: raw?.['clboss-zerobasefee'] ?? 'default',
              'min-channel': raw?.['clboss-min-channel'],
              'max-channel': raw?.['clboss-max-channel'],
            },
          }
        : { selection: 'disabled' as const },
    }
  },

  // the execution function
  async ({ effects, input }) => {
    const { sling, clboss, ...rest } = input
    const form = await clnConfig.read().once()
    const rawPlugins = [...(form?.raw?.plugin || [])].filter(
      (p): p is string => typeof p === 'string',
    )

    // Manage sling plugin path
    if (sling) {
      if (!rawPlugins.includes(slingPlugin)) rawPlugins.push(slingPlugin)
    } else {
      const idx = rawPlugins.indexOf(slingPlugin)
      if (idx !== -1) rawPlugins.splice(idx, 1)
    }

    // Manage clboss plugin path and config keys
    const clbossConfig: Record<string, unknown> = {}
    if (clboss.selection === 'enabled') {
      if (!rawPlugins.includes(clbossPlugin)) rawPlugins.push(clbossPlugin)
      const { value } = clboss
      clbossConfig['clboss-min-onchain'] = value['min-onchain'] || undefined
      clbossConfig['clboss-auto-close'] = value['auto-close']
        ? 'true'
        : undefined
      clbossConfig['clboss-zerobasefee'] =
        value.zerobasefee === 'default' ? undefined : value.zerobasefee
      clbossConfig['clboss-min-channel'] = value['min-channel'] || undefined
      clbossConfig['clboss-max-channel'] = value['max-channel'] || undefined
    } else {
      const idx = rawPlugins.indexOf(clbossPlugin)
      if (idx !== -1) rawPlugins.splice(idx, 1)
      clbossConfig['clboss-min-onchain'] = undefined
      clbossConfig['clboss-auto-close'] = undefined
      clbossConfig['clboss-zerobasefee'] = undefined
      clbossConfig['clboss-min-channel'] = undefined
      clbossConfig['clboss-max-channel'] = undefined
    }

    await clnConfig.merge(effects, {
      ...rest,
      raw: { ...(form?.raw ?? {}), ...clbossConfig, plugin: rawPlugins },
    })
  },
)
