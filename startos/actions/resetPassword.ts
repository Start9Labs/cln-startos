import { configJson } from '../fileModels/config.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const resetPassword = sdk.Action.withoutInput(
  // id
  'reset-password',

  // metadata
  async ({ effects }) => ({
    name: i18n('Reset UI Password'),
    description: i18n('Reset UI Password in the event it is lost or forgotten'),
    warning: (await configJson.read((c) => c.password).const(effects))
      ? i18n(
          'The current CLN UI password stops working, and whoever next opens the CLN UI sets a new one.',
        )
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    await configJson.merge(effects, { password: '' })

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n(
        'Open the CLN UI at its .local, IP, or .onion address to set a new password',
      ),
      result: null,
    }
  },
)
