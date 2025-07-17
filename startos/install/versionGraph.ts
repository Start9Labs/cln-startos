import { VersionGraph } from '@start9labs/start-sdk'
import { current, other } from './versions'
import { clnConfig } from '../fileModels/config'
import { clnConfDefaults } from '../utils'
import { access } from 'fs/promises'
import { storeJson } from '../fileModels/store.json'

export const versionGraph = VersionGraph.of({
  current,
  other,
  preInstall: async (effects) => {
    try {
      await access('/media/startos/volumes/main/lnd.conf')
      console.log('Found existing config file')
    } catch {
      console.log('No existing config file found. Using defaults')
      await clnConfig.write(effects, clnConfDefaults)
    }
    try {
      await access('/media/startos/volumes/main/store.json')
      console.log('Found existing store.json')
    } catch {
      console.log('No existing store.json file found. Using defaults')
      await storeJson.write(effects, {
        rescan: undefined,
        'experimental-dual-fund': false,
        'experimental-shutdown-wrong-funding': false,
        'experimental-splicing': false,
        watchtowerServer: false,
        watchtowerClients: [],
        clboss: undefined,
      })
    }
  },
})
