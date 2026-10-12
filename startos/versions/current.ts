import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.9:2',
  releaseNotes: {
    en_US: `- Restarting Core Lightning while it is still starting stops every process of the previous run.
- Fixes the web interface restarting several times a day, which left an open tab showing "Invalid CSRF token" until it was reloaded.`,
    es_ES: `- Reiniciar Core Lightning mientras aún se está iniciando detiene todos los procesos de la ejecución anterior.
- Corrige que la interfaz web se reinicie varias veces al día, lo que dejaba una pestaña abierta mostrando «Invalid CSRF token» hasta recargarla.`,
    de_DE: `- Ein Neustart von Core Lightning, während es noch startet, beendet alle Prozesse des vorherigen Laufs.
- Behebt, dass die Weboberfläche mehrmals am Tag neu startet, wodurch ein geöffneter Tab bis zum Neuladen „Invalid CSRF token“ anzeigt.`,
    pl_PL: `- Ponowne uruchomienie Core Lightning w trakcie uruchamiania zatrzymuje wszystkie procesy poprzedniego uruchomienia.
- Naprawia ponowne uruchamianie interfejsu webowego kilka razy dziennie, przez które otwarta karta pokazywała „Invalid CSRF token” aż do odświeżenia.`,
    fr_FR: `- Redémarrer Core Lightning pendant son démarrage arrête tous les processus de l'exécution précédente.
- Corrige les redémarrages de l'interface web plusieurs fois par jour, après lesquels un onglet ouvert affichait « Invalid CSRF token » jusqu'à son rechargement.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
