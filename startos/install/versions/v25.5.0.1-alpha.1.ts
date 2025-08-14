import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v25_5_0_1_alpha1 = VersionInfo.of({
  version: '25.5.0:1-alpha.1',
  releaseNotes: 'Revamped for StartOS 0.4.0',
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
