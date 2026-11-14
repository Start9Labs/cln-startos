import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:5',
  releaseNotes: {
    en_US:
      'Draft: optional Swap Controller plugin and scoped local pairing integration. Swap activation remains blocked pending stock-engine recovery validation. Ordinary CLN, its UI and native engine are unchanged. Updates the Start9 SDK to 4.1.0.',
  },
  migrations: { up: async () => {}, down: IMPOSSIBLE },
})
