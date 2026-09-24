import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.8:2',
  releaseNotes: {
    en_US: `Updates Core Lightning to 26.06.8, a security release from the Core Lightning developers. Upgrade as soon as you can.

Fixes Core Lightning failing at startup and restarting repeatedly.

The bundled Bitcoin Core RPC client (\`bitcoin-cli\`) is updated to 31.1.

A failing Watchtowers or Custom External Host health check is now rechecked once a minute instead of every second.

Core Lightning release notes: https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
    es_ES: `Actualiza Core Lightning a 26.06.8, una versión de seguridad de los desarrolladores de Core Lightning. Actualiza cuanto antes.

Corrige el fallo de Core Lightning al iniciarse, que lo hacía reiniciarse una y otra vez.

Se actualizó el cliente RPC de Bitcoin Core incluido (\`bitcoin-cli\`) a la versión 31.1.

Una comprobación de salud de Watchtowers o de Host Externo Personalizado que falla ahora se vuelve a comprobar una vez por minuto en lugar de cada segundo.

Notas de la versión de Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
    de_DE: `Aktualisiert Core Lightning auf 26.06.8, eine Sicherheitsversion der Core-Lightning-Entwickler. Aktualisieren Sie so bald wie möglich.

Behebt einen Fehler, durch den Core Lightning beim Start abstürzte und sich wiederholt neu startete.

Der mitgelieferte Bitcoin-Core-RPC-Client (\`bitcoin-cli\`) wurde auf Version 31.1 aktualisiert.

Eine fehlschlagende Zustandsprüfung „Watchtower“ oder „Benutzerdefinierter externer Host“ wird jetzt einmal pro Minute statt jede Sekunde erneut ausgeführt.

Core-Lightning-Versionshinweise: https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
    pl_PL: `Aktualizuje Core Lightning do wersji 26.06.8, wydania zabezpieczeń od twórców Core Lightning. Zaktualizuj jak najszybciej.

Naprawia błąd, przez który Core Lightning kończył działanie przy uruchomieniu i uruchamiał się ponownie w pętli.

Dołączony klient RPC Bitcoin Core (\`bitcoin-cli\`) został zaktualizowany do wersji 31.1.

Nieudana kontrola stanu Watchtowery lub Niestandardowy host zewnętrzny jest teraz ponawiana raz na minutę zamiast co sekundę.

Informacje o wydaniu Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
    fr_FR: `Met à jour Core Lightning vers la version 26.06.8, une version de sécurité publiée par les développeurs de Core Lightning. Mettez à jour dès que possible.

Corrige l'échec de Core Lightning au démarrage, qui le faisait redémarrer en boucle.

Le client RPC Bitcoin Core inclus (\`bitcoin-cli\`) a été mis à jour vers la version 31.1.

Une vérification d'état Watchtowers ou Hôte externe personnalisé en échec est désormais relancée une fois par minute au lieu de chaque seconde.

Notes de version de Core Lightning : https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
  },
  migrations: {},
})
