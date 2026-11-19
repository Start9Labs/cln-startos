import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:6',
  releaseNotes: {
    en_US:
      'The CLN UI now signs in with a generated password. Run the Create UI Password action to get yours; a password you already set keeps working.',
    es_ES:
      'La interfaz de CLN ahora inicia sesión con una contraseña generada. Ejecute la acción Crear contraseña de la interfaz para obtener la suya; una contraseña que ya haya establecido sigue funcionando.',
    de_DE:
      'Die CLN-Oberfläche meldet sich jetzt mit einem erzeugten Passwort an. Führen Sie die Aktion „UI-Passwort erstellen“ aus, um Ihres zu erhalten; ein bereits gesetztes Passwort funktioniert weiter.',
    pl_PL:
      'Interfejs CLN loguje teraz za pomocą wygenerowanego hasła. Uruchom akcję Utwórz hasło do interfejsu, aby je otrzymać; hasło ustawione wcześniej nadal działa.',
    fr_FR:
      "L'interface de CLN se connecte désormais avec un mot de passe généré. Exécutez l'action Créer le mot de passe de l'interface pour obtenir le vôtre ; un mot de passe déjà défini continue de fonctionner.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
