import {
  InputSpec,
  Value,
} from '@start9labs/start-sdk/base/lib/actions/input/builder'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const rescanBlockchainSpec = InputSpec.of({
  rescan: Value.number({
    name: i18n('Depth (or Blockheight if prefixed with a hyphen)'),
    description: i18n(
      'Depth expressed as a positive number or blockheight prefixed with a hyphen.',
    ),
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
    name: i18n('Rescan Blockchain'),
    description: i18n(
      "Rescan the blockchain from a specified height or depth. If rescanning from a specific blockheight, enter a negative number i.e. '-600000' to rescan from block 600,000 to the tip. Alternatively, you can enter a positive number as the depth i.e. '10000' to rescan the last 10,000 blocks from the tip",
    ),
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
      title: i18n('Success'),
      message: i18n(
        'If CLN is running it will be restarted now to begin the rescan. If CLN is stopped it will rescan the next time CLN is started',
      ),
      result: null,
    }
  },
)
