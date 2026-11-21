import { clnConfig } from '../fileModels/config'
import { configJson } from '../fileModels/config.json'
import { storeJson } from '../fileModels/store.json'
import { teosToml } from '../fileModels/teos.toml'
import { sdk } from '../sdk'
import { bitcoindRpcBridge } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  await storeJson.merge(effects, {})
  await configJson.merge(effects, {})

  if (kind === 'install') {
    await clnConfig.merge(effects, { clnrest: true })
  } else {
    await clnConfig.merge(effects, {})
  }

  // teos (watchtower) reaches bitcoind over the bridge too; absent until
  // bitcoind's binding resolves, so teosd fails to connect naturally rather
  // than dialing a placeholder.
  const bitcoind = await bitcoindRpcBridge(effects)
  await teosToml.merge(effects, {
    btc_rpc_connect: bitcoind?.host,
    btc_rpc_port: bitcoind?.port,
  })
})
