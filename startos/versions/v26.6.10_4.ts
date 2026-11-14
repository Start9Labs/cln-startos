import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_26_6_10_4 = VersionInfo.of({
  version: '26.6.10:4',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.1 or later. Peers and watchtower clients can now connect to your node over its IPv6 addresses.',
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. Los pares y los clientes de la torre de vigilancia ahora pueden conectarse a tu nodo a través de sus direcciones IPv6.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Peers und Watchtower-Clients können sich jetzt über die IPv6-Adressen deines Knotens mit ihm verbinden.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Peery i klienci wieży strażniczej mogą teraz łączyć się z twoim węzłem przez jego adresy IPv6.',
    fr_FR:
      'Nécessite StartOS 0.4.1 ou une version ultérieure. Les pairs et les clients de la tour de guet peuvent désormais se connecter à votre nœud via ses adresses IPv6.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
