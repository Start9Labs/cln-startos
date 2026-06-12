import { IMPOSSIBLE, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { clnConfig } from '../fileModels/config'
import { storeJson } from '../fileModels/store.json'

export const current = VersionInfo.of({
  version: '26.6.1:1',
  releaseNotes: {
    en_US: `**Fixes**

- CLNrest is reachable again: the previous release's certificate change broke all CLNrest connections through StartOS (LAN and Tor)
- CLNrest now serves plain HTTP, so Tor onion services can expose it without TLS — restoring Zeus-over-Tor connections. LAN/clearnet access remains HTTPS via StartOS
- CLNrest URLs now use the \`clnrest+http://\` / \`clnrest+https://\` schemes so wallets like Zeus connect with the correct protocol`,
    es_ES: `**Correcciones**

- CLNrest vuelve a ser accesible: el cambio de certificados de la versión anterior rompió todas las conexiones CLNrest a través de StartOS (LAN y Tor)
- CLNrest ahora sirve HTTP plano, de modo que los servicios onion de Tor pueden exponerlo sin TLS — restaurando las conexiones de Zeus por Tor. El acceso LAN/clearnet sigue siendo HTTPS a través de StartOS
- Las URL de CLNrest ahora usan los esquemas \`clnrest+http://\` / \`clnrest+https://\` para que carteras como Zeus se conecten con el protocolo correcto`,
    de_DE: `**Fehlerbehebungen**

- CLNrest ist wieder erreichbar: die Zertifikatsänderung der vorherigen Version hat alle CLNrest-Verbindungen über StartOS unterbrochen (LAN und Tor)
- CLNrest liefert jetzt einfaches HTTP, sodass Tor-Onion-Dienste es ohne TLS bereitstellen können — Zeus-über-Tor-Verbindungen funktionieren wieder. LAN-/Clearnet-Zugriff bleibt HTTPS über StartOS
- CLNrest-URLs verwenden jetzt die Schemata \`clnrest+http://\` / \`clnrest+https://\`, damit Wallets wie Zeus sich mit dem richtigen Protokoll verbinden`,
    pl_PL: `**Poprawki**

- CLNrest jest znów osiągalny: zmiana certyfikatów w poprzednim wydaniu zepsuła wszystkie połączenia CLNrest przez StartOS (LAN i Tor)
- CLNrest serwuje teraz czysty HTTP, dzięki czemu usługi onion Tora mogą go udostępniać bez TLS — przywracając połączenia Zeus przez Tor. Dostęp LAN/clearnet pozostaje HTTPS przez StartOS
- Adresy URL CLNrest używają teraz schematów \`clnrest+http://\` / \`clnrest+https://\`, dzięki czemu portfele takie jak Zeus łączą się właściwym protokołem`,
    fr_FR: `**Corrections**

- CLNrest est de nouveau accessible : le changement de certificats de la version précédente avait cassé toutes les connexions CLNrest via StartOS (LAN et Tor)
- CLNrest sert désormais du HTTP en clair, afin que les services onion Tor puissent l'exposer sans TLS — rétablissant les connexions Zeus via Tor. L'accès LAN/clearnet reste en HTTPS via StartOS
- Les URL CLNrest utilisent désormais les schémas \`clnrest+http://\` / \`clnrest+https://\` pour que les portefeuilles comme Zeus se connectent avec le bon protocole`,
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
