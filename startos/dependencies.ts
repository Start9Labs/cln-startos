import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  return {
    bitcoind: {
      healthChecks: ['sync-progress', 'primary'],
      kind: 'running',
      versionRange: '>=28.1:3-alpha.8',
    },
  }
})
