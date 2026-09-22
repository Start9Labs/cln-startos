import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.7:4',
  releaseNotes: {
    en_US: `**New**

- CLBOSS actions: view CLBOSS's status and swaps, pause and resume its management of on-chain funds, and exclude a peer from some or all of its management.
- Watchtowers can be given a label, and a new Watchtowers health check reports whether each subscribed tower is reachable.
- General Settings has a Bitcoin Retry Timeout setting.

**Fixes**

- The dual funding amounts in Experimental Features are now labeled in satoshis, the unit Core Lightning has always applied them in. If you entered millisatoshi values there, divide them by 1,000.

**Updates**

- Updated the bundled Bitcoin Core RPC client (\`bitcoin-cli\`) to 31.1.`,
    es_ES: `**Novedades**

- Acciones de CLBOSS: ver el estado y los swaps de CLBOSS, pausar y reanudar su gestión de los fondos on-chain, y excluir a un par de toda o parte de su gestión.
- Los Watchtowers pueden llevar una etiqueta, y una nueva comprobación de salud, Watchtowers, indica si cada Watchtower suscrito es accesible.
- Configuración general incluye el ajuste Tiempo de reintento de Bitcoin.

**Correcciones**

- Los importes de financiación dual en Funciones experimentales ahora se muestran en satoshis, la unidad en la que Core Lightning siempre los ha aplicado. Si introdujo valores en milisatoshis, divídalos entre 1.000.

**Actualizaciones**

- Se actualizó el cliente RPC de Bitcoin Core incluido (\`bitcoin-cli\`) a la versión 31.1.`,
    de_DE: `**Neu**

- CLBOSS-Aktionen: Status und Swaps von CLBOSS anzeigen, seine Verwaltung der On-Chain-Mittel pausieren und fortsetzen sowie einen Peer ganz oder teilweise von seiner Verwaltung ausnehmen.
- Watchtower können eine Bezeichnung erhalten, und eine neue Zustandsprüfung „Watchtower“ meldet, ob jeder abonnierte Watchtower erreichbar ist.
- Allgemeine Einstellungen enthält die Einstellung Bitcoin-Wiederholungszeitlimit.

**Fehlerbehebungen**

- Die Beträge für duale Finanzierung unter Experimentelle Funktionen werden jetzt in Satoshis angegeben, der Einheit, in der Core Lightning sie schon immer angewendet hat. Falls Sie dort Millisatoshi-Werte eingegeben haben, teilen Sie sie durch 1.000.

**Aktualisierungen**

- Der mitgelieferte Bitcoin-Core-RPC-Client (\`bitcoin-cli\`) wurde auf Version 31.1 aktualisiert.`,
    pl_PL: `**Nowości**

- Akcje CLBOSS: podgląd stanu i swapów CLBOSS, wstrzymywanie i wznawianie zarządzania środkami on-chain oraz wyłączanie peera z części lub całości zarządzania.
- Watchtowerom można nadać etykietę, a nowa kontrola stanu Watchtowery pokazuje, czy każdy subskrybowany Watchtower jest osiągalny.
- Ustawienia ogólne zawierają ustawienie Limit czasu ponawiania Bitcoin.

**Poprawki**

- Kwoty podwójnego finansowania w Funkcjach eksperymentalnych są teraz opisane w satoshi, czyli w jednostce, w której Core Lightning zawsze je stosował. Jeśli wpisano tam wartości w millisatoshi, podziel je przez 1000.

**Aktualizacje**

- Dołączony klient RPC Bitcoin Core (\`bitcoin-cli\`) został zaktualizowany do wersji 31.1.`,
    fr_FR: `**Nouveautés**

- Actions CLBOSS : consulter l'état et les swaps de CLBOSS, suspendre et reprendre sa gestion des fonds on-chain, et exclure un pair de tout ou partie de sa gestion.
- Les Watchtowers peuvent recevoir un libellé, et une nouvelle vérification d'état, Watchtowers, indique si chaque Watchtower auquel le noeud est abonné est joignable.
- Paramètres généraux propose le réglage Délai de nouvelle tentative Bitcoin.

**Corrections**

- Les montants du financement dual dans Fonctionnalités expérimentales sont désormais exprimés en satoshis, l'unité dans laquelle Core Lightning les a toujours appliqués. Si vous y avez saisi des valeurs en millisatoshis, divisez-les par 1 000.

**Mises à jour**

- Le client RPC Bitcoin Core inclus (\`bitcoin-cli\`) a été mis à jour vers la version 31.1.`,
  },
  migrations: {},
})
