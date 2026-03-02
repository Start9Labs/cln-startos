import { clnConfig } from '../fileModels/config'
import { configJson } from '../fileModels/config.json'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  await clnConfig.write(effects, { clnrest: true })

  await storeJson.write(effects, {
    watchtowerServer: false,
    watchtowerClients: [],
  })

  await configJson.write(effects, {
    unit: 'SATS',
    fiatUnit: 'USD',
    appMode: 'DARK',
    isLoading: false,
    error: null,
    singleSignOn: false,
    password: '',
  })
})
