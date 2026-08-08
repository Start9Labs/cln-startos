import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:10',
  releaseNotes: {
    en_US: `Updates CLBOSS to 0.16.1.

CLBOSS is the plugin that manages your channels automatically. This point release fixes two failures it hit on Core Lightning 26.06:

- A crash ("Unhandled exception in concurrent task! Incorrect type.") whenever a brand-new channel changed state.
- Broken on-chain swaps: CLBOSS now asks explicitly for a taproot address instead of relying on a Core Lightning default that no longer exists. Previously the first swap failed and CLBOSS silently stopped swapping until the next restart.

Full upstream notes: https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.1`,
    es_ES: `Actualiza CLBOSS a la versión 0.16.1.

CLBOSS es el complemento que gestiona tus canales automáticamente. Esta versión de mantenimiento corrige dos fallos que se producían con Core Lightning 26.06:

- Un cierre inesperado («Unhandled exception in concurrent task! Incorrect type.») cada vez que un canal recién creado cambiaba de estado.
- Intercambios on-chain rotos: CLBOSS ahora solicita explícitamente una dirección taproot en lugar de depender de un valor predeterminado de Core Lightning que ya no existe. Antes, el primer intercambio fallaba y CLBOSS dejaba de hacer intercambios en silencio hasta el siguiente reinicio.

Notas completas del proyecto original: https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.1`,
    de_DE: `Aktualisiert CLBOSS auf 0.16.1.

CLBOSS ist das Plugin, das Ihre Kanäle automatisch verwaltet. Diese Wartungsversion behebt zwei Fehler, die unter Core Lightning 26.06 auftraten:

- Ein Absturz („Unhandled exception in concurrent task! Incorrect type.“), sobald ein brandneuer Kanal seinen Zustand änderte.
- Defekte On-Chain-Swaps: CLBOSS fordert jetzt ausdrücklich eine Taproot-Adresse an, statt sich auf eine nicht mehr vorhandene Core-Lightning-Voreinstellung zu verlassen. Zuvor schlug der erste Swap fehl und CLBOSS stellte die Swaps stillschweigend bis zum nächsten Neustart ein.

Vollständige Hinweise des Upstream-Projekts: https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.1`,
    pl_PL: `Aktualizuje CLBOSS do wersji 0.16.1.

CLBOSS to wtyczka, która automatycznie zarządza twoimi kanałami. To wydanie poprawkowe naprawia dwa błędy występujące na Core Lightning 26.06:

- Awarię („Unhandled exception in concurrent task! Incorrect type.”) za każdym razem, gdy zupełnie nowy kanał zmieniał stan.
- Niedziałające swapy on-chain: CLBOSS prosi teraz wprost o adres taproot, zamiast polegać na domyślnym ustawieniu Core Lightning, które już nie istnieje. Wcześniej pierwszy swap kończył się niepowodzeniem, a CLBOSS po cichu przestawał wykonywać swapy aż do kolejnego restartu.

Pełne informacje o wydaniu: https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.1`,
    fr_FR: `Met à jour CLBOSS vers la version 0.16.1.

CLBOSS est le plugin qui gère automatiquement vos canaux. Cette version corrective règle deux défaillances survenant avec Core Lightning 26.06 :

- Un plantage (« Unhandled exception in concurrent task! Incorrect type. ») dès qu'un canal tout neuf changeait d'état.
- Des échanges on-chain cassés : CLBOSS demande désormais explicitement une adresse taproot au lieu de s'appuyer sur une valeur par défaut de Core Lightning qui n'existe plus. Auparavant, le premier échange échouait et CLBOSS cessait silencieusement d'en effectuer jusqu'au redémarrage suivant.

Notes complètes du projet amont : https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.1`,
  },
  migrations: {},
})
