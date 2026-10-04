import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.8:6',
  releaseNotes: {
    en_US: `Fixes Core Lightning failing to start when CLBOSS Auto Close is enabled.`,
    es_ES: `Corrige el fallo de inicio de Core Lightning cuando Auto Close de CLBOSS está habilitado.`,
    de_DE: `Behebt, dass Core Lightning nicht startet, wenn CLBOSS Auto Close aktiviert ist.`,
    pl_PL: `Naprawia błąd uruchamiania Core Lightning, gdy włączona jest opcja Auto Close w CLBOSS.`,
    fr_FR: `Corrige l'échec du démarrage de Core Lightning lorsque Auto Close de CLBOSS est activé.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
