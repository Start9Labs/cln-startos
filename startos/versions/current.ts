import { IMPOSSIBLE, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { clnConfig } from '../fileModels/config'
import { storeJson } from '../fileModels/store.json'

export const current = VersionInfo.of({
  version: '26.6.1:1',
  releaseNotes: {
    en_US: `Updated the Sling rebalancing plugin to 4.3.0: it now reads BLIP-18 inbound fees from the gossip store and accounts for them when rebalancing channels. Full notes: https://github.com/daywalker90/sling/releases/tag/v4.3.0`,
    es_ES: `Se actualizó el complemento de reequilibrio Sling a 4.3.0: ahora lee las tarifas de entrada BLIP-18 del almacén de gossip y las tiene en cuenta al reequilibrar los canales. Notas completas: https://github.com/daywalker90/sling/releases/tag/v4.3.0`,
    de_DE: `Das Sling-Rebalancing-Plugin wurde auf 4.3.0 aktualisiert: Es liest jetzt BLIP-18-Eingangsgebühren aus dem Gossip-Speicher und berücksichtigt sie beim Rebalancing der Kanäle. Vollständige Hinweise: https://github.com/daywalker90/sling/releases/tag/v4.3.0`,
    pl_PL: `Zaktualizowano wtyczkę równoważenia Sling do wersji 4.3.0: odczytuje teraz opłaty przychodzące BLIP-18 z magazynu gossip i uwzględnia je podczas równoważenia kanałów. Pełne informacje: https://github.com/daywalker90/sling/releases/tag/v4.3.0`,
    fr_FR: `Le plugin de rééquilibrage Sling a été mis à jour vers 4.3.0 : il lit désormais les frais entrants BLIP-18 depuis le magasin de gossip et en tient compte lors du rééquilibrage des canaux. Notes complètes : https://github.com/daywalker90/sling/releases/tag/v4.3.0`,
  },
  migrations: {
    up: async ({ effects }) => {
      // Remove the legacy StartOS-issued gRPC certs (older versions wrote certs
      // for c-lightning.startos here) so cln-grpc regenerates its native "cln"
      // certs, which is the TLS identity gRPC clients like Alby Hub expect.
      const grpcCertDir = '/media/startos/volumes/main/bitcoin'
      await Promise.all(
        [
          'ca.pem',
          'ca-key.pem',
          'server.pem',
          'server-key.pem',
          'client.pem',
          'client-key.pem',
        ].map((file) => rm(`${grpcCertDir}/${file}`, { force: true })),
      )

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
