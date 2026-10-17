import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.9:4',
  releaseNotes: {
    en_US: 'The Custom External Host health check runs once per start.',
    es_ES:
      'La comprobación de estado Host Externo Personalizado se ejecuta una vez por inicio.',
    de_DE:
      'Die Statusprüfung Benutzerdefinierter externer Host läuft einmal pro Start.',
    pl_PL:
      'Kontrola stanu Niestandardowy host zewnętrzny jest wykonywana raz przy każdym uruchomieniu.',
    fr_FR:
      'La vérification d’état Hôte externe personnalisé s’exécute une fois par démarrage.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
