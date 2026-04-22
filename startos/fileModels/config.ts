import { FileHelper, T, z } from '@start9labs/start-sdk'
import * as INI from 'ini'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  bitcoinDataDir,
  clnrestPort,
  grpcPort,
  peerPort,
  websocketPort,
  wsPort,
} from '../utils'

// INI coercion helpers: INI parsing returns strings, with duplicate keys producing arrays.
// Each uses .catch(undefined) to match the old optional(t) = t.optional().onMismatch(undefined)

const iniString = z
  .union([z.array(z.string()).transform((a) => a.at(-1)!), z.string()])
  .optional()
  .catch(undefined)

const iniStringArray = z
  .union([z.array(z.string()), z.string().transform((s) => [s])])
  .optional()
  .catch(undefined)

const iniNumber = z
  .union([
    z.array(z.string()).transform((a) => Number(a.at(-1))),
    z.string().transform(Number),
    z.number(),
  ])
  .optional()
  .catch(undefined)

// for bare keys: i.e. experimental-dual-fund
const iniBoolean = z
  .union([
    z.string().transform((s) => s === 'true' || s === '1'),
    z.number().transform((n) => !!n),
    z.boolean(),
  ])
  .optional()
  .catch(undefined)

// for keys with boolean values (=true/false)
const iniStringBoolean = z
  .union([
    z.string().transform((s) => s === 'true' || s === '1'),
    z.number().transform((n) => !!n),
    z.boolean(),
  ])
  .transform((x) => `${x}` as 'true' | 'false')
  .optional()
  .catch(undefined)

const iniEnum = <const T extends [string, ...string[]]>(values: T) =>
  z
    .union([z.array(z.string()).transform((a) => a.at(-1)!), z.string()])
    .pipe(z.enum(values))
    .optional()
    .catch(undefined)

export const funderPolicies = ['match', 'available', 'fixed'] as const
export const clbossZerobasefees = [
  'default',
  'required',
  'allow',
  'disallow',
] as const

export const shape = z.object({
  // Enforced by StartOS
  network: z.literal('bitcoin').catch('bitcoin'),
  'bitcoin-rpcconnect': z.literal('bitcoind.startos').catch('bitcoind.startos'),
  'bitcoin-rpcport': z.literal(8332).catch(8332),
  'bitcoin-datadir': z.literal(bitcoinDataDir).catch(bitcoinDataDir),
  'bind-addr': z
    .union([z.array(z.string()), z.string().transform((s) => [s])])
    .catch([`0.0.0.0:${peerPort}`, `ws::${wsPort}`]),
  'bitcoin-rpcuser': z.undefined().catch(undefined),
  'bitcoin-rpcpassword': z.undefined().catch(undefined),
  'grpc-port': z.literal(grpcPort).catch(grpcPort),

  // Dynamic (set at runtime)
  'announce-addr': iniStringArray,
  proxy: iniString,

  // User-configurable
  'always-use-proxy': iniStringBoolean,
  alias: iniString,
  rgb: iniString,
  'clnrest-host': iniString,
  'clnrest-port': iniNumber,
  'fee-base': iniNumber,
  'fee-per-satoshi': iniNumber,
  'min-capacity-sat': iniNumber,
  'funding-confirms': iniNumber,
  'xpay-handle-pay': iniStringBoolean,
  plugin: iniStringArray,
  'funder-lease-requests-only': iniStringBoolean,
  'funder-policy': iniEnum([...funderPolicies]),
  'lease-fee-base-sat': iniNumber,
  'lease-fee-basis': iniNumber,
  'lease-funding-weight': iniNumber,
  'channel-fee-max-base-msat': iniNumber,
  'channel-fee-max-proportional-thousandths': iniNumber,
  'funder-fuzz-percent': iniNumber,
  'funder-fund-probability': iniNumber,
  'funder-policy-mod': iniNumber,
  'funder-min-their-funding': iniNumber,
  'funder-max-their-funding': iniNumber,
  'funder-per-channel-min': iniNumber,
  'funder-per-channel-max': iniNumber,
  'funder-reserve-tank': iniNumber,

  // Experimental
  'experimental-dual-fund': iniBoolean,
  'experimental-splicing': iniBoolean,
  'experimental-shutdown-wrong-funding': iniBoolean,

  // CLBOSS (plugin options, read from config when plugin is loaded at startup)
  'clboss-min-onchain': iniNumber,
  'clboss-auto-close': iniBoolean,
  'clboss-zerobasefee': iniEnum([...clbossZerobasefees]),
  'clboss-min-channel': iniNumber,
  'clboss-max-channel': iniNumber,
})

const { InputSpec, Value } = sdk

