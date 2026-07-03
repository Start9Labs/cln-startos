import { IMPOSSIBLE, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { X509Certificate } from 'crypto'
import { clnConfig } from '../fileModels/config'
import { storeJson } from '../fileModels/store.json'

export const current = VersionInfo.of({
  version: '26.6.1:2',
  releaseNotes: {
    en_US: 'Internal updates (start-sdk 2.0.x)',
    es_ES: 'Actualizaciones internas (start-sdk 2.0.x)',
    de_DE: 'Interne Aktualisierungen (start-sdk 2.0.x)',
    pl_PL: 'Aktualizacje wewnętrzne (start-sdk 2.0.x)',
    fr_FR: 'Mises à jour internes (start-sdk 2.0.x)',
  },
  migrations: {
    up: async ({ effects }) => {
      // Reset the legacy StartOS-issued gRPC certs so cln-grpc regenerates its
      // native "cln" certs — the TLS identity clients like Alby Hub expect. The
      // since-removed setupCerts init (0.4.0-beta releases 25.12.1:x … 26.6:0)
      // overwrote cln-grpc's certs with StartOS-issued ones bearing a
      // `c-lightning.startos` SAN; we key on that SAN so the reset is idempotent
      // and safe to run on every update — native certs (already-fixed installs,
      // and installs predating setupCerts such as 0.3.5.1) are left untouched, so
      // it never deletes a live identity or breaks an existing pairing.
      //
      // TODO: delete this block once 0.4.0 is out of beta. The only installs that
      // carry these certs are from the beta setupCerts era; by GA they will all
      // have migrated through a reset and the SAN guard will match nothing.
      const grpcCertDir = '/media/startos/volumes/main/bitcoin'
      const serverCert = await readFile(
        `${grpcCertDir}/server.pem`,
        'utf-8',
      ).catch(() => null)
      const certBlocks =
        serverCert?.match(
          /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
        ) ?? []
      const startOsIssued = certBlocks.some((pem) => {
        try {
          return !!new X509Certificate(pem).subjectAltName?.includes(
            'c-lightning.startos',
          )
        } catch {
          return false
        }
      })
      if (startOsIssued) {
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
      }

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
