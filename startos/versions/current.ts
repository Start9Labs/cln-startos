import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { clbossPlugin, xrebalancePlugin } from '../actions/config/plugins'
import { clnConfig } from '../fileModels/config'

export const current = VersionInfo.of({
  version: '26.6.10:9',
  releaseNotes: {
    en_US: `**Fixed**

- [Sling 4.3.2](https://github.com/daywalker90/sling/releases/tag/v4.3.2): \`sling-depleteuptoamount\` now defaults to 2,000,000 sats as documented. Jobs that set this value themselves are unaffected.
- CLBOSS pays a swap invoice only when it matches the swap it requested.
- The watchtower client keeps sending channel updates to its towers when a tower confirms the same update twice, without a restart of Core Lightning.
- If the CLN UI password is missing from its settings, the UI stays locked and a task asks you to create a new password.

**Changed**

- CLBOSS 0.17.3: CLBOSS now rebalances channels through the bundled xrebalance plugin, which loads and unloads together with CLBOSS, and prefers peers with a good earnings record when it opens channels. If CLBOSS has a swap in progress, let it finish before updating. See the release notes for [0.17.0](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.0) and [0.17.3](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.3).`,
    es_ES: `**Corregido**

- [Sling 4.3.2](https://github.com/daywalker90/sling/releases/tag/v4.3.2): \`sling-depleteuptoamount\` ahora tiene por defecto 2.000.000 sats, como indica la documentación. Los trabajos que fijan este valor ellos mismos no se ven afectados.
- CLBOSS solo paga una factura de swap cuando coincide con el swap que solicitó.
- El cliente de watchtower sigue enviando las actualizaciones de canal a sus torres cuando una torre confirma la misma actualización dos veces, sin necesidad de reiniciar Core Lightning.
- Si falta la contraseña de la interfaz de CLN en su configuración, la interfaz permanece bloqueada y una tarea le pide crear una nueva contraseña.

**Cambiado**

- CLBOSS 0.17.3: CLBOSS ahora reequilibra los canales a través del plugin xrebalance incluido, que se carga y se descarga junto con CLBOSS, y al abrir canales prefiere pares con un buen historial de ganancias. Si CLBOSS tiene un swap en curso, deje que termine antes de actualizar. Consulte las notas de la versión [0.17.0](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.0) y [0.17.3](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.3).`,
    de_DE: `**Behoben**

- [Sling 4.3.2](https://github.com/daywalker90/sling/releases/tag/v4.3.2): \`sling-depleteuptoamount\` hat jetzt wie dokumentiert den Standardwert 2.000.000 Sats. Jobs, die diesen Wert selbst setzen, sind nicht betroffen.
- CLBOSS bezahlt eine Swap-Rechnung nur, wenn sie zu dem angeforderten Swap passt.
- Der Watchtower-Client sendet Kanal-Updates weiter an seine Tower, wenn ein Tower dasselbe Update zweimal bestätigt, ohne dass Core Lightning neu gestartet werden muss.
- Fehlt das Passwort der CLN-Oberfläche in ihren Einstellungen, bleibt die Oberfläche gesperrt und eine Aufgabe fordert Sie auf, ein neues Passwort zu erstellen.

**Geändert**

- CLBOSS 0.17.3: CLBOSS gleicht Kanäle jetzt über das mitgelieferte Plugin xrebalance aus, das zusammen mit CLBOSS geladen und entladen wird, und bevorzugt beim Öffnen von Kanälen Peers mit guter Ertragsbilanz. Läuft bei CLBOSS gerade ein Swap, lassen Sie ihn vor dem Update abschließen. Siehe die Versionshinweise zu [0.17.0](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.0) und [0.17.3](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.3).`,
    pl_PL: `**Naprawiono**

- [Sling 4.3.2](https://github.com/daywalker90/sling/releases/tag/v4.3.2): \`sling-depleteuptoamount\` ma teraz domyślnie 2 000 000 satów, zgodnie z dokumentacją. Zadania, które same ustawiają tę wartość, nie są objęte zmianą.
- CLBOSS płaci fakturę swapu tylko wtedy, gdy pasuje ona do swapu, o który poprosił.
- Klient watchtower nadal wysyła aktualizacje kanałów do swoich wież, gdy wieża potwierdzi tę samą aktualizację dwa razy, bez ponownego uruchamiania Core Lightning.
- Jeśli w ustawieniach brakuje hasła interfejsu CLN, interfejs pozostaje zablokowany, a zadanie prosi o utworzenie nowego hasła.

**Zmieniono**

- CLBOSS 0.17.3: CLBOSS równoważy teraz kanały za pomocą dołączonej wtyczki xrebalance, która jest ładowana i wyładowywana razem z CLBOSS, a przy otwieraniu kanałów preferuje węzły z dobrą historią zarobków. Jeśli CLBOSS ma trwający swap, pozwól mu się zakończyć przed aktualizacją. Zobacz informacje o wydaniu [0.17.0](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.0) i [0.17.3](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.3).`,
    fr_FR: `**Corrigé**

- [Sling 4.3.2](https://github.com/daywalker90/sling/releases/tag/v4.3.2) : \`sling-depleteuptoamount\` vaut désormais par défaut 2 000 000 sats, comme documenté. Les tâches qui fixent elles-mêmes cette valeur ne sont pas concernées.
- CLBOSS ne paie une facture de swap que si elle correspond au swap qu'il a demandé.
- Le client watchtower continue d'envoyer les mises à jour de canal à ses tours lorsqu'une tour confirme deux fois la même mise à jour, sans redémarrer Core Lightning.
- Si le mot de passe de l'interface CLN manque dans ses paramètres, l'interface reste verrouillée et une tâche vous demande de créer un nouveau mot de passe.

**Modifié**

- CLBOSS 0.17.3 : CLBOSS rééquilibre désormais les canaux via le plugin xrebalance fourni, qui est chargé et déchargé avec CLBOSS, et privilégie les pairs ayant un bon historique de gains lorsqu'il ouvre des canaux. Si CLBOSS a un swap en cours, laissez-le se terminer avant de mettre à jour. Consultez les notes de version [0.17.0](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.0) et [0.17.3](https://github.com/ZmnSCPxj/clboss/releases/tag/v0.17.3).`,
  },
  migrations: {
    up: async ({ effects }) => {
      const raw = (await clnConfig.read().once())?.raw
      const plugins = (raw?.plugin || []).filter(
        (p): p is string => typeof p === 'string',
      )
      if (
        plugins.includes(clbossPlugin) &&
        !plugins.includes(xrebalancePlugin)
      ) {
        await clnConfig.merge(effects, {
          raw: { ...(raw ?? {}), plugin: [...plugins, xrebalancePlugin] },
        })
      }
    },
    down: IMPOSSIBLE,
  },
})