export const fullConfigSpec = InputSpec.of({
  raw: Value.hidden(shape),

  // Node identity
  alias: Value.text({
    name: i18n('Alias'),
    default: null,
    required: false,
    description: i18n(
      'A custom, human-readable name for your node.  This is publicly visible to the Lightning Network.  <b>Default: Unique id of pattern: start9-[random alphanumerics]</b>',
    ),
    patterns: [
      {
        regex: '.{1,32}',
        description: i18n(
          'Must be at least 1 character and no more than 32 characters',
        ),
      },
    ],
    footnote: `${i18n('Default')}: start9-[random alphanumerics]`,
  }),
  color: Value.text({
    name: i18n('Color'),
    default: {
      charset: 'a-f,0-9',
      len: 6,
    },
    required: true,
    description: i18n(
      'The public color of your node on the Lightning Network in hexadecimal.  <b>Default: Random color</b>',
    ),
    patterns: [
      {
        regex: '[0-9a-fA-F]{6}',
        description: i18n(
          'Must be a valid 6 digit hexadecimal RGB value. The first two digits are red, the middle two are green, and the final two are blue.',
        ),
      },
    ],
    footnote: `${i18n('Default')}: randomly generated`,
  }),

  // Network
  'tor-only': Value.triState({
    name: i18n('Tor Only'),
    default: null,
    description: i18n(
      'Only use tor connections.  This increases privacy, at the cost of some performance and reliability.  <b>Default: False</b>',
    ),
    footnote: `${i18n('Default')}: false`,
  }),
  'clams-remote-websocket': Value.toggle({
    name: i18n('Clams Remote'),
    default: false,
    description: i18n(
      'Accept incoming connections on port 7272, allowing Clams Remote to connect to Core Lightning.',
    ),
  }),

  // Channels
  'fee-base': Value.number({
    name: i18n('Routing Base Fee'),
    description: i18n(
      'The base fee in millisatoshis you will charge for forwarding payments on your channels.  <b>Default: 1000</b>',
    ),
    default: null,
    required: false,
    min: 0,
    integer: true,
    units: 'millisatoshis',
    footnote: `${i18n('Default')}: 1000 millisatoshis`,
  }),
  'fee-rate': Value.number({
    name: i18n('Routing Fee Rate'),
    description: i18n(
      'The fee rate used when forwarding payments on your channels. The total fee charged is the Base Fee + (amount * Fee Rate / 1,000,000), where the amount is the forwarded amount.  Measured in sats per million.  <b>Default: 10</b>',
    ),
    default: null,
    required: false,
    min: 1,
    max: 1_000_000,
    integer: true,
    units: 'sats per million',
    footnote: `${i18n('Default')}: 10 sats per million`,
  }),
  'min-capacity': Value.number({
    name: i18n('Minimum Channel Capacity'),
    description: i18n(
      "This value defines the minimal effective channel capacity in satoshis to accept for channel opening requests.  This will reject any opening of a channel which can't pass an HTLC of at least this value. Usually this prevents a peer opening a tiny channel, but it can also prevent a channel you open with a reasonable amount and the peer is requesting such a large reserve that the capacity of the channel falls below this.  <b>Default: 10,000</b>",
    ),
    default: null,
    required: false,
    min: 1,
    max: 16_777_215,
    integer: true,
    units: 'satoshis',
    footnote: `${i18n('Default')}: 10000 satoshis`,
  }),
  'funding-confirms': Value.number({
    name: i18n('Required Funding Confirmations'),
    description: i18n(
      'Confirmations required for the funding transaction when the other side opens a channel before the channel is usable.  <b>Default: 3</b>',
    ),
    default: null,
    required: false,
    min: 1,
    max: 6,
    integer: true,
    units: 'blocks',
    footnote: `${i18n('Default')}: 3 blocks`,
  }),

  // Payments
  'xpay-handle-pay': Value.triState({
    name: i18n('Xpay'),
    default: null,
    description: i18n(
      'Setting this makes xpay intercept simply pay commands (default false). Note that the response will be different from the normal pay command, however.  <b>Default: Disabled</b>',
    ),
    footnote: `${i18n('Default')}: false`,
  }),

  // Plugins
  clnrest: Value.toggle({
    name: i18n('CLNrest'),
    default: true,
    description: i18n(
      "Distinct from the C-Lightning-REST plugin, CLNRest is a lightweight Python-based built-in Core Lightning plugin (from v23.08) that transforms RPC calls into a REST service. It also broadcasts Core Lightning notifications to listeners connected to its websocket server. By generating REST API endpoints, it enables the execution of Core Lightning's RPC methods behind the scenes and provides responses in JSON format.  <b>Default: True</b>",
    ),
  }),
})

