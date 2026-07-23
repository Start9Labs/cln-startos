import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:0',
  releaseNotes: {
    en_US: `Updated Core Lightning to 26.06.6, rolling up the 26.06.3–26.06.6 maintenance releases (bug fixes and stability improvements).

This release also migrates the package to start-sdk 2.0 (requires StartOS 0.4.0-beta.10 or later).

Full release notes: https://github.com/ElementsProject/lightning/releases`,
    es_ES: `Actualiza Core Lightning a 26.06.6, incorporando las versiones de mantenimiento 26.06.3–26.06.6 (correcciones de errores y mejoras de estabilidad).

Esta versión también migra el paquete a start-sdk 2.0 (requiere StartOS 0.4.0-beta.10 o posterior).

Notas de la versión completas: https://github.com/ElementsProject/lightning/releases`,
    de_DE: `Aktualisiert Core Lightning auf 26.06.6 und fasst die Wartungsversionen 26.06.3–26.06.6 zusammen (Fehlerbehebungen und Stabilitätsverbesserungen).

Diese Version stellt das Paket außerdem auf start-sdk 2.0 um (erfordert StartOS 0.4.0-beta.10 oder neuer).

Vollständige Versionshinweise: https://github.com/ElementsProject/lightning/releases`,
    pl_PL: `Aktualizuje Core Lightning do 26.06.6, obejmując wydania konserwacyjne 26.06.3–26.06.6 (poprawki błędów i usprawnienia stabilności).

Ta wersja przenosi też pakiet na start-sdk 2.0 (wymaga StartOS 0.4.0-beta.10 lub nowszego).

Pełne informacje o wydaniu: https://github.com/ElementsProject/lightning/releases`,
    fr_FR: `Met à jour Core Lightning vers 26.06.6, en intégrant les versions de maintenance 26.06.3 à 26.06.6 (corrections de bogues et améliorations de stabilité).

Cette version fait également passer le paquet à start-sdk 2.0 (nécessite StartOS 0.4.0-beta.10 ou une version ultérieure).

Notes de version complètes : https://github.com/ElementsProject/lightning/releases`,
  },
  migrations: {},
})
