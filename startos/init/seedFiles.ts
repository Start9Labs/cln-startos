import { clnConfig } from '../fileModels/config'
import { configJson } from '../fileModels/config.json'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  await storeJson.merge(effects, {})
  await configJson.merge(effects, {})

  if (kind === 'install') {
    await clnConfig.merge(effects, { clnrest: true })
  } else {
    await clnConfig.merge(effects, {})
  }
})
