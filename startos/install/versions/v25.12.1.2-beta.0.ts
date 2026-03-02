import { VersionInfo, IMPOSSIBLE, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { storeJson } from '../../fileModels/store.json'
import { clnConfig } from '../../fileModels/config'
import { teosToml } from '../../fileModels/teos.toml'
import { i18n } from '../../i18n'

export const v25_12_1_2 = VersionInfo.of({
  version: '25.12.1:2-beta.0',
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
          await teosToml.merge(effects, {})
        }

        await storeJson.write(effects, {
          watchtowerServer: configYaml.watchtowers['wt-server'],
          watchtowerClients:
            configYaml.watchtowers['wt-client'].enabled === 'enabled'
              ? configYaml.watchtowers['wt-client']['add-watchtowers']
              : [],
        })

        // Migrate experimental flags and clboss settings into CLN config
        const configRaw: Record<string, unknown> = {}
        if (
          configYaml.advanced.experimental['dual-fund'].enabled === 'enabled'
        ) {
          configRaw['experimental-dual-fund'] = true
        }
        if (configYaml.advanced.experimental['shutdown-wrong-funding']) {
          configRaw['experimental-shutdown-wrong-funding'] = true
        }
        if (configYaml.advanced.experimental.splicing) {
          configRaw['experimental-splicing'] = true
        }
        if (configYaml.advanced.plugins.clboss.enabled === 'enabled') {
          const cb = configYaml.advanced.plugins.clboss
          configRaw['clboss-min-onchain'] = cb['min-onchain'] || undefined
          configRaw['clboss-auto-close'] = cb['auto-close'] || undefined
          configRaw['clboss-zerobasefee'] =
            cb.zerobasefee === 'default' ? undefined : cb.zerobasefee
          configRaw['clboss-min-channel'] = cb['min-channel'] || undefined
          configRaw['clboss-max-channel'] = cb['max-channel'] || undefined
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
    down: IMPOSSIBLE,
  },
})
