import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.1:2',
  releaseNotes: {
    en_US: `**Fixes**

- The Synced health check now reports the real error from lightningd when \`getinfo\` fails, instead of failing with "Unexpected end of JSON input"`,
    es_ES: `**Correcciones**

- La comprobación de salud «Synced» ahora informa del error real de lightningd cuando \`getinfo\` falla, en lugar de fallar con «Unexpected end of JSON input»`,
    de_DE: `**Fehlerbehebungen**

- Die Gesundheitsprüfung „Synced" meldet jetzt den tatsächlichen Fehler von lightningd, wenn \`getinfo\` fehlschlägt, statt mit „Unexpected end of JSON input" zu scheitern`,
    pl_PL: `**Poprawki**

- Kontrola stanu „Synced" zgłasza teraz rzeczywisty błąd lightningd, gdy \`getinfo\` się nie powiedzie, zamiast kończyć się błędem „Unexpected end of JSON input"`,
    fr_FR: `**Corrections**

- Le contrôle de santé « Synced » signale désormais l'erreur réelle de lightningd lorsque \`getinfo\` échoue, au lieu d'échouer avec « Unexpected end of JSON input »`,
  },
  // No migration for this bump. The 26.6.1:1 migration (gRPC cert reset +
  // legacy config.yaml import) lives in v26.6.1.1.ts and must NOT re-run on
  // 26.6.1:1 -> 26.6.1:2 updates — it would delete the regenerated cln-grpc
  // certs and break existing gRPC client pairings (e.g. Alby Hub).
  migrations: {},
})
