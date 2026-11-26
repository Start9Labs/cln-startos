import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:13',
  releaseNotes: {
    en_US: `**Security**

- [Sling 4.3.3](https://github.com/daywalker90/sling/releases/tag/v4.3.3): a channel peer could take funds from a Sling rebalance by returning it an HTLC that Sling accepted without checking its expiry or payment secret. Also fixes rebalance jobs that stopped on transient errors and a lost jobs list after a failed read. Affects nodes with Sling enabled.
- [xrebalance 0.4.11](https://github.com/ksedgwic/xrebalance/compare/v0.4.10...v0.4.11): a channel peer could take funds from a CLBOSS rebalance by returning it an HTLC at or near its expiry. Affects nodes with CLBOSS enabled.`,
    es_ES: `**Seguridad**

- [Sling 4.3.3](https://github.com/daywalker90/sling/releases/tag/v4.3.3): un par de canal podía quedarse con fondos de un reequilibrio de Sling devolviéndole un HTLC que Sling aceptaba sin comprobar su vencimiento ni su secreto de pago. También corrige trabajos de reequilibrio que se detenían ante errores transitorios y la pérdida de la lista de trabajos tras una lectura fallida. Afecta a los nodos con Sling activado.
- [xrebalance 0.4.11](https://github.com/ksedgwic/xrebalance/compare/v0.4.10...v0.4.11): un par de canal podía quedarse con fondos de un reequilibrio de CLBOSS devolviéndole un HTLC en su vencimiento o cerca de él. Afecta a los nodos con CLBOSS activado.`,
    de_DE: `**Sicherheit**

- [Sling 4.3.3](https://github.com/daywalker90/sling/releases/tag/v4.3.3): Ein Kanalpartner konnte Mittel aus einem Sling-Rebalancing abgreifen, indem er ihm einen HTLC zurückgab, den Sling ohne Prüfung von Ablauf und Zahlungsgeheimnis annahm. Behebt außerdem Rebalancing-Jobs, die bei vorübergehenden Fehlern stoppten, und eine nach einem fehlgeschlagenen Lesevorgang verlorene Jobliste. Betrifft Knoten mit aktiviertem Sling.
- [xrebalance 0.4.11](https://github.com/ksedgwic/xrebalance/compare/v0.4.10...v0.4.11): Ein Kanalpartner konnte Mittel aus einem CLBOSS-Rebalancing abgreifen, indem er ihm einen HTLC bei oder kurz vor dessen Ablauf zurückgab. Betrifft Knoten mit aktiviertem CLBOSS.`,
    pl_PL: `**Bezpieczeństwo**

- [Sling 4.3.3](https://github.com/daywalker90/sling/releases/tag/v4.3.3): partner kanału mógł przejąć środki z równoważenia Sling, zwracając mu HTLC, który Sling przyjmował bez sprawdzenia jego wygaśnięcia i sekretu płatności. Naprawia też zadania równoważenia, które zatrzymywały się przy przejściowych błędach, oraz utratę listy zadań po nieudanym odczycie. Dotyczy węzłów z włączonym Sling.
- [xrebalance 0.4.11](https://github.com/ksedgwic/xrebalance/compare/v0.4.10...v0.4.11): partner kanału mógł przejąć środki z równoważenia CLBOSS, zwracając mu HTLC w momencie lub tuż przed jego wygaśnięciem. Dotyczy węzłów z włączonym CLBOSS.`,
    fr_FR: `**Sécurité**

- [Sling 4.3.3](https://github.com/daywalker90/sling/releases/tag/v4.3.3) : un pair de canal pouvait s’approprier des fonds d’un rééquilibrage Sling en lui renvoyant un HTLC que Sling acceptait sans vérifier son expiration ni son secret de paiement. Corrige aussi des tâches de rééquilibrage qui s’arrêtaient sur des erreurs passagères et la perte de la liste des tâches après une lecture échouée. Concerne les nœuds où Sling est activé.
- [xrebalance 0.4.11](https://github.com/ksedgwic/xrebalance/compare/v0.4.10...v0.4.11) : un pair de canal pouvait s’approprier des fonds d’un rééquilibrage CLBOSS en lui renvoyant un HTLC à son expiration ou juste avant. Concerne les nœuds où CLBOSS est activé.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
