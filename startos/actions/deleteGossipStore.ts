import { sdk } from '../sdk'
import { rootDir } from '../utils'
import * as fs from 'fs/promises'

export const deleteGossipStore = sdk.Action.withoutInput(
  // id
  'delete-gossip-store',

  // metadata
  async ({ effects }) => ({
    name: 'Delete Gossip Store',
    description: 'Deletes gossip_store in the case of corruption',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await fs.rm(`${rootDir}/bitcoin/gossip_store`, {
      recursive: true,
    })

    await sdk.restart(effects)

    return {
      version: '1',
      title: 'Success',
      message: `The gossip_store has been deleted. On the next service start Core Lightning will rebuild gossip_store from peers`,
      result: null,
    }
  },
)
