import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:12',
  releaseNotes: {
    en_US: `**Fixed**

- Decode Invoice and Pay Invoice say plainly when the text entered is not a Lightning invoice.`,
    es_ES: `**Corregido**

- Decodificar factura y Pagar factura indican claramente cuando el texto introducido no es una factura Lightning.`,
    de_DE: `**Behoben**

- Rechnung dekodieren und Rechnung bezahlen weisen klar darauf hin, wenn der eingegebene Text keine Lightning-Rechnung ist.`,
    pl_PL: `**Naprawiono**

- Dekoduj fakturę i Zapłać fakturę jasno informują, gdy wprowadzony tekst nie jest fakturą Lightning.`,
    fr_FR: `**Corrigé**

- Décoder une facture et Payer une facture indiquent clairement quand le texte saisi n’est pas une facture Lightning.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
