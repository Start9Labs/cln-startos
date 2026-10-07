import * as fs from 'fs/promises'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const deleteGossipStore = sdk.Action.withoutInput(
  // id
  'delete-gossip-store',

  // metadata
  async ({ effects }) => ({
    name: i18n('Delete Gossip Store'),
    description: i18n('Deletes gossip_store in the case of corruption'),
    warning: i18n(
      'Core Lightning forgets the network map it has gathered and rebuilds it from peers when it next starts, so payments may not find a route until it has.',
    ),
    allowedStatuses: 'only-stopped',
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await fs.rm('/media/startos/volumes/main//bitcoin/gossip_store', {
      recursive: true,
      force: true,
    })
    return {
      version: '1',
      title: i18n('Success'),
      message: i18n(
        'The gossip_store has been deleted. On the next service start Core Lightning will rebuild gossip_store from peers',
      ),
      result: null,
    }
  },
)
