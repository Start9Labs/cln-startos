import { configJson } from '../fileModels/config.json'
import { sdk } from '../sdk'

export const resetPassword = sdk.Action.withoutInput(
  // id
  'reset-password',

  // metadata
  async ({ effects }) => ({
    name: 'Reset UI Password',
    description: 'Reset UI Password in the event it is lost or forgotten',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await configJson.merge(effects, { password: '' })

    return {
      version: '1',
      title: 'Success',
      message: 'Launch the CLN UI to set a new password',
      result: null,
    }
  },
)
