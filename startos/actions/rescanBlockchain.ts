import {
  InputSpec,
  Value,
} from '@start9labs/start-sdk/base/lib/actions/input/builder'
import { configJson } from '../fileModels/config.json'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

const rescanBlockchainSpec = InputSpec.of({
  rescan: Value.number({
    name: 'Depth (or Blockheight if prefixed with a hyphen)',
    description:
      'Depth expressed as a positive number or blockheight prefixed with a hyphen.',
    default: null,
    integer: true,
    required: true,
    placeholder: '-600000',
  }),
})

export const rescanBlockchain = sdk.Action.withInput(
  // id
  'rescan-blockchain',

  // metadata
  async ({ effects }) => ({
    name: 'Rescan Blockchain',
    description:
      "Rescan the blockchain from a specified height or depth. If rescanning from a specific blockheight, enter a negative number i.e. '-600000' to rescan from block 600,000 to the tip. Alternatively, you can enter a positive number as the depth i.e. '10000' to rescan the last 10,000 blocks from the tip",
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // Input Spec
  rescanBlockchainSpec,

  // Read
  async ({ effects }) => {},

  // the execution function
  async ({ effects, input }) => {
    await storeJson.merge(effects, { rescan: input.rescan })

    return {
      version: '1',
      title: 'Success',
      message:
        'If CLN is running it will be restarted now to begin the rescan. If CLN is stopped it will rescan the next time CLN is started',
      result: null,
    }
  },
)
