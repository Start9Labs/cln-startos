import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.9:0',
  releaseNotes: {
    en_US: `Updates Core Lightning to 26.06.9, a security release from the Core Lightning developers. Upgrade as soon as you can.

Core Lightning release notes: https://github.com/ElementsProject/lightning/releases/tag/v26.06.9`,
    es_ES: `Actualiza Core Lightning a 26.06.9, una versión de seguridad de los desarrolladores de Core Lightning. Actualiza cuanto antes.

Notas de la versión de Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.9`,
    de_DE: `Aktualisiert Core Lightning auf 26.06.9, eine Sicherheitsversion der Core-Lightning-Entwickler. Aktualisieren Sie so bald wie möglich.

Core-Lightning-Versionshinweise: https://github.com/ElementsProject/lightning/releases/tag/v26.06.9`,
    pl_PL: `Aktualizuje Core Lightning do wersji 26.06.9, wydania zabezpieczeń od twórców Core Lightning. Zaktualizuj jak najszybciej.

Informacje o wydaniu Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.9`,
    fr_FR: `Met à jour Core Lightning vers la version 26.06.9, une version de sécurité publiée par les développeurs de Core Lightning. Mettez à jour dès que possible.

Notes de version de Core Lightning : https://github.com/ElementsProject/lightning/releases/tag/v26.06.9`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
