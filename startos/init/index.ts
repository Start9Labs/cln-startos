import { sdk } from '../sdk'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../install/versionGraph'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { setupCerts } from './setupCerts'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  setInterfaces,
  setDependencies,
  actions,
  setupCerts,
)

export const uninit = sdk.setupUninit(versionGraph)
