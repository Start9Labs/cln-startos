import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  return {
    bitcoind: {
      healthChecks: ['sync-progress', 'primary'],
      kind: 'running',
      versionRange: '>=28.3:5-beta.1',
    },
  }
})
