import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:12',
  releaseNotes: {
    en_US: `Updates CLBOSS to 0.16.3.

CLBOSS is the plugin that manages your channels automatically. This release fixes three reported security and robustness issues, and upgrading is recommended:

- When several payments were forwarded toward the same depleted channel at once, CLBOSS started a full rebalance for each of them against an out-of-date fee budget. It paid the fee every time, and the resulting overspend then blocked legitimate rebalances for that channel. Only one rebalance per destination now runs at a time.
- Auto Close, the opt-in setting that closes channels CLBOSS judges bad for your node, asked for a unilateral close after three minutes whatever the peer's connection state. One of the things it judges a peer on is how rarely that peer connects, so the channels with exactly those peers were force-closed. CLBOSS now checks every ten minutes for the peer to reappear and closes mutually as soon as it does, even when fees are high; only after three days without contact does it fall back to a unilateral close, and then only while fees are low.
- Claiming a completed reverse submarine swap marked every swap in progress as claimed, which blocked the others from being claimed. Their funds were recoverable once the timelock expired and were never at risk of theft. The claim is now recorded against the one swap it belongs to.

Full upstream notes: https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.3`,
    es_ES: `Actualiza CLBOSS a la versión 0.16.3.

CLBOSS es el complemento que gestiona tus canales automáticamente. Esta versión corrige tres problemas de seguridad y robustez notificados, y se recomienda actualizar:

- Cuando se reenviaban varios pagos a la vez hacia un mismo canal agotado, CLBOSS iniciaba un reequilibrio completo por cada uno de ellos con un presupuesto de comisiones desactualizado. Pagaba la comisión en cada caso, y el exceso de gasto resultante bloqueaba después los reequilibrios legítimos de ese canal. Ahora solo se ejecuta un reequilibrio por destino a la vez.
- Cierre automático, el ajuste opcional que cierra los canales que CLBOSS considera malos para tu nodo, solicitaba un cierre unilateral tras tres minutos fuera cual fuera el estado de conexión del par. Uno de los criterios con los que juzga a un par es la poca frecuencia con la que se conecta, por lo que los canales con esos pares acababan con un cierre forzoso. Ahora CLBOSS comprueba cada diez minutos si el par reaparece y realiza el cierre mutuo en cuanto lo hace, incluso con comisiones altas; solo tras tres días sin contacto recurre al cierre unilateral, y únicamente mientras las comisiones son bajas.
- Al reclamar un intercambio submarino inverso completado, se marcaban como reclamados todos los intercambios en curso, lo que impedía reclamar los demás. Sus fondos eran recuperables al expirar el bloqueo temporal y nunca corrieron riesgo de robo. Ahora la reclamación se registra solo en el intercambio al que corresponde.

Notas completas del proyecto original: https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.3`,
    de_DE: `Aktualisiert CLBOSS auf 0.16.3.

CLBOSS ist das Plugin, das Ihre Kanäle automatisch verwaltet. Diese Version behebt drei gemeldete Sicherheits- und Robustheitsprobleme, ein Update wird empfohlen:

- Wurden mehrere Zahlungen gleichzeitig über denselben erschöpften Kanal weitergeleitet, startete CLBOSS für jede davon einen vollständigen Ausgleich auf Basis eines veralteten Gebührenbudgets. Die Gebühr fiel jedes Mal an, und die dadurch verbuchte Überschreitung blockierte anschließend berechtigte Ausgleiche für diesen Kanal. Pro Ziel läuft nun nur noch ein Ausgleich zur selben Zeit.
- Automatisches Schließen, die optionale Einstellung, die Kanäle schließt, die CLBOSS als schlecht für Ihren Knoten einstuft, forderte nach drei Minuten einen einseitigen Abschluss an, unabhängig vom Verbindungszustand des Partners. Eines der Kriterien für diese Einstufung ist gerade, wie selten ein Partner sich verbindet, sodass die Kanäle zu genau diesen Partnern zwangsweise geschlossen wurden. CLBOSS prüft nun alle zehn Minuten, ob der Partner wieder erscheint, und schließt einvernehmlich, sobald das geschieht, auch bei hohen Gebühren; erst nach drei Tagen ohne Kontakt folgt ein einseitiger Abschluss, und auch dann nur, solange die Gebühren niedrig sind.
- Beim Einlösen eines abgeschlossenen umgekehrten Submarine-Swaps wurden alle laufenden Swaps als eingelöst markiert, wodurch die übrigen nicht mehr eingelöst werden konnten. Deren Guthaben war nach Ablauf der Zeitsperre wiederherstellbar und zu keiner Zeit von Diebstahl bedroht. Die Einlösung wird jetzt nur noch dem zugehörigen Swap zugeordnet.

Vollständige Hinweise des Upstream-Projekts: https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.3`,
    pl_PL: `Aktualizuje CLBOSS do wersji 0.16.3.

CLBOSS to wtyczka, która automatycznie zarządza twoimi kanałami. To wydanie naprawia trzy zgłoszone problemy związane z bezpieczeństwem i niezawodnością i zalecana jest aktualizacja:

- Gdy jednocześnie przekazywano kilka płatności przez ten sam wyczerpany kanał, CLBOSS uruchamiał dla każdej z nich pełne równoważenie w oparciu o nieaktualny budżet opłat. Opłata była pobierana za każdym razem, a zapisane przekroczenie budżetu blokowało następnie uzasadnione równoważenia tego kanału. Teraz dla jednego celu działa naraz tylko jedno równoważenie.
- Automatyczne zamykanie, opcjonalne ustawienie zamykające kanały, które CLBOSS uznaje za niekorzystne dla twojego węzła, żądało jednostronnego zamknięcia po trzech minutach niezależnie od tego, czy węzeł partnerski był połączony. Jednym z kryteriów tej oceny jest właśnie to, jak rzadko dany węzeł partnerski się łączy, więc kanały z takimi węzłami były zamykane przymusowo. CLBOSS sprawdza teraz co dziesięć minut, czy węzeł partnerski się pojawił, i przeprowadza zamknięcie za porozumieniem, gdy tylko to nastąpi, nawet przy wysokich opłatach; dopiero po trzech dniach bez kontaktu przechodzi do zamknięcia jednostronnego, i tylko dopóki opłaty są niskie.
- Odebranie środków z zakończonej odwrotnej wymiany submarine oznaczało jako odebrane wszystkie trwające wymiany, co uniemożliwiało odebranie pozostałych. Ich środki dawały się odzyskać po wygaśnięciu blokady czasowej i nigdy nie były zagrożone kradzieżą. Odbiór jest teraz zapisywany tylko przy tej wymianie, której dotyczy.

Pełne informacje o wydaniu projektu źródłowego: https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.3`,
    fr_FR: `Met à jour CLBOSS vers la version 0.16.3.

CLBOSS est le plugin qui gère automatiquement vos canaux. Cette version corrige trois problèmes de sécurité et de robustesse signalés et la mise à jour est recommandée :

- Lorsque plusieurs paiements étaient transférés en même temps vers un même canal épuisé, CLBOSS lançait un rééquilibrage complet pour chacun d'eux sur la base d'un budget de frais périmé. Les frais étaient payés à chaque fois, et le dépassement ainsi enregistré bloquait ensuite les rééquilibrages légitimes de ce canal. Un seul rééquilibrage par destination s'exécute désormais à la fois.
- Fermeture automatique, l'option facultative qui ferme les canaux que CLBOSS juge mauvais pour votre nœud, demandait une fermeture unilatérale au bout de trois minutes quel que soit l'état de connexion du pair. Or l'un des critères de ce jugement est justement la rareté des connexions du pair, si bien que les canaux ouverts avec ces pairs étaient fermés de force. CLBOSS vérifie maintenant toutes les dix minutes si le pair réapparaît et procède à une fermeture mutuelle dès que c'est le cas, même à frais élevés ; ce n'est qu'après trois jours sans contact qu'il se rabat sur une fermeture unilatérale, et seulement tant que les frais sont bas.
- La réclamation d'un swap submarine inversé terminé marquait comme réclamés tous les swaps en cours, ce qui empêchait de réclamer les autres. Leurs fonds étaient récupérables à l'expiration du verrou temporel et n'ont jamais été exposés à un vol. La réclamation n'est désormais enregistrée que pour le swap concerné.

Notes complètes du projet amont : https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.3`,
  },
  migrations: {},
})
