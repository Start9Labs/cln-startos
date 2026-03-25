import { sdk } from '../sdk'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { setupCerts } from './setupCerts'
import { seedFiles } from './seedFiles'
import { watchHosts } from './watchHosts'

export const init = sdk.setupInit(
  restoreInit,
  seedFiles,
  versionGraph,
  setupCerts,
  setInterfaces,
  setDependencies,
  actions,
  watchHosts,
)

export const uninit = sdk.setupUninit(versionGraph)
