import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  return {
    bitcoind: {
      healthChecks: ['sync-progress', 'primary'],
      kind: 'running',
      versionRange: '>=29.3:0-beta.0',
    },
  }
})
