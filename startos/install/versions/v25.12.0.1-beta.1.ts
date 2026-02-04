import { VersionInfo, IMPOSSIBLE, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { storeJson } from '../../fileModels/store.json'
import { clnConfig } from '../../fileModels/config'
import { clnConfDefaults, teosTomlDefaults } from '../../utils'
import { teosToml } from '../../fileModels/teos.toml'
import { i18n } from '../../i18n'

export const v25_12_0_1 = VersionInfo.of({
  version: '25.12:1-beta.1',
  releaseNotes: {
    en_US: 'Revamped for StartOS 0.4.0',
    es_ES: 'Renovado para StartOS 0.4.0',
    de_DE: 'Überarbeitet für StartOS 0.4.0',
    pl_PL: 'Przeprojektowany dla StartOS 0.4.0',
    fr_FR: 'Refait pour StartOS 0.4.0',
  },
  migrations: {
    up: async ({ effects }) => {
      const config = await clnConfig.read().once()
      const store = await storeJson.read().once()

      // get old config.yaml
      const configYaml:
        | {
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
        | undefined = await readFile(
        '/media/startos/volumes/main/start9/config.yaml',
        'utf-8',
      ).then(YAML.parse, () => undefined)

      if (!store && configYaml) {
        if (configYaml.watchtowers['wt-server']) {
          await teosToml.write(effects, teosTomlDefaults)
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
      }

      if (!config) {
        console.log(i18n('No existing config found. Writing defaults'))
        await clnConfig.write(effects, clnConfDefaults)
      }

      // remove old start9 dir
      await rm('/media/startos/volumes/main/start9', { recursive: true }).catch(
        console.error,
      )
    },
    down: IMPOSSIBLE,
  },
})
