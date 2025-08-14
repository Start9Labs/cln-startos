import { sdk } from './sdk'

export const uiPort = 4500
export const rpcPort = 8080
export const peerPort = 9735
export const clnrestPort = 3010
export const watchtowerPort = 9814
export const websocketPort = 7272
export const grpcPort = 2106
export const rootDir = '/root/.lightning'
export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: rootDir,
  readonly: false,
})

export const clnConfDefaults = {
  network: 'bitcoin',
  'bitcoin-rpcconnect': 'bitcoind.startos',
  'bitcoin-rpcport': 8332,
  'bitcoin-datadir': '/mnt/bitcoin',

  'bind-addr': ['0.0.0.0:9735', 'ws::4269'],
  'announce-addr': undefined,
  proxy: undefined,
  'clnrest-port': 3010,
  'clnrest-host': '0.0.0.0',
  'grpc-port': 2106,

  // autoclean
  'autoclean-cycle': 3_600,
  'autoclean-succeededforwards-age': 0,
  'autoclean-failedforwards-age': 0,
  'autoclean-succeededpays-age': 0,
  'autoclean-failedpays-age': 0,
  'autoclean-paidinvoices-age': 0,
  'autoclean-expiredinvoices-age': 0,

  // other config
  alias: undefined,
  rgb: undefined,
  'always-use-proxy': false,
  'fee-base': 1_000,
  'fee-per-satoshi': 10,
  'min-capacity-sat': 10_000,
  'ignore-fee-limits': false,
  'funding-confirms': 3,
  'cltv-delta': 40,
  'htlc-minimum-msat': 0,
  'htlc-maximum-msat': undefined,
  'xpay-handle-pay': false,
  plugin: [] as string[],

  // Dual Funding
  'funder-lease-requests-only': undefined,
  'funder-policy': undefined,
  'lease-fee-base-sat': undefined,
  'lease-fee-basis': undefined,
  'lease-funding-weight': undefined,
  'channel-fee-max-base-msat': undefined,
  'channel-fee-max-proportional-thousandths': undefined,
  'funder-fuzz-percent': undefined,
  'funder-fund-probability': undefined,
  'funder-policy-mod': undefined,
  'funder-min-their-funding': undefined,
  'funder-max-their-funding': undefined,
  'funder-per-channel-min': undefined,
  'funder-per-channel-max': undefined,
  'funder-reserve-tank': undefined,
}

export type GetInfoResponse = {
  id: string
}

export const teosTomlDefaults = {
  api_bind: '0.0.0.0',
  api_port: 9814,
  tor_support: false,

  rpc_bind: '127.0.0.1',
  rpc_port: 8814,

  btc_network: 'mainnet',
  btc_rpc_connect: 'bitcoind.startos',
  btc_rpc_port: 8332,
  btc_rpc_cookie: `${clnConfDefaults['bitcoin-datadir']}/.cookie`,

  debug: false,
  deps_debug: false,
  overwrite_key: false,

  subscription_slots: 10_000,
  subscription_duration: 4_320,
  expiry_delta: 6,
  min_to_self_delay: 20,
  polling_delta: 60,

  internal_api_bind: '127.0.0.1',
  internal_api_port: 50051,
}
