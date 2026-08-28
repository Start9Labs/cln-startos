import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.7:0',
  releaseNotes: {
    en_US: `Updates Core Lightning to 26.06.7, a security release from the Core Lightning developers. Upgrade as soon as you can.

Offline mode is removed. Your node accepts incoming connections and reconnects to peers again, and sending, receiving, and forwarding payments work as normal.

This release also updates the TEOS watchtower to the latest upstream code, with fixes to watchtower registration and to the CLNrest interface.

- A watchtower server that serves its API over TLS can now be added. Write it as \`<pubkey>@https://<host>:<port>\` in Watchtower Settings; a tower with no prefix is still reached over plain HTTP, as before.
- A tower entered without a port was registered and then abandoned again on every start, so it never stayed subscribed. Towers are now matched against what is already registered, whether or not you spell out the port or the scheme.
- Running Revoke Runes no longer removes the CLNrest interface while the replacement rune is minted, so anything connected to it is not disrupted.

Core Lightning release notes: https://github.com/ElementsProject/lightning/releases/tag/v26.06.7
Full watchtower changes: https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
    es_ES: `Actualiza Core Lightning a 26.06.7, una versión de seguridad de los desarrolladores de Core Lightning. Actualiza cuanto antes.

El modo sin conexión se ha eliminado. Tu nodo vuelve a aceptar conexiones entrantes y a reconectarse con los pares, y enviar, recibir y reenviar pagos funciona con normalidad.

Esta versión también actualiza el watchtower TEOS al código más reciente del proyecto original, con correcciones en el registro de torres y en la interfaz CLNrest.

- Ahora se puede añadir un servidor watchtower que ofrece su API sobre TLS. Escríbelo como \`<clave pública>@https://<host>:<puerto>\` en Ajustes de Watchtower; una torre sin prefijo se sigue alcanzando por HTTP sin cifrar, como hasta ahora.
- Una torre introducida sin puerto se registraba y volvía a abandonarse en cada arranque, por lo que nunca permanecía suscrita. Ahora las torres se comparan con las que ya están registradas, indiques o no el puerto y el esquema.
- Ejecutar Revocar runas ya no elimina la interfaz CLNrest mientras se genera la runa de reemplazo, así que nada de lo que esté conectado a ella se interrumpe.

Notas de la versión de Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.7
Cambios completos del watchtower: https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
    de_DE: `Aktualisiert Core Lightning auf 26.06.7, eine Sicherheitsversion der Core-Lightning-Entwickler. Aktualisieren Sie so bald wie möglich.

Der Offline-Modus wurde entfernt. Ihr Node nimmt wieder eingehende Verbindungen an und verbindet sich erneut mit Partnern; Zahlungen senden, empfangen und weiterleiten funktioniert wie gewohnt.

Diese Version aktualisiert außerdem den TEOS-Watchtower auf den neuesten Stand des Upstream-Projekts, mit Korrekturen an der Tower-Registrierung und an der CLNrest-Schnittstelle.

- Ein Watchtower-Server, der seine API über TLS bereitstellt, lässt sich nun hinzufügen. Tragen Sie ihn in den Watchtower-Einstellungen als \`<öffentlicher Schlüssel>@https://<Host>:<Port>\` ein; ein Tower ohne Präfix wird weiterhin über unverschlüsseltes HTTP erreicht.
- Ein ohne Port eingetragener Tower wurde bei jedem Start registriert und anschließend wieder aufgegeben, blieb also nie abonniert. Tower werden jetzt mit den bereits registrierten abgeglichen, unabhängig davon, ob Sie Port und Schema ausschreiben.
- „Runen widerrufen“ entfernt die CLNrest-Schnittstelle nicht mehr, während die Ersatz-Rune erzeugt wird, sodass damit verbundene Dienste nicht unterbrochen werden.

Core-Lightning-Versionshinweise: https://github.com/ElementsProject/lightning/releases/tag/v26.06.7
Vollständige Watchtower-Änderungen: https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
    pl_PL: `Aktualizuje Core Lightning do wersji 26.06.7, wydania zabezpieczeń od twórców Core Lightning. Zaktualizuj jak najszybciej.

Tryb offline został usunięty. Twój węzeł ponownie przyjmuje połączenia przychodzące i łączy się z węzłami partnerskimi, a wysyłanie, odbieranie i przekazywanie płatności działa normalnie.

To wydanie aktualizuje także watchtower TEOS do najnowszego kodu projektu źródłowego, z poprawkami rejestracji wież i interfejsu CLNrest.

- Można teraz dodać serwer watchtower udostępniający swoje API przez TLS. Wpisz go w Ustawieniach Watchtower jako \`<klucz publiczny>@https://<host>:<port>\`; wieża bez przedrostka nadal jest osiągana przez nieszyfrowane HTTP, tak jak dotychczas.
- Wieża wpisana bez portu była przy każdym uruchomieniu rejestrowana, a następnie ponownie porzucana, więc subskrypcja nigdy nie utrzymywała się. Wieże są teraz porównywane z już zarejestrowanymi, niezależnie od tego, czy podasz port i schemat.
- Uruchomienie „Unieważnij runy” nie usuwa już interfejsu CLNrest w trakcie tworzenia nowej runy, więc nic z nim połączonego nie zostaje przerwane.

Informacje o wydaniu Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.7
Pełny zakres zmian watchtowera: https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
    fr_FR: `Met à jour Core Lightning vers la version 26.06.7, une version de sécurité publiée par les développeurs de Core Lightning. Mettez à jour dès que possible.

Le mode hors ligne est supprimé. Votre nœud accepte de nouveau les connexions entrantes et se reconnecte aux pairs ; l'envoi, la réception et le transfert de paiements fonctionnent normalement.

Cette version met également à jour le watchtower TEOS vers le dernier code du projet amont, avec des correctifs pour l'enregistrement des tours et pour l'interface CLNrest.

- Une tour de surveillance qui expose son API en TLS peut désormais être ajoutée. Saisissez-la sous la forme \`<clé publique>@https://<hôte>:<port>\` dans les Paramètres Watchtower ; une tour sans préfixe reste jointe en HTTP non chiffré, comme auparavant.
- Une tour saisie sans port était enregistrée puis abandonnée à chaque démarrage, si bien que l'abonnement ne tenait jamais. Les tours sont maintenant comparées à celles déjà enregistrées, que vous précisiez ou non le port et le schéma.
- L'exécution de « Révoquer les runes » ne supprime plus l'interface CLNrest pendant la création de la rune de remplacement, de sorte que rien de ce qui y est connecté n'est interrompu.

Notes de version de Core Lightning : https://github.com/ElementsProject/lightning/releases/tag/v26.06.7
Changements complets du watchtower : https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
  },
  migrations: {},
})
