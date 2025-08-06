import {
  Variants,
  List,
  InputSpec,
  Value,
} from '@start9labs/start-sdk/base/lib/actions/input/builder'
import { sdk } from '../../sdk'
import { storeJson } from '../../fileModels/store.json'
import { clnConfig } from '../../fileModels/config'
import { mkdir, writeFile } from 'fs/promises'
import { rpcPort } from 'bitcoind-startos/startos/utils'
import { clnConfDefaults } from '../../utils'

const watchtowerClientPlugin =
  '/usr/local/libexec/c-lightning/plugins/watchtower-client'

const watchtowerSpec = InputSpec.of({
  'wt-server': Value.toggle({
    name: 'Watchtower Server',
    default: false,
    description:
      'Allow other nodes to connect to your watchtower server on the network.  <b>Default: Disabled</b>',
    warning: null,
  }),
  'wt-client': Value.union({
    name: 'Watchtower Client',
    description:
      'Enable the client and connect to a watchtower server(s) of your choice in order to use watchtower features.  <b>Default: Disabled</b>',
    warning: null,
    default: 'disabled',
    variants: Variants.of({
      disabled: { name: 'Disabled', spec: InputSpec.of({}) },
      enabled: {
        name: 'Enabled',
        spec: InputSpec.of({
          'add-watchtowers': Value.list(
            List.text(
              {
                name: 'Add Watchtower Servers',
                minLength: 1,
                maxLength: null,
                default: [],
                description:
                  "Add URIs of watchtower servers to connect to. If you don't know of anyone with a server, you can find some on this public listing: https://github.com/talaia-labs/rust-teos/discussions/158",
                warning: null,
              },
              {
                masked: false,
                placeholder:
                  '02b4891f562c8b80571ddd2eeea48530471c30766295e1c78556ae4c4422d24436@recnedb7xfhzjdrcgxongzli3a6qyrv5jwgowoho3v5g3rwk7kkglrid.onion:9814',
                patterns: [],
                minLength: null,
                maxLength: null,
              },
            ),
          ),
        }),
      },
    }),
  }),
})

export const watchtower = sdk.Action.withInput(
  // id
  'watchtower',

  // metadata
  async ({ effects }) => ({
    name: 'Watchtower Settings',
    description:
      'Connect to external watchtower servers to protect your node from misbehaving channel peers. You can also run a watchtower server and share your server URI (found in properties) with friends/family to watch over their nodes.  You can learn more about watchtowers at https://docs.corelightning.org/docs/watchtowers.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Watchtower',
    visibility: 'enabled',
  }),

  // form input specification
  watchtowerSpec,

  // optionally pre-fill the input form
  async ({ effects }) => read(effects),

  // the execution function
  async ({ effects, input }) => write(effects, input),
)

async function read(effects: any): Promise<PartialWatchTowerSpec> {
  const watchtowerSettings = (await storeJson.read().const(effects))!

  return {
    'wt-server': watchtowerSettings.watchtowerServer,
    'wt-client':
      watchtowerSettings.watchtowerClients &&
      watchtowerSettings.watchtowerClients.length > 0
        ? {
            selection: 'enabled',
            value: { 'add-watchtowers': watchtowerSettings.watchtowerClients },
          }
        : { selection: 'disabled' },
  }
}

async function write(effects: any, input: WatchtowerSpec) {
  const watchtowerSettings = {
    watchtowerServer: input['wt-server'],
    watchtowerClients:
      input['wt-client'].selection === 'enabled'
        ? input['wt-client'].value['add-watchtowers']
        : [],
  }
  if (watchtowerSettings.watchtowerServer) {
    await mkdir(`/media/startos/volumes/main/.teos`, { recursive: true })
    await writeFile(
      `/media/startos/volumes/main/.teos/teos.toml`,
      `
# API
api_bind = "0.0.0.0"
api_port = 9814
#tor_control_port = 9051
#onion_hidden_service_port = 9814
tor_support = false

# RPC
rpc_bind = "127.0.0.1"
rpc_port = 8814

# bitcoind
btc_network = "mainnet"
btc_rpc_connect = "bitcoind.startos"
btc_rpc_port = ${rpcPort}
btc_rpc_cookie = \"${clnConfDefaults['bitcoin-datadir']}/.cookie\"

# Flags
debug = false
deps_debug = false
overwrite_key = false

# General
subscription_slots = 10000
subscription_duration = 4320
expiry_delta = 6
min_to_self_delay = 20
polling_delta = 60

# Internal API
internal_api_bind = "127.0.0.1"
internal_api_port = 50051
`,
    )
  }

  const plugins = (await clnConfig.read((e) => e.plugin).once()) || []

  if (watchtowerSettings.watchtowerClients.length > 0) {
    if (!plugins.includes(watchtowerClientPlugin)) {
      plugins.push(watchtowerClientPlugin)
      await clnConfig.merge(effects, { plugin: plugins })
    }
  } else {
    const index = plugins.findIndex(
      (plugin) => plugin === watchtowerClientPlugin,
    )

    if (index !== -1) plugins.splice(index, 1)
    await clnConfig.merge(effects, { plugin: plugins })
  }
  await storeJson.merge(effects, watchtowerSettings)
}

type WatchtowerSpec = typeof watchtowerSpec._TYPE
type PartialWatchTowerSpec = typeof watchtowerSpec._PARTIAL
