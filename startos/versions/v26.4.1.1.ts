import { IMPOSSIBLE, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { clnConfig } from '../fileModels/config'
import { storeJson } from '../fileModels/store.json'

export const v_26_4_1_1 = VersionInfo.of({
  version: '26.4.1:1',
  releaseNotes: {
    en_US: `**Bumps**

- Core Lightning → 26.04.1 (Negative Routing Fees II)
- @start9labs/start-sdk → 1.5.0

**Internal**

- Adapt to SDK \`AddSslOptions.auth\` requirement.`,
    es_ES: `**Cambios**

- Core Lightning → 26.04.1 (Tarifas de Enrutamiento Negativas II)
- @start9labs/start-sdk → 1.5.0

**Interno**

- Adaptación al nuevo requisito \`AddSslOptions.auth\` del SDK.`,
    de_DE: `**Aktualisierungen**

- Core Lightning → 26.04.1 (Negative Routing-Gebühren II)
- @start9labs/start-sdk → 1.5.0

**Intern**

- Anpassung an die neue \`AddSslOptions.auth\`-Anforderung des SDK.`,
    pl_PL: `**Aktualizacje**

- Core Lightning → 26.04.1 (Ujemne opłaty routingowe II)
- @start9labs/start-sdk → 1.5.0

**Wewnętrzne**

- Dostosowanie do nowego wymogu \`AddSslOptions.auth\` w SDK.`,
    fr_FR: `**Mises à jour**

- Core Lightning → 26.04.1 (Frais de Routage Négatifs II)
- @start9labs/start-sdk → 1.5.0

**Interne**

- Adaptation à la nouvelle exigence \`AddSslOptions.auth\` du SDK.`,
  },
  migrations: {
    up: async ({ effects }) => {
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

      // Migrate settings from old 0.3.5.1 config.yaml if present.
      // The old entrypoint wrote config.main -> config on the volume,
      // so the existing INI config persists and is preserved by merge().
      if (configYaml) {
        const watchtowers = configYaml.watchtowers
        const wtClient = watchtowers?.['wt-client']
        const experimental = configYaml.advanced?.experimental
        const clboss = configYaml.advanced?.plugins?.clboss

        await storeJson.merge(effects, {
          watchtowerServer: watchtowers?.['wt-server'] ?? false,
          watchtowerClients:
            wtClient?.enabled === 'enabled' ? wtClient['add-watchtowers'] : [],
        })

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

        // Clean up c-lightning-REST plugin path from pre-v25.02 configs
        const existing = await clnConfig.read().once()
        const plugins = (existing?.raw?.plugin ?? []).filter(
          (p) =>
            p !==
            '/usr/local/libexec/c-lightning/plugins/c-lightning-REST/clrest.js',
        )
        configRaw.plugin = plugins.length > 0 ? plugins : undefined

        await clnConfig.merge(effects, { clnrest: true, raw: configRaw })
      }

      // remove old start9 dir
      await rm('/media/startos/volumes/main/start9', { recursive: true }).catch(
        console.error,
      )

      // remove old config.main leftover
      await rm('/media/startos/volumes/main/config.main').catch(console.error)
    },
    down: IMPOSSIBLE,
  },
})
