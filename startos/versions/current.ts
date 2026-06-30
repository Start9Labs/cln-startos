import { IMPOSSIBLE, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { clnConfig } from '../fileModels/config'
import { storeJson } from '../fileModels/store.json'

export const current = VersionInfo.of({
  version: '26.6.2:0',
  releaseNotes: {
    en_US: `Updated Core Lightning to 26.06.2. A small point release that bundles root TLS certificates so the cln-currencyrate plugin works on minimal images that ship without them; no other functional changes. Full notes: https://github.com/ElementsProject/lightning/releases/tag/v26.06.2`,
    es_ES: `Se actualizó Core Lightning a 26.06.2. Una pequeña versión correctiva que incluye los certificados raíz TLS para que el plugin cln-currencyrate funcione en imágenes mínimas que no los incluyen; sin otros cambios funcionales. Notas completas: https://github.com/ElementsProject/lightning/releases/tag/v26.06.2`,
    de_DE: `Core Lightning wurde auf 26.06.2 aktualisiert. Eine kleine Wartungsversion, die Root-TLS-Zertifikate bündelt, damit das Plugin cln-currencyrate auf minimalen Images ohne diese Zertifikate funktioniert; keine weiteren funktionalen Änderungen. Vollständige Hinweise: https://github.com/ElementsProject/lightning/releases/tag/v26.06.2`,
    pl_PL: `Zaktualizowano Core Lightning do 26.06.2. Niewielka wersja poprawkowa dołączająca główne certyfikaty TLS, dzięki czemu wtyczka cln-currencyrate działa na minimalnych obrazach, które ich nie zawierają; brak innych zmian funkcjonalnych. Pełne informacje: https://github.com/ElementsProject/lightning/releases/tag/v26.06.2`,
    fr_FR: `Core Lightning a été mis à jour vers 26.06.2. Une petite version corrective qui intègre les certificats racine TLS afin que le plugin cln-currencyrate fonctionne sur les images minimales qui en sont dépourvues ; aucun autre changement fonctionnel. Notes complètes : https://github.com/ElementsProject/lightning/releases/tag/v26.06.2`,
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