// CLN uses bare flags for boolean options (e.g. `experimental-dual-fund` not
// `experimental-dual-fund=true`). The `ini` package always writes `key=value`,
// so we use a custom serializer that extracts boolean true values as bare flags.
function clnIniStringify(data: Record<string, unknown>): string {
  const bareFlags: string[] = []
  const iniData: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(data)) {
    if (val === undefined || val === false) continue
    if (val === true) {
      bareFlags.push(key)
    } else if (Array.isArray(val)) {
      const filtered = val.filter((v) => v !== undefined)
      if (filtered.length > 0) iniData[key] = filtered
    } else {
      iniData[key] = val
    }
  }

  let result = INI.stringify(iniData, { bracketedArray: false })

  for (const flag of bareFlags) {
    result += `${flag}\n`
  }

  return result
}

export function fileToForm(
  input: z.infer<typeof shape>,
): T.DeepPartial<typeof fullConfigSpec._TYPE> {
  const {
    alias,
    rgb,
    'always-use-proxy': alwaysUseProxy,
    'bind-addr': bindAddr,
    'fee-base': feeBase,
    'fee-per-satoshi': feePerSatoshi,
    'min-capacity-sat': minCapacitySat,
    'funding-confirms': fundingConfirms,
    'xpay-handle-pay': xpayHandlePay,
    'clnrest-host': clnrestHost,
    'clnrest-port': clnrestPort,
  } = input

  return {
    raw: input ?? {},
    alias,
    color: rgb,
    'tor-only':
      alwaysUseProxy === undefined ? null : alwaysUseProxy === 'true',
    'clams-remote-websocket': bindAddr?.includes(`ws::${websocketPort}`),
    'fee-base': feeBase,
    'fee-rate': feePerSatoshi,
    'min-capacity': minCapacitySat,
    'funding-confirms': fundingConfirms,
    'xpay-handle-pay':
      xpayHandlePay === undefined ? null : xpayHandlePay === 'true',
    clnrest: !!clnrestHost && !!clnrestPort,
  }
}

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): z.infer<typeof shape> {
  const {
    raw,
    alias,
    color,
    'tor-only': torOnly,
    'clams-remote-websocket': clamsRemote,
    'fee-base': feeBase,
    'fee-rate': feeRate,
    'min-capacity': minCapacity,
    'funding-confirms': fundingConfirms,
    'xpay-handle-pay': xpayHandlePay,
    clnrest,
  } = input

  // Preserve plugin array from raw (managed externally by plugin actions)
  const plugins = (raw?.plugin || []).filter(
    (p): p is string => typeof p === 'string',
  )

  return {
    ...raw,

    // Clean up DeepPartial array types from raw spread
    'announce-addr': raw?.['announce-addr']?.filter((a): a is string => !!a),

    // Enforced
    network: 'bitcoin' as const,
    'bitcoin-rpcconnect': 'bitcoind.startos' as const,
    'bitcoin-rpcport': 8332 as const,
    'bitcoin-datadir': bitcoinDataDir,
    'bitcoin-rpcuser': undefined,
    'bitcoin-rpcpassword': undefined,
    'grpc-port': grpcPort,

    // Node identity
    alias: alias || undefined,
    rgb: color,

    // Network
    'always-use-proxy':
      torOnly == null ? undefined : torOnly ? 'true' : 'false',
    'bind-addr': [
      `0.0.0.0:${peerPort}`,
      `ws::${wsPort}`,
      ...(clamsRemote ? [`ws::${websocketPort}`] : []),
    ],

    // Channels
    'fee-base': feeBase ?? undefined,
    'fee-per-satoshi': feeRate ?? undefined,
    'min-capacity-sat': minCapacity ?? undefined,
    'funding-confirms': fundingConfirms ?? undefined,

    // Payments
    'xpay-handle-pay':
      xpayHandlePay == null ? undefined : xpayHandlePay ? 'true' : 'false',

    // Plugins
    plugin: plugins.length > 0 ? plugins : undefined,
    'clnrest-host': clnrest ? '0.0.0.0' : undefined,
    'clnrest-port': clnrest ? clnrestPort : undefined,
  }
}

type FormData = T.DeepPartial<typeof fullConfigSpec._TYPE>

export const clnConfig = FileHelper.raw<FormData>(
  { base: sdk.volumes.main, subpath: '/config' },
  (formData) =>
    clnIniStringify(formToFile(formData) as Record<string, unknown>),
  (iniString) => {
    const base = shape.parse(INI.parse(iniString, { bracketedArray: false }))
    return fileToForm(base)
  },
  (data) => fullConfigSpec.partialValidator.parse(data),
)
