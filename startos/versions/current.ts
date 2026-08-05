import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:8',
  releaseNotes: {
    en_US: `Makes restoring from a backup recover funds reliably.

A restored node starts with an empty wallet database, and previously nothing said so: the balance read zero until a blockchain rescan, the rescan could silently miss older wallet addresses, and a rescan or restore requested while Core Lightning was failing to start was silently forgotten. After a restore, StartOS now prompts you to run Rescan Blockchain, pre-registers the wallet's first 10,000 addresses so the rescan finds everything, preserves a snapshot of the channel-recovery file (emergency.recover) before the node can rewrite it, and holds rescan/restore requests until Core Lightning has actually started.

Also lets the Watchtower Server address be offered on more of your network addresses. The service did not declare that watchtower connections secure themselves — the tower's identity key is part of the address you hand out, and everything sent to it is encrypted — so StartOS restricted where that address could be served.`,
    es_ES: `Hace que restaurar desde una copia de seguridad recupere los fondos de forma fiable.

Un nodo restaurado arranca con una base de datos de cartera vacía, y antes nada lo indicaba: el saldo marcaba cero hasta reescanear la blockchain, el reescaneo podía omitir silenciosamente direcciones antiguas de la cartera, y una petición de reescaneo o restauración hecha mientras Core Lightning no conseguía arrancar se olvidaba sin aviso. Tras una restauración, StartOS ahora le pide ejecutar Reescanear Blockchain, prerregistra las primeras 10.000 direcciones de la cartera para que el reescaneo lo encuentre todo, conserva una instantánea del archivo de recuperación de canales (emergency.recover) antes de que el nodo pueda reescribirlo, y retiene las peticiones de reescaneo/restauración hasta que Core Lightning haya arrancado de verdad.

Además, permite ofrecer la dirección del Servidor de Watchtower en más de tus direcciones de red. El servicio no declaraba que las conexiones de watchtower se protegen por sí solas — la clave de identidad de la torre forma parte de la dirección que compartes y todo lo que se le envía va cifrado —, por lo que StartOS restringía dónde podía servirse esa dirección.`,
    de_DE: `Macht die Wiederherstellung aus einem Backup zuverlässig.

Ein wiederhergestellter Node startet mit einer leeren Wallet-Datenbank, und bisher wies nichts darauf hin: Das Guthaben zeigte bis zu einem Blockchain-Rescan null an, der Rescan konnte ältere Wallet-Adressen stillschweigend übersehen, und ein Rescan- oder Restore-Auftrag, der gestellt wurde, während Core Lightning nicht startete, ging stillschweigend verloren. Nach einer Wiederherstellung fordert StartOS Sie jetzt auf, Rescan Blockchain auszuführen, registriert die ersten 10.000 Wallet-Adressen vor, damit der Rescan alles findet, sichert einen Schnappschuss der Kanal-Wiederherstellungsdatei (emergency.recover), bevor der Node sie überschreiben kann, und hält Rescan-/Restore-Aufträge fest, bis Core Lightning tatsächlich gestartet ist.

Außerdem kann die Adresse des Watchtower-Servers jetzt auf mehr Ihrer Netzwerkadressen angeboten werden. Der Dienst gab nicht an, dass Watchtower-Verbindungen sich selbst absichern — der Identitätsschlüssel des Towers ist Teil der Adresse, die Sie weitergeben, und alles, was an ihn gesendet wird, ist verschlüsselt. Deshalb schränkte StartOS ein, wo diese Adresse bereitgestellt werden konnte.`,
    pl_PL: `Sprawia, że przywracanie z kopii zapasowej niezawodnie odzyskuje środki.

Przywrócony węzeł startuje z pustą bazą portfela, a wcześniej nic o tym nie informowało: saldo pokazywało zero aż do ponownego przeskanowania blockchaina, skan mógł po cichu pominąć starsze adresy portfela, a żądanie skanu lub przywrócenia złożone, gdy Core Lightning nie mógł wystartować, było po cichu zapominane. Po przywróceniu StartOS prosi teraz o uruchomienie Rescan Blockchain, wstępnie rejestruje pierwsze 10 000 adresów portfela, aby skan znalazł wszystko, zachowuje migawkę pliku odzyskiwania kanałów (emergency.recover), zanim węzeł zdąży go nadpisać, i przechowuje żądania skanu/przywrócenia, dopóki Core Lightning faktycznie nie wystartuje.

Ponadto adres Serwera Watchtower może być teraz udostępniany na większej liczbie adresów sieciowych. Usługa nie deklarowała, że połączenia watchtower zabezpieczają się same — klucz tożsamości wieży jest częścią udostępnianego adresu, a wszystko, co jest do niej wysyłane, jest szyfrowane — więc StartOS ograniczał, gdzie ten adres może być serwowany.`,
    fr_FR: `Rend la restauration depuis une sauvegarde fiable pour récupérer les fonds.

Un nœud restauré démarre avec une base de portefeuille vide, et rien ne le signalait auparavant : le solde affichait zéro jusqu'à un rescan de la blockchain, le rescan pouvait manquer silencieusement d'anciennes adresses du portefeuille, et une demande de rescan ou de restauration faite pendant que Core Lightning n'arrivait pas à démarrer était silencieusement oubliée. Après une restauration, StartOS vous invite désormais à lancer Rescan Blockchain, pré-enregistre les 10 000 premières adresses du portefeuille pour que le rescan trouve tout, conserve un instantané du fichier de récupération des canaux (emergency.recover) avant que le nœud ne puisse le réécrire, et retient les demandes de rescan/restauration jusqu'à ce que Core Lightning ait réellement démarré.

Par ailleurs, l'adresse du serveur Watchtower peut désormais être proposée sur davantage de vos adresses réseau. Le service ne déclarait pas que les connexions watchtower se sécurisent elles-mêmes — la clé d'identité de la tour fait partie de l'adresse que vous partagez, et tout ce qui lui est envoyé est chiffré —, si bien que StartOS restreignait les endroits où cette adresse pouvait être servie.`,
  },
  migrations: {},
})
