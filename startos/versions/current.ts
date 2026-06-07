import { IMPOSSIBLE, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { clnConfig } from '../fileModels/config'
import { storeJson } from '../fileModels/store.json'

export const current = VersionInfo.of({
  version: '26.6.1:0',
  releaseNotes: {
    en_US: `**Bumps**

- Core Lightning → 26.06.1 (fixes bwatch plugin registration failure)

**Fixes**

- gRPC is now reachable by other services on this server, fixing connections from apps like Alby Hub`,
    es_ES: `**Actualizaciones**

- Core Lightning → 26.06.1 (corrige el fallo de registro del plugin bwatch)

**Correcciones**

- gRPC ahora es accesible por otros servicios de este servidor, lo que corrige las conexiones desde aplicaciones como Alby Hub`,
    de_DE: `**Aktualisierungen**

- Core Lightning → 26.06.1 (behebt den Registrierungsfehler des bwatch-Plugins)

**Fehlerbehebungen**

- gRPC ist jetzt für andere Dienste auf diesem Server erreichbar, was Verbindungen von Apps wie Alby Hub behebt`,
    pl_PL: `**Aktualizacje**

- Core Lightning → 26.06.1 (naprawia błąd rejestracji wtyczki bwatch)

**Poprawki**

- gRPC jest teraz osiągalny przez inne usługi na tym serwerze, co naprawia połączenia z aplikacji takich jak Alby Hub`,
    fr_FR: `**Mises à jour**

- Core Lightning → 26.06.1 (corrige l’échec d’enregistrement du plugin bwatch)

**Corrections**

- gRPC est désormais accessible par les autres services de ce serveur, corrigeant les connexions depuis des applications comme Alby Hub`,
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
