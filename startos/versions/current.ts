import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:9',
  releaseNotes: {
    en_US: `**Fixed**

- Sling 4.3.2: \`sling-depleteuptoamount\` now defaults to 2,000,000 sats as documented. Jobs that set this value themselves are unaffected.
- The watchtower client keeps sending channel updates to its towers when a tower confirms the same update twice, without a restart of Core Lightning.

**Changed**

- CLBOSS 0.17.3. CLBOSS now rebalances channels through the bundled xrebalance plugin, which loads and unloads together with CLBOSS. If CLBOSS has a swap in progress, let it finish before updating.`,
    es_ES: `**Corregido**

- Sling 4.3.2: \`sling-depleteuptoamount\` ahora tiene por defecto 2.000.000 sats, como indica la documentación. Los trabajos que fijan este valor ellos mismos no se ven afectados.
- El cliente de watchtower sigue enviando las actualizaciones de canal a sus torres cuando una torre confirma la misma actualización dos veces, sin necesidad de reiniciar Core Lightning.

**Cambiado**

- CLBOSS 0.17.3. CLBOSS ahora reequilibra los canales a través del plugin xrebalance incluido, que se carga y se descarga junto con CLBOSS. Si CLBOSS tiene un swap en curso, deje que termine antes de actualizar.`,
    de_DE: `**Behoben**

- Sling 4.3.2: \`sling-depleteuptoamount\` hat jetzt wie dokumentiert den Standardwert 2.000.000 Sats. Jobs, die diesen Wert selbst setzen, sind nicht betroffen.
- Der Watchtower-Client sendet Kanal-Updates weiter an seine Tower, wenn ein Tower dasselbe Update zweimal bestätigt, ohne dass Core Lightning neu gestartet werden muss.

**Geändert**

- CLBOSS 0.17.3. CLBOSS gleicht Kanäle jetzt über das mitgelieferte Plugin xrebalance aus, das zusammen mit CLBOSS geladen und entladen wird. Läuft bei CLBOSS gerade ein Swap, lassen Sie ihn vor dem Update abschließen.`,
    pl_PL: `**Naprawiono**

- Sling 4.3.2: \`sling-depleteuptoamount\` ma teraz domyślnie 2 000 000 satów, zgodnie z dokumentacją. Zadania, które same ustawiają tę wartość, nie są objęte zmianą.
- Klient watchtower nadal wysyła aktualizacje kanałów do swoich wież, gdy wieża potwierdzi tę samą aktualizację dwa razy, bez ponownego uruchamiania Core Lightning.

**Zmieniono**

- CLBOSS 0.17.3. CLBOSS równoważy teraz kanały za pomocą dołączonej wtyczki xrebalance, która jest ładowana i wyładowywana razem z CLBOSS. Jeśli CLBOSS ma trwający swap, pozwól mu się zakończyć przed aktualizacją.`,
    fr_FR: `**Corrigé**

- Sling 4.3.2 : \`sling-depleteuptoamount\` vaut désormais par défaut 2 000 000 sats, comme documenté. Les tâches qui fixent elles-mêmes cette valeur ne sont pas concernées.
- Le client watchtower continue d'envoyer les mises à jour de canal à ses tours lorsqu'une tour confirme deux fois la même mise à jour, sans redémarrer Core Lightning.

**Modifié**

- CLBOSS 0.17.3. CLBOSS rééquilibre désormais les canaux via le plugin xrebalance fourni, qui est chargé et déchargé avec CLBOSS. Si CLBOSS a un swap en cours, laissez-le se terminer avant de mettre à jour.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
