import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  return {
    bitcoind: {
      healthChecks: ['bitcoind', 'sync-progress'],
      kind: 'running',
      versionRange: '>=28.3:5-beta.1',
    },
  }
})
