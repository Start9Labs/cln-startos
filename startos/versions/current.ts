import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:4',
  releaseNotes: {
    en_US: `Stops Core Lightning reloading at the moment Bitcoin Core goes away.

Core Lightning reloads when Bitcoin Core issues new RPC credentials, which it does on every restart. That reload was previously triggered as soon as Bitcoin Core *began* shutting down — while its RPC was already unreachable — so Core Lightning was stopped and restarted into a backend that was not there yet. It now reloads only once Bitcoin Core is back up and has published new credentials.`,
    es_ES: `Evita que Core Lightning se recargue justo cuando Bitcoin Core desaparece.

Core Lightning se recarga cuando Bitcoin Core emite nuevas credenciales RPC, algo que hace en cada reinicio. Esa recarga se activaba en cuanto Bitcoin Core *empezaba* a apagarse — cuando su RPC ya era inalcanzable —, así que Core Lightning se detenía y arrancaba contra un backend que todavía no estaba. Ahora se recarga solo cuando Bitcoin Core ha vuelto y ha publicado nuevas credenciales.`,
    de_DE: `Verhindert, dass Core Lightning genau dann neu lädt, wenn Bitcoin Core verschwindet.

Core Lightning lädt neu, sobald Bitcoin Core neue RPC-Zugangsdaten ausgibt — was bei jedem Neustart geschieht. Dieses Neuladen wurde bisher ausgelöst, sobald Bitcoin Core mit dem Herunterfahren *begann* — während dessen RPC bereits nicht mehr erreichbar war. Core Lightning wurde also gestoppt und startete gegen ein Backend, das noch nicht da war. Es lädt jetzt erst neu, wenn Bitcoin Core wieder läuft und neue Zugangsdaten veröffentlicht hat.`,
    pl_PL: `Zapobiega przeładowaniu Core Lightning dokładnie w chwili, gdy znika Bitcoin Core.

Core Lightning przeładowuje się, gdy Bitcoin Core wydaje nowe dane uwierzytelniające RPC, co robi przy każdym restarcie. Dotąd to przeładowanie uruchamiało się, gdy tylko Bitcoin Core *zaczynał* się wyłączać — a jego RPC było już nieosiągalne — więc Core Lightning było zatrzymywane i startowało wobec backendu, którego jeszcze nie było. Teraz przeładowuje się dopiero wtedy, gdy Bitcoin Core wróci i opublikuje nowe dane uwierzytelniające.`,
    fr_FR: `Empêche Core Lightning de se recharger au moment précis où Bitcoin Core disparaît.

Core Lightning se recharge lorsque Bitcoin Core émet de nouveaux identifiants RPC, ce qu'il fait à chaque redémarrage. Ce rechargement était jusqu'ici déclenché dès que Bitcoin Core *commençait* à s'arrêter — alors que son RPC était déjà injoignable —, si bien que Core Lightning était arrêté puis redémarré face à un backend encore absent. Il ne se recharge désormais qu'une fois Bitcoin Core revenu et de nouveaux identifiants publiés.`,
  },
  migrations: {},
})
