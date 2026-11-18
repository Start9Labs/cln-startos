import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:5',
  releaseNotes: {
    en_US:
      "Requires StartOS 0.4.1 or later. Update Bitcoin first: Core Lightning can now read only Bitcoin's RPC credential, not its data directory or wallets.",
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. Actualiza Bitcoin primero: Core Lightning ahora solo puede leer la credencial RPC de Bitcoin, no su directorio de datos ni sus billeteras.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Aktualisiere zuerst Bitcoin: Core Lightning kann jetzt nur noch die RPC-Zugangsdaten von Bitcoin lesen, nicht sein Datenverzeichnis oder seine Wallets.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Najpierw zaktualizuj Bitcoin: Core Lightning może teraz odczytać tylko poświadczenie RPC Bitcoina, a nie jego katalog danych ani portfele.',
    fr_FR:
      "Nécessite StartOS 0.4.1 ou une version ultérieure. Mettez d'abord Bitcoin à jour : Core Lightning ne peut désormais lire que l'identifiant RPC de Bitcoin, et non son répertoire de données ni ses portefeuilles.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
