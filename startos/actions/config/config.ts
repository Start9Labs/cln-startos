import { sdk } from '../../sdk'
const { InputSpec, Value } = sdk
import { T } from '@start9labs/start-sdk'
import { clnConfDefaults } from '../../utils'
import { clnConfig } from '../../fileModels/config'

const {
  alias,
  rgb,
  'always-use-proxy': alwaysUseProxy,
  'fee-base': feeBase,
  'fee-per-satoshi': feePerSatoshi,
  'min-capacity-sat': minCapacitySat,
  'ignore-fee-limits': ignoreFeeLimits,
  'funding-confirms': fundingConfirms,
  'cltv-delta': cltvDelta,
  'htlc-minimum-msat': htlcMinimumMsat,
  'htlc-maximum-msat': htlcMaximumMsat,
} = clnConfDefaults

export const inputSpec = InputSpec.of({
  alias: Value.text({
    name: 'Alias',
    default: null,
    required: false,
    description:
      'A custom, human-readable name for your node.  This is publicly visible to the Lightning Network.  <b>Default: Unique id of pattern: start9-[random alphanumerics]</b>',
    warning: null,
    masked: false,
    placeholder: null,
    inputmode: 'text',
    patterns: [
      {
        regex: '.{1,32}',
        description:
          'Must be at least 1 character and no more than 32 characters',
      },
    ],
    minLength: null,
    maxLength: null,
  }),
  color: Value.text({
    name: 'Color',
    default: {
      charset: 'a-f,0-9',
      len: 6,
    },
    required: true,
    description:
      'The public color of your node on the Lightning Network in hexadecimal.  <b>Default: Random color</b>',
    warning: null,
    masked: false,
    placeholder: null,
    inputmode: 'text',
    patterns: [
      {
        regex: '[0-9a-fA-F]{6}',
        description:
          'Must be a valid 6 digit hexadecimal RGB value. The first two digits are red, the middle two are green, and the final two are blue.',
      },
    ],
    minLength: null,
    maxLength: null,
  }),
  'tor-only': Value.toggle({
    name: 'Tor Only',
    default: false,
    description:
      'Only use tor connections.  This increases privacy, at the cost of some performance and reliability.  <b>Default: False</b>',
    warning: null,
  }),
  'clams-remote-websocket': Value.toggle({
    name: 'Clams Remote',
    default: false,
    description:
      'Accept incoming connections on port 7272, allowing Clams Remote to connect to Core Lightning.',
    warning: null,
  }),
  // 'ui-password': Value.text({
  //   name: 'UI Password',
  //   default: {
  //     charset: 'a-z,A-Z,0-9',
  //     len: 22,
  //   },
  //   required: true,
  //   description:
  //     'The password for your CLN UI (User Interface).  <b>Default: Randomly generated password</b>',
  //   warning: null,
  //   masked: true,
  //   placeholder: null,
  //   inputmode: 'text',
  //   patterns: [],
  //   minLength: null,
  //   maxLength: null,
  // }),

  advanced: Value.object(
    {
      name: 'Advanced',
      description: 'Advanced Options',
    },
    InputSpec.of({
      'fee-base': Value.number({
        name: 'Routing Base Fee',
        description:
          'The base fee in millisatoshis you will charge for forwarding payments on your channels.  <b>Default: 1000</b>',
        warning: null,
        default: 1000,
        required: true,
        min: 0,
        max: null,
        step: null,
        integer: true,
        units: 'millisatoshis',
        placeholder: null,
      }),
      'fee-rate': Value.number({
        name: 'Routing Fee Rate',
        description:
          'The fee rate used when forwarding payments on your channels. The total fee charged is the Base Fee + (amount * Fee Rate / 1,000,000), where the amount is the forwarded amount.  Measured in sats per million.  <b>Default: 1</b>',
        warning: null,
        default: 1,
        required: true,
        min: 1,
        max: 1_000_000,
        step: null,
        integer: true,
        units: 'sats per million',
        placeholder: null,
      }),
      'min-capacity': Value.number({
        name: 'Minimum Channel Capacity',
        description:
          "This value defines the minimal effective channel capacity in satoshis to accept for channel opening requests.  This will reject any opening of a channel which can't pass an HTLC of at least this value. Usually this prevents a peer opening a tiny channel, but it can also prevent a channel you open with a reasonable amount and the peer is requesting such a large reserve that the capacity of the channel falls below this.  <b>Default: 10,000</b>",
        warning: null,
        default: 10000,
        required: true,
        min: 1,
        max: 16_777_215,
        step: null,
        integer: true,
        units: 'satoshis',
        placeholder: null,
      }),
      'ignore-fee-limits': Value.toggle({
        name: 'Ignore Fee Limits',
        default: false,
        description:
          'Allow nodes which establish channels to you to set any fee they want. This may result in a channel which cannot be closed, should fees increase, but make channels far more reliable since Core Lightning will never close it due to unreasonable fees.  <b>Default: False</b>',
        warning: null,
      }),
      'funding-confirms': Value.number({
        name: 'Required Funding Confirmations',
        description:
          'Confirmations required for the funding transaction when the other side opens a channel before the channel is usable.  <b>Default: 3</b>',
        warning: null,
        default: 3,
        required: true,
        min: 1,
        max: 6,
        step: null,
        integer: true,
        units: 'blocks',
        placeholder: null,
      }),
      'cltv-delta': Value.number({
        name: 'Time Lock Delta',
        description:
          'The number of blocks between the incoming payments and outgoing payments: this needs to be enough to make sure that if it has to, Core Lightning can close the outgoing payment before the incoming, or redeem the incoming once the outgoing is redeemed.  <b>Default: 40</b>',
        warning: null,
        default: 40,
        required: true,
        min: 6,
        max: 144,
        step: null,
        integer: true,
        units: 'blocks',
        placeholder: null,
      }),
      'htlc-minimum-msat': Value.number({
        name: 'HTLC Minimum Size (Msat)',
        description:
          'Sets the minimal allowed HTLC value for newly created channels. If you want to change the htlc_minimum_msat for existing channels, use the RPC call lightning-setchannel.  <b>Default: unset (no minimum)</b>',
        warning: null,
        default: null,
        required: false,
        min: 0,
        max: null,
        step: null,
        integer: true,
        units: 'millisatoshis',
        placeholder: null,
      }),
      'htlc-maximum-msat': Value.number({
        name: 'HTLC Maximum Size (Msat)',
        description:
          'Sets the maximum allowed HTLC value for newly created channels. If you want to change the htlc_maximum_msat for existing channels, use the RPC call lightning-setchannel.  <b>Default: unset (no limit)</b>',
        warning: null,
        default: null,
        required: false,
        min: 0,
        max: null,
        step: null,
        integer: true,
        units: 'millisatoshis',
        placeholder: null,
      }),
    }),
  ),
})

