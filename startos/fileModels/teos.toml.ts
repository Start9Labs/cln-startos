import { matches, FileHelper } from '@start9labs/start-sdk'
import { teosTomlDefaults } from '../utils'

const { object, boolean, natural, literal } = matches

const {
  api_bind,
  api_port,
  tor_support,
  rpc_bind,
  rpc_port,
  btc_network,
  btc_rpc_connect,
  btc_rpc_port,
  btc_rpc_cookie,
  debug,
  deps_debug,
  overwrite_key,
  subscription_slots,
  subscription_duration,
  expiry_delta,
  min_to_self_delay,
  polling_delta,
  internal_api_bind,
  internal_api_port,
} = teosTomlDefaults

const shape = object({
  api_bind: literal(api_bind).onMismatch(api_bind),
  api_port: literal(api_port).onMismatch(api_port),
  tor_support: literal(tor_support).onMismatch(tor_support),

  rpc_bind: literal(rpc_bind).onMismatch(rpc_bind),
  rpc_port: literal(rpc_port).onMismatch(rpc_port),

  btc_network: literal(btc_network).onMismatch(btc_network),
  btc_rpc_connect: literal(btc_rpc_connect).onMismatch(btc_rpc_connect),
  btc_rpc_port: literal(btc_rpc_port).onMismatch(btc_rpc_port),
  btc_rpc_cookie: literal(btc_rpc_cookie).onMismatch(btc_rpc_cookie),

  debug: boolean.onMismatch(debug),
  deps_debug: boolean.onMismatch(deps_debug),
  overwrite_key: boolean.onMismatch(overwrite_key),

  subscription_slots: natural.onMismatch(subscription_slots),
  subscription_duration: natural.onMismatch(subscription_duration),
  expiry_delta: natural.onMismatch(expiry_delta),
  min_to_self_delay: natural.onMismatch(min_to_self_delay),
  polling_delta: natural.onMismatch(polling_delta),

  internal_api_bind: literal(internal_api_bind).onMismatch(internal_api_bind),
  internal_api_port: literal(internal_api_port).onMismatch(internal_api_port),
})

export const teosToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/.teos/teos.toml',
  },
  shape,
)
