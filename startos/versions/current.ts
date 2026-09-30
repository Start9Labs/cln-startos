import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.8:4',
  releaseNotes: {
    en_US: `Internal updates.`,
    es_ES: `Actualizaciones internas.`,
    de_DE: `Interne Aktualisierungen.`,
    pl_PL: `Aktualizacje wewnętrzne.`,
    fr_FR: `Mises à jour internes.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
