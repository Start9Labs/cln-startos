import { IMPOSSIBLE, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { clnConfig } from '../fileModels/config'
import { storeJson } from '../fileModels/store.json'

export const v_26_4_1_2 = VersionInfo.of({
  version: '26.4.1:2',
  releaseNotes: {
    en_US: `**Bumps**

- clboss → 0.16.0 (Darkness on the Edge of the Mempool)
- sling → 4.2.1

**Fixes**

- sling now correctly reads CLN's compacted gossip store on v26.04+ (could degrade routing on the previous version).

**Behavior changes**

- clboss internal rebalancing fee cap default dropped from 0.5% to 0.1%.
- sling no longer accepts your own channels or node id in \`sling-except-chan\`; if you set this manually, remove those entries before upgrading.`,
    es_ES: `**Cambios**

- clboss → 0.16.0 (Darkness on the Edge of the Mempool)
- sling → 4.2.1

**Correcciones**

- sling ahora lee correctamente el gossip store compactado de CLN en v26.04+ (podía degradar el enrutamiento en la versión anterior).

**Cambios de comportamiento**

- El tope por defecto de la comisión de rebalanceo interno de clboss se redujo del 0,5% al 0,1%.
- sling ya no acepta tus propios canales ni tu node id en \`sling-except-chan\`; si los configuraste manualmente, elimina esas entradas antes de actualizar.`,
    de_DE: `**Aktualisierungen**

- clboss → 0.16.0 (Darkness on the Edge of the Mempool)
- sling → 4.2.1

**Korrekturen**

- sling liest jetzt den kompaktierten Gossip-Store von CLN auf v26.04+ korrekt (konnte zuvor das Routing beeinträchtigen).

**Verhaltensänderungen**

- Der Standardwert der internen Rebalancing-Gebührenobergrenze von clboss wurde von 0,5 % auf 0,1 % gesenkt.
- sling akzeptiert keine eigenen Kanäle oder die eigene Node-ID mehr in \`sling-except-chan\`; falls Sie diese manuell gesetzt haben, entfernen Sie die Einträge vor dem Upgrade.`,
    pl_PL: `**Aktualizacje**

- clboss → 0.16.0 (Darkness on the Edge of the Mempool)
- sling → 4.2.1

**Poprawki**

- sling poprawnie odczytuje teraz skompaktowany gossip store CLN w wersji v26.04+ (mogło to wcześniej pogarszać routing).

**Zmiany zachowania**

- Domyślny limit opłaty wewnętrznego rebalansowania clboss obniżony z 0,5% do 0,1%.
- sling nie akceptuje już własnych kanałów ani własnego node id w \`sling-except-chan\`; jeśli ustawiłeś to ręcznie, usuń te wpisy przed aktualizacją.`,
    fr_FR: `**Mises à jour**

- clboss → 0.16.0 (Darkness on the Edge of the Mempool)
- sling → 4.2.1

**Corrections**

- sling lit désormais correctement le gossip store compacté de CLN sur v26.04+ (pouvait dégrader le routage dans la version précédente).

**Changements de comportement**

- Le plafond par défaut des frais de rééquilibrage interne de clboss est passé de 0,5 % à 0,1 %.
- sling n'accepte plus vos propres canaux ni votre node id dans \`sling-except-chan\` ; si vous les avez configurés manuellement, supprimez ces entrées avant la mise à niveau.`,
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
