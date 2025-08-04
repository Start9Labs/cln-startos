import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { readFile } from 'fs/promises'
import { load } from 'js-yaml'
import { storeJson } from '../../fileModels/store.json'
import { clnConfig } from '../../fileModels/config'
import { clnConfDefaults } from '../../utils'

export const v25_5_0_1 = VersionInfo.of({
  version: '25.5.0:1-alpha.0',
  releaseNotes: 'Revamped for StartOS 0.4.0',
  migrations: {
    up: async ({ effects }) => {
      try {
        const configYaml = load(
          await readFile(
            '/media/startos/volumes/main/start9/config.yaml',
            'utf8',
          ),
        ) as {
          watchtowers: {
            'wt-server': boolean
            'wt-client':
              | { enabled: 'disabled' }
              | { enabled: 'enabled'; 'add-watchtowers': string[] }
          }
          advanced: {
            experimental: {
              'dual-fund': {
                enabled: 'disabled' | 'enabled'
              }
              'shutdown-wrong-funding': boolean
              splicing: boolean
            }
            plugins: {
              clboss:
                | {
                    enabled: 'disabled'
                  }
                | {
                    enabled: 'enabled'
                    'min-onchain': number | null
                    'auto-close': boolean
                    zerobasefee: 'default' | 'required' | 'allow' | 'disallow'
                    'min-channel': number | null
                    'max-channel': number | null
                  }
            }
          }
        }

        await storeJson.write(effects, {
          rescan: undefined,
          'experimental-dual-fund':
            configYaml.advanced.experimental['dual-fund'].enabled === 'enabled',
          'experimental-shutdown-wrong-funding':
            configYaml.advanced.experimental['shutdown-wrong-funding'],
          'experimental-splicing': configYaml.advanced.experimental.splicing,
          watchtowerServer: configYaml.watchtowers['wt-server'],
          watchtowerClients:
            configYaml.watchtowers['wt-client'].enabled === 'enabled'
              ? configYaml.watchtowers['wt-client']['add-watchtowers']
              : [],
          clboss:
            configYaml.advanced.plugins.clboss.enabled === 'enabled'
              ? {
                  'min-onchain':
                    configYaml.advanced.plugins.clboss['min-onchain'] ||
                    undefined,
                  'auto-close':
                    configYaml.advanced.plugins.clboss['auto-close'],
                  zerobasefee: configYaml.advanced.plugins.clboss.zerobasefee,
                  'min-channel':
                    configYaml.advanced.plugins.clboss['min-channel'] ||
                    undefined,
                  'max-channel':
                    configYaml.advanced.plugins.clboss['max-channel'] ||
                    undefined,
                }
              : undefined,
        })
      } catch {
        console.log('configYaml not found using store.json defaults')
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

      const config = await clnConfig.read().once()
      if (!config) {
        console.log('No existing config found. Writing defaults')
        await clnConfig.write(effects, clnConfDefaults)
      }
    },
    down: IMPOSSIBLE,
  },
})
