import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:9',
  releaseNotes: {
    en_US: `Adds a **Revoke All Runes** action.

Runes are the credential apps use to authenticate to your node, and until now there was no way to take one back. The new action blacklists every rune this node has issued, so none of them work again; re-issue the ones you still need with Create Rune.

Run it if a rune may have been copied or exposed — or if an app with RPC access to your node may have created one without your knowledge. That applies if you run BTCPay Server, which reaches Core Lightning over its admin RPC socket and shipped an actively exploited vulnerability in versions before 2.4.2.`,
    es_ES: `Añade una acción **Revocar todas las runas**.

Las runas son la credencial con la que las aplicaciones se autentican ante tu nodo, y hasta ahora no había forma de retirar ninguna. La nueva acción incluye en la lista negra todas las runas emitidas por este nodo, de modo que ninguna vuelve a funcionar; vuelve a emitir las que sigas necesitando con «Crear runa».

Ejecútala si alguna runa pudo ser copiada o quedar expuesta, o si una aplicación con acceso RPC a tu nodo pudo crear una sin que lo supieras. Es el caso si usas BTCPay Server, que se comunica con Core Lightning por su socket RPC de administración y tuvo una vulnerabilidad explotada activamente en las versiones anteriores a la 2.4.2.`,
    de_DE: `Fügt eine Aktion **Alle Runes widerrufen** hinzu.

Runes sind die Zugangsdaten, mit denen sich Apps bei Ihrem Node authentifizieren, und bisher gab es keine Möglichkeit, eine zurückzuziehen. Die neue Aktion setzt jede von diesem Node ausgestellte Rune auf die Blacklist, sodass keine mehr funktioniert; stellen Sie die weiterhin benötigten mit „Rune erstellen“ neu aus.

Führen Sie sie aus, wenn eine Rune kopiert oder offengelegt worden sein könnte — oder wenn eine App mit RPC-Zugriff auf Ihren Node ohne Ihr Wissen eine erstellt haben könnte. Das betrifft Sie, wenn Sie BTCPay Server betreiben, das Core Lightning über dessen Admin-RPC-Socket erreicht und in Versionen vor 2.4.2 eine aktiv ausgenutzte Sicherheitslücke hatte.`,
    pl_PL: `Dodaje akcję **Unieważnij wszystkie runy**.

Runy to poświadczenia, którymi aplikacje uwierzytelniają się w twoim węźle, a do tej pory nie było sposobu, aby którąś wycofać. Nowa akcja umieszcza na czarnej liście każdą runę wydaną przez ten węzeł, więc żadna nie działa ponownie; te, których nadal potrzebujesz, wydaj na nowo akcją „Utwórz runę”.

Uruchom ją, jeśli któraś runa mogła zostać skopiowana lub ujawniona — albo jeśli aplikacja z dostępem RPC do twojego węzła mogła utworzyć runę bez twojej wiedzy. Dotyczy to sytuacji, gdy korzystasz z BTCPay Server, który łączy się z Core Lightning przez jego administracyjne gniazdo RPC i w wersjach starszych niż 2.4.2 zawierał aktywnie wykorzystywaną lukę.`,
    fr_FR: `Ajoute une action **Révoquer toutes les runes**.

Les runes sont l'identifiant avec lequel les applications s'authentifient auprès de votre nœud, et jusqu'ici rien ne permettait d'en retirer une. La nouvelle action met sur liste noire toutes les runes émises par ce nœud, si bien qu'aucune ne fonctionne plus ; réémettez celles dont vous avez encore besoin avec « Créer une rune ».

Lancez-la si une rune a pu être copiée ou exposée — ou si une application disposant d'un accès RPC à votre nœud a pu en créer une à votre insu. C'est le cas si vous utilisez BTCPay Server, qui atteint Core Lightning via son socket RPC d'administration et présentait une vulnérabilité activement exploitée dans les versions antérieures à 2.4.2.`,
  },
  migrations: {},
})
