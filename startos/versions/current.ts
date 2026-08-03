import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:6',
  releaseNotes: {
    en_US: `Fixes a bug that could disconnect Core Lightning from Bitcoin and leave it in a crash loop that restarting the service did not fix.

Saving Core Lightning's settings could silently delete Bitcoin's RPC port from the generated configuration, leaving Core Lightning unable to reach Bitcoin. The port now survives every save, and Core Lightning re-checks Bitcoin's address each time it starts, so a broken configuration repairs itself.`,
    es_ES: `Corrige un error que podía desconectar Core Lightning de Bitcoin y dejarlo en un bucle de fallos que reiniciar el servicio no arreglaba.

Guardar la configuración de Core Lightning podía borrar silenciosamente el puerto RPC de Bitcoin del archivo de configuración generado, dejando a Core Lightning sin poder conectar con Bitcoin. Ahora el puerto sobrevive a cada guardado, y Core Lightning vuelve a comprobar la dirección de Bitcoin en cada arranque, de modo que una configuración rota se repara sola.`,
    de_DE: `Behebt einen Fehler, der Core Lightning von Bitcoin trennen und in einer Absturzschleife festhalten konnte, die ein Neustart des Dienstes nicht behob.

Beim Speichern der Einstellungen von Core Lightning konnte der RPC-Port von Bitcoin stillschweigend aus der erzeugten Konfiguration gelöscht werden. Core Lightning erreichte Bitcoin dann nicht mehr. Der Port übersteht jetzt jedes Speichern, und Core Lightning prüft die Adresse von Bitcoin bei jedem Start erneut, sodass sich eine defekte Konfiguration selbst repariert.`,
    pl_PL: `Naprawia błąd, który mógł odłączyć Core Lightning od Bitcoina i pozostawić go w pętli awarii, której restart usługi nie naprawiał.

Zapisanie ustawień Core Lightning mogło po cichu usunąć port RPC Bitcoina z wygenerowanej konfiguracji, przez co Core Lightning nie mógł połączyć się z Bitcoinem. Port przetrwa teraz każdy zapis, a Core Lightning przy każdym starcie ponownie sprawdza adres Bitcoina, więc uszkodzona konfiguracja naprawia się sama.`,
    fr_FR: `Corrige un bogue qui pouvait déconnecter Core Lightning de Bitcoin et le laisser dans une boucle de plantage que le redémarrage du service ne corrigeait pas.

Enregistrer les réglages de Core Lightning pouvait supprimer silencieusement le port RPC de Bitcoin du fichier de configuration généré, laissant Core Lightning incapable de joindre Bitcoin. Le port survit désormais à chaque enregistrement, et Core Lightning revérifie l'adresse de Bitcoin à chaque démarrage, de sorte qu'une configuration cassée se répare d'elle-même.`,
  },
  migrations: {},
})
