import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:14',
  releaseNotes: {
    en_US: `Core Lightning starts in offline mode: it accepts no incoming connections and does not reconnect to peers.

This is a precaution against a security issue reported by the Core Lightning developers. On-chain funds, channel state, and RPC access are unaffected, but you cannot send, receive, or forward payments while it is in effect, and a peer may force-close a channel whose HTLC expires in the meantime. Offline mode stays in place until the release that carries the upstream fix.

This release also updates the TEOS watchtower to the latest upstream code, and fixes how this package registers the towers you subscribe to.

- A watchtower server that serves its API over TLS can now be added. Write it as \`<pubkey>@https://<host>:<port>\` in Watchtower Settings; a tower with no prefix is still reached over plain HTTP, as before.
- A tower entered without a port was registered and then abandoned again on every start, so it never stayed subscribed. Towers are now matched against what is already registered, whether or not you spell out the port or the scheme.

The rest of the upstream change is build and continuous-integration work with no effect here. Full upstream changes: https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
    es_ES: `Core Lightning se inicia en modo sin conexión: no acepta conexiones entrantes ni se reconecta a los pares.

Es una medida preventiva ante un problema de seguridad notificado por los desarrolladores de Core Lightning. Los fondos on-chain, el estado de los canales y el acceso RPC no se ven afectados, pero no puedes enviar, recibir ni reenviar pagos mientras esté vigente, y un par puede forzar el cierre de un canal cuyo HTLC expire entretanto. El modo sin conexión sigue vigente hasta la versión que incluya la corrección del proyecto original.

Esta versión también actualiza el watchtower TEOS al código más reciente del proyecto original y corrige la forma en que este paquete registra las torres a las que te suscribes.

- Ahora se puede añadir un servidor watchtower que ofrece su API sobre TLS. Escríbelo como \`<clave pública>@https://<host>:<puerto>\` en Ajustes de Watchtower; una torre sin prefijo se sigue alcanzando por HTTP sin cifrar, como hasta ahora.
- Una torre introducida sin puerto se registraba y volvía a abandonarse en cada arranque, por lo que nunca permanecía suscrita. Ahora las torres se comparan con las que ya están registradas, indiques o no el puerto y el esquema.

El resto del cambio del proyecto original es trabajo de compilación e integración continua, sin efecto aquí. Cambios completos del proyecto original: https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
    de_DE: `Core Lightning startet im Offline-Modus: Es nimmt keine eingehenden Verbindungen an und verbindet sich nicht erneut mit Partnern.

Dies ist eine Vorsichtsmaßnahme wegen eines von den Core-Lightning-Entwicklern gemeldeten Sicherheitsproblems. On-Chain-Guthaben, Kanalzustand und RPC-Zugriff bleiben unberührt, aber Sie können in dieser Zeit keine Zahlungen senden, empfangen oder weiterleiten, und ein Partner kann einen Kanal zwangsweise schließen, dessen HTLC zwischenzeitlich abläuft. Der Offline-Modus bleibt bestehen, bis eine Version die Korrektur des Upstream-Projekts enthält.

Diese Version aktualisiert außerdem den TEOS-Watchtower auf den neuesten Stand des Upstream-Projekts und korrigiert, wie dieses Paket die von Ihnen abonnierten Tower registriert.

- Ein Watchtower-Server, der seine API über TLS bereitstellt, lässt sich nun hinzufügen. Tragen Sie ihn in den Watchtower-Einstellungen als \`<öffentlicher Schlüssel>@https://<Host>:<Port>\` ein; ein Tower ohne Präfix wird weiterhin über unverschlüsseltes HTTP erreicht.
- Ein ohne Port eingetragener Tower wurde bei jedem Start registriert und anschließend wieder aufgegeben, blieb also nie abonniert. Tower werden jetzt mit den bereits registrierten abgeglichen, unabhängig davon, ob Sie Port und Schema ausschreiben.

Der übrige Upstream-Stand betrifft Build und Continuous Integration und wirkt sich hier nicht aus. Vollständige Änderungen des Upstream-Projekts: https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
    pl_PL: `Core Lightning uruchamia się w trybie offline: nie przyjmuje połączeń przychodzących i nie łączy się ponownie z węzłami partnerskimi.

To środek ostrożności w związku z problemem bezpieczeństwa zgłoszonym przez twórców Core Lightning. Środki on-chain, stan kanałów i dostęp RPC pozostają bez zmian, ale w tym czasie nie możesz wysyłać, odbierać ani przekazywać płatności, a węzeł partnerski może wymusić zamknięcie kanału, którego HTLC wygaśnie w międzyczasie. Tryb offline pozostaje włączony do czasu wydania wersji zawierającej poprawkę z projektu źródłowego.

Ta wersja aktualizuje również watchtower TEOS do najnowszego kodu projektu źródłowego i naprawia sposób, w jaki ten pakiet rejestruje wieże, które subskrybujesz.

- Można teraz dodać serwer watchtower udostępniający swoje API przez TLS. Wpisz go w Ustawieniach Watchtower jako \`<klucz publiczny>@https://<host>:<port>\`; wieża bez przedrostka nadal jest osiągana przez nieszyfrowane HTTP, tak jak dotychczas.
- Wieża wpisana bez portu była przy każdym uruchomieniu rejestrowana, a następnie ponownie porzucana, więc subskrypcja nigdy nie utrzymywała się. Wieże są teraz porównywane z już zarejestrowanymi, niezależnie od tego, czy podasz port i schemat.

Pozostała część zmian projektu źródłowego dotyczy budowania i ciągłej integracji i nie ma tu żadnego wpływu. Pełny zakres zmian projektu źródłowego: https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
    fr_FR: `Core Lightning démarre en mode hors ligne : il n'accepte aucune connexion entrante et ne se reconnecte à aucun pair.

Il s'agit d'une précaution face à un problème de sécurité signalé par les développeurs de Core Lightning. Les fonds on-chain, l'état des canaux et l'accès RPC ne sont pas affectés, mais vous ne pouvez ni envoyer, ni recevoir, ni transférer de paiements pendant ce temps, et un pair peut forcer la fermeture d'un canal dont le HTLC expire entre-temps. Le mode hors ligne reste actif jusqu'à la version qui apportera le correctif du projet amont.

Cette version met également à jour le watchtower TEOS vers le dernier code du projet amont et corrige la façon dont ce paquet enregistre les tours auxquelles vous vous abonnez.

- Une tour de surveillance qui expose son API en TLS peut désormais être ajoutée. Saisissez-la sous la forme \`<clé publique>@https://<hôte>:<port>\` dans les Paramètres Watchtower ; une tour sans préfixe reste jointe en HTTP non chiffré, comme auparavant.
- Une tour saisie sans port était enregistrée puis abandonnée à chaque démarrage, si bien que l'abonnement ne tenait jamais. Les tours sont maintenant comparées à celles déjà enregistrées, que vous précisiez ou non le port et le schéma.

Le reste des changements amont concerne la compilation et l'intégration continue et n'a aucun effet ici. Changements complets du projet amont : https://github.com/talaia-labs/rust-teos/compare/42db021...be344ec`,
  },
  migrations: {},
})
