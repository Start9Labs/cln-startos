import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:6',
  releaseNotes: {
    en_US: `Fixes a bug that could disconnect Core Lightning from Bitcoin until a full Stop and Start.

Saving Core Lightning's settings could silently delete Bitcoin's RPC port from the generated configuration, leaving Core Lightning unable to reach Bitcoin and stuck in a crash loop that plain restarts never fixed. The port now survives every save, and Core Lightning re-checks Bitcoin's address each time it starts, so a broken configuration repairs itself.`,
    es_ES: `Corrige un error que podía desconectar Core Lightning de Bitcoin hasta hacer un Stop y Start completos.

Guardar la configuración de Core Lightning podía borrar silenciosamente el puerto RPC de Bitcoin del archivo de configuración generado, dejando a Core Lightning sin poder conectar con Bitcoin y atrapado en un bucle de fallos que los reinicios normales nunca arreglaban. Ahora el puerto sobrevive a cada guardado, y Core Lightning vuelve a comprobar la dirección de Bitcoin en cada arranque, de modo que una configuración rota se repara sola.`,
    de_DE: `Behebt einen Fehler, der Core Lightning bis zu einem vollständigen Stop und Start von Bitcoin trennen konnte.

Beim Speichern der Einstellungen von Core Lightning konnte der RPC-Port von Bitcoin stillschweigend aus der erzeugten Konfiguration gelöscht werden. Core Lightning erreichte Bitcoin dann nicht mehr und hing in einer Absturzschleife fest, die gewöhnliche Neustarts nie behoben. Der Port übersteht jetzt jedes Speichern, und Core Lightning prüft die Adresse von Bitcoin bei jedem Start erneut, sodass sich eine defekte Konfiguration selbst repariert.`,
    pl_PL: `Naprawia błąd, który mógł odłączyć Core Lightning od Bitcoina aż do pełnego zatrzymania i uruchomienia usługi.

Zapisanie ustawień Core Lightning mogło po cichu usunąć port RPC Bitcoina z wygenerowanej konfiguracji, przez co Core Lightning nie mógł połączyć się z Bitcoinem i tkwił w pętli awarii, której zwykłe restarty nigdy nie naprawiały. Port przetrwa teraz każdy zapis, a Core Lightning przy każdym starcie ponownie sprawdza adres Bitcoina, więc uszkodzona konfiguracja naprawia się sama.`,
    fr_FR: `Corrige un bogue qui pouvait déconnecter Core Lightning de Bitcoin jusqu'à un Stop puis Start complets.

Enregistrer les réglages de Core Lightning pouvait supprimer silencieusement le port RPC de Bitcoin du fichier de configuration généré, laissant Core Lightning incapable de joindre Bitcoin et bloqué dans une boucle de plantage que les redémarrages ordinaires ne corrigeaient jamais. Le port survit désormais à chaque enregistrement, et Core Lightning revérifie l'adresse de Bitcoin à chaque démarrage, de sorte qu'une configuration cassée se répare d'elle-même.`,
  },
  migrations: {},
})
