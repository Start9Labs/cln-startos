import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  return {
    bitcoind: {
      healthChecks: ['sync-progress', 'primary'],
      kind: 'running',
      versionRange: '29.1:1-beta.0',
    },
  }
})
