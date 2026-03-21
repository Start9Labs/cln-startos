import { VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { clnConfig } from '../../fileModels/config'
import { storeJson } from '../../fileModels/store.json'
import { teosToml } from '../../fileModels/teos.toml'
import { i18n } from '../../i18n'

export const v_25_12_1_4_b3 = VersionInfo.of({
  version: '25.12.1:4-beta.3',
  releaseNotes: {
    en_US: 'Update to StartOS SDK beta.60',
    es_ES: 'Actualización a StartOS SDK beta.60',
    de_DE: 'Update auf StartOS SDK beta.60',
    pl_PL: 'Aktualizacja do StartOS SDK beta.60',
    fr_FR: 'Mise à jour vers StartOS SDK beta.60',
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
        const watchtowers = configYaml.watchtowers
        const wtServer = watchtowers?.['wt-server'] ?? false
        const wtClient = watchtowers?.['wt-client']
        const experimental = configYaml.advanced?.experimental
        const clboss = configYaml.advanced?.plugins?.clboss

        if (wtServer) {
          await teosToml.merge(effects, {})
        }

        await storeJson.write(effects, {
          watchtowerServer: wtServer,
          watchtowerClients:
            wtClient?.enabled === 'enabled' ? wtClient['add-watchtowers'] : [],
        })

        // Migrate experimental flags and clboss settings into CLN config
        const configRaw: Record<string, unknown> = {}
        if (experimental?.['dual-fund']?.enabled === 'enabled') {
          configRaw['experimental-dual-fund'] = true
        }
        if (experimental?.['shutdown-wrong-funding']) {
          configRaw['experimental-shutdown-wrong-funding'] = true
        }
        if (experimental?.splicing) {
          configRaw['experimental-splicing'] = true
        }
        if (clboss?.enabled === 'enabled') {
          configRaw['clboss-min-onchain'] = clboss['min-onchain'] || undefined
          configRaw['clboss-auto-close'] = clboss['auto-close'] || undefined
          configRaw['clboss-zerobasefee'] =
            clboss.zerobasefee === 'default' ? undefined : clboss.zerobasefee
          configRaw['clboss-min-channel'] = clboss['min-channel'] || undefined
          configRaw['clboss-max-channel'] = clboss['max-channel'] || undefined
        }

        if (!config) {
          console.log(i18n('No existing config found. Writing defaults'))
          await clnConfig.write(effects, {
            clnrest: true,
            raw: configRaw,
          })
        } else if (Object.keys(configRaw).length > 0) {
          await clnConfig.merge(effects, { raw: configRaw })
        }
      } else if (!config) {
        console.log(i18n('No existing config found. Writing defaults'))
        await clnConfig.write(effects, { clnrest: true })
      }

      // remove old start9 dir
      await rm('/media/startos/volumes/main/start9', { recursive: true }).catch(
        console.error,
      )
    },
    down: async ({ effects }) => {},
  },
})