export const config = sdk.Action.withInput(
  // id
  'config',

  // metadata
  async ({ effects }) => ({
    name: 'Other Config Options',
    description: 'Set other configuration options for CLN',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => read(effects),

  // the execution function
  async ({ effects, input }) => write(effects, input),
)

async function read(effects: any): Promise<PartialInputSpec> {
  const conf = await clnConfig.read().const(effects)
  if (!conf) return {}

  return {
    alias: conf.alias,
    color: conf.rgb,
    'tor-only': conf['always-use-proxy'],
    'clams-remote-websocket': conf['bind-addr'].includes('ws::7272'),
    advanced: {
      'cltv-delta': conf['cltv-delta'],
      'fee-base': conf['fee-base'],
      'fee-rate': conf['fee-per-satoshi'],
      'funding-confirms': conf['funding-confirms'],
      'htlc-maximum-msat': conf['htlc-maximum-msat'],
      'htlc-minimum-msat': conf['htlc-maximum-msat'],
      'ignore-fee-limits': conf['ignore-fee-limits'],
      'min-capacity': conf['min-capacity-sat'],
    },
  }
}

async function write(effects: any, input: InputSpec) {
  const configSettings = {
    alias: input.alias || alias,
    rgb: input.color,
    'fee-base': input.advanced['cltv-delta'],
    'fee-per-satoshi': input.advanced['fee-rate'],
    'min-capacity-sat': input.advanced['min-capacity'],
    'ignore-fee-limits': input.advanced['ignore-fee-limits'],
    'funding-confirms': input.advanced['funding-confirms'],
    'cltv-delta': input.advanced['cltv-delta'],
    'htlc-minimum-msat': input.advanced['htlc-minimum-msat'] || htlcMinimumMsat,
    'htlc-maximum-msat': input.advanced['htlc-maximum-msat'] || htlcMaximumMsat,
  }

  await clnConfig.merge(effects, configSettings)
}

type InputSpec = typeof inputSpec._TYPE
type PartialInputSpec = typeof inputSpec._PARTIAL
