import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:11',
  releaseNotes: {
    en_US: `Updates CLBOSS to 0.16.2 and Sling to 4.3.1.

CLBOSS 0.16.2 is a security release and upgrading is recommended. CLBOSS is the plugin that manages your channels automatically; when it moved funds between your own channels, it accepted the returning payment after matching only the payment hash and secret, never the amount. The last peer in the loop could therefore pay back less than it owed, learn the secret, and still claim the full amount from you. CLBOSS now requires the exact amount before releasing the secret.

Sling, the channel rebalancing plugin, gets a batch of fixes: it now validates the amount in its HTLC hook, no longer shuts itself down when a background task fails, deletes stat files when \`sling-deletejob\` is asked to, and detects the node's available RPC methods more reliably.

Full upstream notes:

- https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.2
- https://github.com/daywalker90/sling/releases/tag/v4.3.1`,
    es_ES: `Actualiza CLBOSS a la versión 0.16.2 y Sling a la 4.3.1.

CLBOSS 0.16.2 es una versión de seguridad y se recomienda actualizar. CLBOSS es el complemento que gestiona tus canales automáticamente; al mover fondos entre tus propios canales, aceptaba el pago de vuelta comprobando solo el hash y el secreto del pago, nunca el importe. Por tanto, el último par del circuito podía devolver menos de lo que debía, conocer el secreto y aun así reclamarte el importe completo. Ahora CLBOSS exige el importe exacto antes de revelar el secreto.

Sling, el complemento de reequilibrio de canales, recibe un conjunto de correcciones: ahora valida el importe en su gancho HTLC, ya no se cierra cuando falla una tarea en segundo plano, elimina los archivos de estadísticas cuando se le pide con \`sling-deletejob\` y detecta con más fiabilidad los métodos RPC disponibles en el nodo.

Notas completas de los proyectos originales:

- https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.2
- https://github.com/daywalker90/sling/releases/tag/v4.3.1`,
    de_DE: `Aktualisiert CLBOSS auf 0.16.2 und Sling auf 4.3.1.

CLBOSS 0.16.2 ist eine Sicherheitsversion, ein Update wird empfohlen. CLBOSS ist das Plugin, das Ihre Kanäle automatisch verwaltet; beim Verschieben von Guthaben zwischen Ihren eigenen Kanälen akzeptierte es die zurückkommende Zahlung, nachdem nur Zahlungs-Hash und Zahlungsgeheimnis geprüft wurden, nie der Betrag. Der letzte Partner im Kreis konnte daher weniger zurückzahlen als geschuldet, das Geheimnis erfahren und trotzdem den vollen Betrag von Ihnen einfordern. CLBOSS verlangt nun den genauen Betrag, bevor es das Geheimnis freigibt.

Sling, das Plugin für den Kanalausgleich, erhält mehrere Korrekturen: Es prüft jetzt den Betrag in seinem HTLC-Hook, beendet sich nicht mehr, wenn eine Hintergrundaufgabe fehlschlägt, löscht Statistikdateien, wenn \`sling-deletejob\` dies verlangt, und erkennt die verfügbaren RPC-Methoden der Node zuverlässiger.

Vollständige Hinweise der Upstream-Projekte:

- https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.2
- https://github.com/daywalker90/sling/releases/tag/v4.3.1`,
    pl_PL: `Aktualizuje CLBOSS do wersji 0.16.2 oraz Sling do 4.3.1.

CLBOSS 0.16.2 to wydanie bezpieczeństwa i zalecana jest aktualizacja. CLBOSS to wtyczka, która automatycznie zarządza twoimi kanałami; przy przenoszeniu środków między twoimi własnymi kanałami przyjmowała powracającą płatność po sprawdzeniu wyłącznie skrótu i sekretu płatności, nigdy kwoty. Ostatni węzeł w pętli mógł więc oddać mniej, niż był winien, poznać sekret i wciąż zażądać od ciebie pełnej kwoty. CLBOSS wymaga teraz dokładnej kwoty przed ujawnieniem sekretu.

Sling, wtyczka do równoważenia kanałów, otrzymuje zestaw poprawek: sprawdza teraz kwotę w swoim zaczepie HTLC, nie zamyka się już, gdy zadanie w tle zakończy się błędem, usuwa pliki statystyk, gdy zażąda tego \`sling-deletejob\`, oraz pewniej rozpoznaje metody RPC dostępne w węźle.

Pełne informacje o wydaniach:

- https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.2
- https://github.com/daywalker90/sling/releases/tag/v4.3.1`,
    fr_FR: `Met à jour CLBOSS vers la version 0.16.2 et Sling vers la 4.3.1.

CLBOSS 0.16.2 est une version de sécurité et la mise à jour est recommandée. CLBOSS est le plugin qui gère automatiquement vos canaux ; lorsqu'il déplaçait des fonds entre vos propres canaux, il acceptait le paiement de retour après avoir vérifié seulement le hachage et le secret du paiement, jamais le montant. Le dernier pair de la boucle pouvait donc rendre moins qu'il ne devait, apprendre le secret et vous réclamer malgré tout le montant complet. CLBOSS exige désormais le montant exact avant de révéler le secret.

Sling, le plugin de rééquilibrage des canaux, reçoit une série de correctifs : il valide maintenant le montant dans son hook HTLC, ne s'arrête plus lorsqu'une tâche de fond échoue, supprime les fichiers de statistiques lorsque \`sling-deletejob\` le demande, et détecte plus fiablement les méthodes RPC disponibles sur le nœud.

Notes complètes des projets amont :

- https://github.com/ZmnSCPxj/clboss/releases/tag/v0.16.2
- https://github.com/daywalker90/sling/releases/tag/v4.3.1`,
  },
  migrations: {},
})
