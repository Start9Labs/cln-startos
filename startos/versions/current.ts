import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:9',
  releaseNotes: {
    en_US:
      'The watchtower client keeps sending channel updates to its towers when a tower confirms the same update twice, without a restart of Core Lightning.',
    es_ES:
      'El cliente de watchtower sigue enviando las actualizaciones de canal a sus torres cuando una torre confirma la misma actualización dos veces, sin necesidad de reiniciar Core Lightning.',
    de_DE:
      'Der Watchtower-Client sendet Kanal-Updates weiter an seine Tower, wenn ein Tower dasselbe Update zweimal bestätigt, ohne dass Core Lightning neu gestartet werden muss.',
    pl_PL:
      'Klient watchtower nadal wysyła aktualizacje kanałów do swoich wież, gdy wieża potwierdzi tę samą aktualizację dwa razy, bez ponownego uruchamiania Core Lightning.',
    fr_FR:
      "Le client watchtower continue d'envoyer les mises à jour de canal à ses tours lorsqu'une tour confirme deux fois la même mise à jour, sans redémarrer Core Lightning.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
