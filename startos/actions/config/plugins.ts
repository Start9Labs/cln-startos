import {
  InputSpec,
  Value,
  Variants,
} from '@start9labs/start-sdk/base/lib/actions/input/builder'
import { sdk } from '../../sdk'
import { clnConfig } from '../../fileModels/config'
import { storeJson } from '../../fileModels/store.json'
import { clnConfDefaults } from '../../utils'

const { 'clnrest-host': clnrestHost, 'clnrest-port': clnrestPort } =
  clnConfDefaults

const slingPlugin = '/usr/local/libexec/c-lightning/plugins/sling'
const clbossPlugin = '/usr/local/libexec/c-lightning/plugins/clboss'

const pluginsSpec = InputSpec.of({
  sling: Value.toggle({
    name: 'Sling',
    default: false,
    description:
      'Automatically rebalance multiple channels. This is a CLI-only tool.  <b>Default: Disabled</b><br><b>Source:  https://github.com/daywalker90/sling</b>',
    warning: null,
  }),
  clnrest: Value.toggle({
    name: 'CLNRest',
    default: true,
    description:
      "Distinct from the C-Lightning-REST plugin, CLNRest is a lightweight Python-based built-in Core Lightning plugin (from v23.08) that transforms RPC calls into a REST service. It also broadcasts Core Lightning notifications to listeners connected to its websocket server. By generating REST API endpoints, it enables the execution of Core Lightning's RPC methods behind the scenes and provides responses in JSON format.  <b>Default: True</b>",
    warning: null,
  }),
  clboss: Value.union({
    name: 'CLBOSS settings',
    description:
      'CLBOSS is an automated manager for Core Lightning forwarding nodes.  <b>Default: Disabled</b><br><b>Source: https://github.com/ZmnSCPxj/clboss</b>',
    warning:
      "CLBOSS automatically manages your CLN node. It is experimental software and will probably not be profitable to run. It will automatically open channels, buy incoming liquidity, rebalance channels, and set forwarding fees. If you don't want this behavior or don't understand what this means, please keep this option disabled. Source: https://github.com/ZmnSCPxj/clboss#operating",
    default: 'disabled',
    variants: Variants.of({
      disabled: { name: 'Disabled', spec: InputSpec.of({}) },
      enabled: {
        name: 'Enabled',
        spec: InputSpec.of({
          'min-onchain': Value.number({
            name: 'Minimum On-Chain',
            description:
              'The minimum amount that CLBOSS will leave in the on-chain wallet. The intent is that this amount will be used in the future, by your node, to manage anchor-commitment channels, or post-Taproot Decker-Russell-Osuntokun channels. These channel types need some small amount of on-chain funds to unilaterally close, so it is not recommended to set it to 0. The amount specified is a ballpark figure, and CLBOSS may leave slightly lower or slightly higher than this amount.  <b>Default: 30000</b>',
            warning: null,
            default: null,
            required: false,
            min: 0,
            max: 10_000_000_000,
            step: null,
            integer: true,
            units: 'satoshis',
            placeholder: null,
          }),
          'auto-close': Value.toggle({
            name: 'Auto Close',
            default: false,
            description:
              'Enable if you want CLBOSS to have the ability to close channels it deems unprofitable.  This can be costly, please understand the ramifications before enabling.  <b>Default: False</b>',
            warning: 'This feature is EXPERIMENTAL AND DANGEROUS!',
          }),
          zerobasefee: Value.select({
            name: 'Zero Base Fee',
            description:
              'Specify how this node will advertise its base fee. <ul><li><b>Required:  </b>The base fee must be always 0.</li><li><b>Allow:  </b>If the heuristics of CLBOSS think it might be a good idea to set base fee to 0, let it be 0, but otherwise set it to whatever value the heuristics want.</li><li><b>Disallow:  </b>The base fee must always be non-zero. If the heuristics think it might be good to set it to 0, set it to 1 instead.</li></ul><b>Default:  default (use fee set by Advanced -> Routing Base Fee)</b><br>Some pathfinding algorithms under development may strongly prefer 0 or low base fees, so you might want to set CLBOSS to 0 base fee, or to allow a 0 base fee.',
            warning: null,
            default: 'default',
            values: {
              default: 'default',
              required: 'required',
              allow: 'allow',
              disallow: 'disallow',
            },
          } as const),
          'min-channel': Value.number({
            name: 'Min Channel Size',
            description:
              'Sets the minimum channel sizes that CLBOSS will make.  <b>Default:  No minimum</b>',
            warning: null,
            default: null,
            required: false,
            min: 0,
            max: 10_000_000_000,
            step: null,
            integer: true,
            units: 'satoshis',
            placeholder: null,
          }),
          'max-channel': Value.number({
            name: 'Max Channel Size',
            description:
              'Sets the maximum channel sizes that CLBOSS will make.  <b>Default:  No maximum</b>',
            warning: null,
            default: null,
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
})

export const plugins = sdk.Action.withInput(
  // id
  'plugins',

  // metadata
  async ({ effects }) => ({
    name: 'Plugins',
    description:
      'Plugins are subprocesses that provide extra functionality and run alongside the lightningd process inside the main Core Lightning container in order to communicate directly with it. Their source is maintained separately from that of Core Lightning itself.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),

  // form input specification
  pluginsSpec,

  // optionally pre-fill the input form
  async ({ effects }) => read(effects),

  // the execution function
  async ({ effects, input }) => write(effects, input),
)

async function read(effects: any): Promise<PartialPluginSpec> {
  const conf = await clnConfig.read().const(effects)
  const store = await storeJson.read().const(effects)
  if (!conf) return {}

  const plugins = [conf.plugin || []].flat()

  return {
    clnrest: !!conf['clnrest-host'] && !!conf['clnrest-port'],
    sling: plugins.includes(slingPlugin),
    clboss: store?.clboss
      ? {
          selection: 'enabled',
          value: {
            'auto-close': store.clboss['auto-close'],
            'max-channel': store.clboss['max-channel'],
            'min-channel': store.clboss['min-channel'],
            'min-onchain': store.clboss['min-onchain'],
            zerobasefee: store.clboss.zerobasefee,
          },
        }
      : {
          selection: 'disabled',
        },
  }
}

async function write(effects: any, input: PluginSpec) {
  const confPlugins = [
    (await clnConfig.read((e) => e.plugin).once()) || [],
  ].flat()

  if (input.sling) {
    if (!confPlugins.includes(slingPlugin)) {
      confPlugins.push(slingPlugin)
    }
  } else {
    const index = confPlugins.findIndex((plugin) => plugin === slingPlugin)

    if (index !== -1) confPlugins.splice(index, 1)
  }

  if (input.clboss.selection === 'enabled') {
    const {
      'auto-close': autoClose,
      'max-channel': maxChannel,
      'min-channel': minChannel,
      'min-onchain': minOnchain,
      zerobasefee,
    } = input.clboss.value
    if (!confPlugins.includes(clbossPlugin)) {
      confPlugins.push(clbossPlugin)
    }
    await storeJson.merge(effects, {
      clboss: {
        'auto-close': autoClose,
        'max-channel': maxChannel || undefined,
        'min-channel': minChannel || undefined,
        'min-onchain': minOnchain || undefined,
        zerobasefee: zerobasefee,
      },
    })
  } else {
    const index = confPlugins.findIndex((plugin) => plugin === clbossPlugin)

    if (index !== -1) confPlugins.splice(index, 1)
    await storeJson.merge(effects, { clboss: undefined })
  }

  const pluginSettings = {
    plugin: confPlugins,
    'clnrest-port': input.clnrest ? clnrestPort : undefined,
    'clnrest-host': input.clnrest ? clnrestHost : undefined,
  }

  await clnConfig.merge(effects, pluginSettings)
}

type PluginSpec = typeof pluginsSpec._TYPE
type PartialPluginSpec = typeof pluginsSpec._PARTIAL
