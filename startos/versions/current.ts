import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:13',
  releaseNotes: {
    en_US: `Core Lightning now starts in offline mode: it accepts no incoming connections and does not reconnect to peers.

This is a precaution against a security issue reported by the Core Lightning developers. On-chain funds, channel state, and RPC access are unaffected, but you cannot send, receive, or forward payments while it is in effect, and a peer may force-close a channel whose HTLC expires in the meantime.

The next release will carry the upstream fix and restore normal operation.`,
    es_ES: `Core Lightning ahora se inicia en modo sin conexión: no acepta conexiones entrantes ni se reconecta a los pares.

Es una medida preventiva ante un problema de seguridad notificado por los desarrolladores de Core Lightning. Los fondos on-chain, el estado de los canales y el acceso RPC no se ven afectados, pero no puedes enviar, recibir ni reenviar pagos mientras esté vigente, y un par puede forzar el cierre de un canal cuyo HTLC expire entretanto.

La próxima versión incluirá la corrección del proyecto original y restablecerá el funcionamiento normal.`,
    de_DE: `Core Lightning startet jetzt im Offline-Modus: Es nimmt keine eingehenden Verbindungen an und verbindet sich nicht erneut mit Partnern.

Dies ist eine Vorsichtsmaßnahme wegen eines von den Core-Lightning-Entwicklern gemeldeten Sicherheitsproblems. On-Chain-Guthaben, Kanalzustand und RPC-Zugriff bleiben unberührt, aber Sie können in dieser Zeit keine Zahlungen senden, empfangen oder weiterleiten, und ein Partner kann einen Kanal zwangsweise schließen, dessen HTLC zwischenzeitlich abläuft.

Die nächste Version enthält die Korrektur des Upstream-Projekts und stellt den normalen Betrieb wieder her.`,
    pl_PL: `Core Lightning uruchamia się teraz w trybie offline: nie przyjmuje połączeń przychodzących i nie łączy się ponownie z węzłami partnerskimi.

To środek ostrożności w związku z problemem bezpieczeństwa zgłoszonym przez twórców Core Lightning. Środki on-chain, stan kanałów i dostęp RPC pozostają bez zmian, ale w tym czasie nie możesz wysyłać, odbierać ani przekazywać płatności, a węzeł partnerski może wymusić zamknięcie kanału, którego HTLC wygaśnie w międzyczasie.

Następne wydanie będzie zawierać poprawkę z projektu źródłowego i przywróci normalne działanie.`,
    fr_FR: `Core Lightning démarre désormais en mode hors ligne : il n'accepte aucune connexion entrante et ne se reconnecte à aucun pair.

Il s'agit d'une précaution face à un problème de sécurité signalé par les développeurs de Core Lightning. Les fonds on-chain, l'état des canaux et l'accès RPC ne sont pas affectés, mais vous ne pouvez ni envoyer, ni recevoir, ni transférer de paiements pendant ce temps, et un pair peut forcer la fermeture d'un canal dont le HTLC expire entre-temps.

La prochaine version intégrera le correctif du projet amont et rétablira le fonctionnement normal.`,
  },
  migrations: {},
})
