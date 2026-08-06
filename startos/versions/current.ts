import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:8',
  releaseNotes: {
    en_US: `Lets the Watchtower Server address be offered on more of your network addresses.

The service did not declare that watchtower connections secure themselves — the tower's identity key is part of the address you hand out, and everything sent to it is encrypted — so StartOS restricted where that address could be served. It is now declared correctly, matching how the Peer address already works.`,
    es_ES: `Permite ofrecer la dirección del Servidor de Watchtower en más de tus direcciones de red.

El servicio no declaraba que las conexiones de watchtower se protegen por sí solas — la clave de identidad de la torre forma parte de la dirección que compartes y todo lo que se le envía va cifrado —, por lo que StartOS restringía dónde podía servirse esa dirección. Ahora se declara correctamente, igual que ya funciona la dirección Peer.`,
    de_DE: `Ermöglicht, die Adresse des Watchtower-Servers auf mehr Ihrer Netzwerkadressen anzubieten.

Der Dienst gab nicht an, dass Watchtower-Verbindungen sich selbst absichern — der Identitätsschlüssel des Towers ist Teil der Adresse, die Sie weitergeben, und alles, was an ihn gesendet wird, ist verschlüsselt. Deshalb schränkte StartOS ein, wo diese Adresse bereitgestellt werden konnte. Sie wird jetzt korrekt deklariert, genau wie bereits die Peer-Adresse.`,
    pl_PL: `Umożliwia udostępnianie adresu Serwera Watchtower na większej liczbie adresów sieciowych.

Usługa nie deklarowała, że połączenia watchtower zabezpieczają się same — klucz tożsamości wieży jest częścią udostępnianego adresu, a wszystko, co jest do niej wysyłane, jest szyfrowane — więc StartOS ograniczał, gdzie ten adres może być serwowany. Teraz jest deklarowany poprawnie, tak samo jak działa już adres Peer.`,
    fr_FR: `Permet de proposer l'adresse du serveur Watchtower sur davantage de vos adresses réseau.

Le service ne déclarait pas que les connexions watchtower se sécurisent elles-mêmes — la clé d'identité de la tour fait partie de l'adresse que vous partagez, et tout ce qui lui est envoyé est chiffré —, si bien que StartOS restreignait les endroits où cette adresse pouvait être servie. Elle est désormais déclarée correctement, comme l'est déjà l'adresse Peer.`,
  },
  migrations: {},
})
