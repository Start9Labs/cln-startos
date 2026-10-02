import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.8:5',
  releaseNotes: {
    en_US: `Removes the Splicing option from Experimental Features. Splicing is always enabled in Core Lightning.`,
    es_ES: `Elimina la opción Splicing de Funciones experimentales. El splicing siempre está habilitado en Core Lightning.`,
    de_DE: `Entfernt die Option Splicing aus den experimentellen Funktionen. Splicing ist in Core Lightning immer aktiviert.`,
    pl_PL: `Usuwa opcję Splicing z funkcji eksperymentalnych. Splicing jest w Core Lightning zawsze włączony.`,
    fr_FR: `Supprime l'option Splicing des fonctionnalités expérimentales. Le splicing est toujours activé dans Core Lightning.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
