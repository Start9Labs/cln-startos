import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.9:3',
  releaseNotes: {
    en_US: 'Performance improvement',
    es_ES: 'Mejora de rendimiento',
    de_DE: 'Leistungsverbesserung',
    pl_PL: 'Poprawa wydajności',
    fr_FR: 'Amélioration des performances',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
