import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:4',
  releaseNotes: {
    en_US: `Stops Core Lightning reloading at the moment Bitcoin goes away.

Core Lightning reloads when Bitcoin issues new RPC credentials, which it does on every restart. That reload was previously triggered as soon as Bitcoin *began* shutting down — while its RPC was already unreachable — so Core Lightning was stopped and restarted into a backend that was not there yet. It now reloads only once Bitcoin is back up and has published new credentials.`,
    es_ES: `Evita que Core Lightning se recargue justo cuando Bitcoin desaparece.

Core Lightning se recarga cuando Bitcoin emite nuevas credenciales RPC, algo que hace en cada reinicio. Esa recarga se activaba en cuanto Bitcoin *empezaba* a apagarse — cuando su RPC ya era inalcanzable —, así que Core Lightning se detenía y arrancaba contra un backend que todavía no estaba. Ahora se recarga solo cuando Bitcoin ha vuelto y ha publicado nuevas credenciales.`,
    de_DE: `Verhindert, dass Core Lightning genau dann neu lädt, wenn Bitcoin verschwindet.

Core Lightning lädt neu, sobald Bitcoin neue RPC-Zugangsdaten ausgibt — was bei jedem Neustart geschieht. Dieses Neuladen wurde bisher ausgelöst, sobald Bitcoin mit dem Herunterfahren *begann* — während dessen RPC bereits nicht mehr erreichbar war. Core Lightning wurde also gestoppt und startete gegen ein Backend, das noch nicht da war. Es lädt jetzt erst neu, wenn Bitcoin wieder läuft und neue Zugangsdaten veröffentlicht hat.`,
    pl_PL: `Zapobiega przeładowaniu Core Lightning dokładnie w chwili, gdy znika Bitcoin.

Core Lightning przeładowuje się, gdy Bitcoin wydaje nowe dane uwierzytelniające RPC, co robi przy każdym restarcie. Dotąd to przeładowanie uruchamiało się, gdy tylko Bitcoin *zaczynał* się wyłączać — a jego RPC było już nieosiągalne — więc Core Lightning było zatrzymywane i startowało wobec backendu, którego jeszcze nie było. Teraz przeładowuje się dopiero wtedy, gdy Bitcoin wróci i opublikuje nowe dane uwierzytelniające.`,
    fr_FR: `Empêche Core Lightning de se recharger au moment précis où Bitcoin disparaît.

Core Lightning se recharge lorsque Bitcoin émet de nouveaux identifiants RPC, ce qu'il fait à chaque redémarrage. Ce rechargement était jusqu'ici déclenché dès que Bitcoin *commençait* à s'arrêter — alors que son RPC était déjà injoignable —, si bien que Core Lightning était arrêté puis redémarré face à un backend encore absent. Il ne se recharge désormais qu'une fois Bitcoin revenu et de nouveaux identifiants publiés.`,
  },
  migrations: {},
})
