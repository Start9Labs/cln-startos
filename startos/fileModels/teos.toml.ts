import { FileHelper, z } from '@start9labs/start-sdk'
import { bitcoinDataDir } from '../utils'
import { sdk } from '../sdk'

const shape = z.object({
  api_bind: z.literal('0.0.0.0').catch('0.0.0.0'),
  api_port: z.literal(9814).catch(9814),
  tor_support: z.literal(false).catch(false),

  rpc_bind: z.literal('127.0.0.1').catch('127.0.0.1'),
  rpc_port: z.literal(8814).catch(8814),

  btc_network: z.literal('mainnet').catch('mainnet'),
  btc_rpc_connect: z.literal('bitcoind.startos').catch('bitcoind.startos'),
  btc_rpc_port: z.literal(8332).catch(8332),
  btc_rpc_cookie: z
    .literal(`${bitcoinDataDir}/.cookie`)
    .catch(`${bitcoinDataDir}/.cookie`),

  debug: z.literal(false).catch(false),
  deps_debug: z.literal(false).catch(false),
  overwrite_key: z.literal(false).catch(false),

  subscription_slots: z.literal(10_000).catch(10_000),
  subscription_duration: z.literal(4_320).catch(4_320),
  expiry_delta: z.literal(6).catch(6),
  min_to_self_delay: z.literal(20).catch(20),
  polling_delta: z.literal(60).catch(60),

  internal_api_bind: z.literal('127.0.0.1').catch('127.0.0.1'),
  internal_api_port: z.literal(50051).catch(50051),
})

export const teosToml = FileHelper.toml(
  { base: sdk.volumes.main, subpath: '/.teos/teos.toml' },
  shape,
)
