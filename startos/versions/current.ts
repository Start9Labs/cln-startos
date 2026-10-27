import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.9:7',
  releaseNotes: {
    en_US:
      'Create Rune asks what the rune may do: read-only, limited to restrictions you enter, or unrestricted.',
    es_ES:
      'Crear Rune pregunta qué puede hacer la runa: solo lectura, limitada a las restricciones que introduzca, o sin restricciones.',
    de_DE:
      '„Rune erstellen“ fragt, was die Rune darf: nur lesen, begrenzt auf von Ihnen eingegebene Einschränkungen, oder uneingeschränkt.',
    pl_PL:
      'Akcja „Utwórz Rune” pyta, co może robić runa: tylko odczyt, w granicach wprowadzonych przez ciebie ograniczeń albo bez ograniczeń.',
    fr_FR:
      '« Créer un Rune » demande ce que la rune peut faire : lecture seule, limitée aux restrictions que vous saisissez, ou sans restriction.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
