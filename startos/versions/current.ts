import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:4',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.1 or later. Peers can now open connections to your node over its public IPv6 address.',
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. Los pares ahora pueden abrir conexiones con tu nodo a través de su dirección IPv6 pública.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Peers können jetzt Verbindungen zu deinem Knoten über seine öffentliche IPv6-Adresse aufbauen.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Peery mogą teraz nawiązywać połączenia z twoim węzłem przez jego publiczny adres IPv6.',
    fr_FR:
      'Nécessite StartOS 0.4.1 ou une version ultérieure. Les pairs peuvent désormais ouvrir des connexions vers votre nœud via son adresse IPv6 publique.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
