import { utils } from '@start9labs/start-sdk'
import { configJson } from '../fileModels/config.json'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { hashUiPassword } from '../utils'

export const resetPassword = sdk.Action.withoutInput(
  // id
  'reset-password',

  // metadata
  async ({ effects }) => {
    const isSet = await storeJson.read((s) => s.uiPasswordSet).const(effects)
    return {
      name: isSet ? i18n('Reset UI Password') : i18n('Create UI Password'),
      description: isSet
        ? i18n('Generate a new password for the CLN UI')
        : i18n('Generate the password for the CLN UI'),
      warning: isSet
        ? i18n(
            'Replaces the current CLN UI password. Browsers already signed in stay signed in until Core Lightning restarts.',
          )
        : null,
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  // the execution function
  async ({ effects }) => {
    const password = utils.getDefaultString({
      charset: 'a-z,A-Z,1-9,!,@,$,%,&,*',
      len: 22,
    })
    await configJson.merge(effects, {
      password: await hashUiPassword(password),
    })
    await storeJson.merge(effects, { uiPasswordSet: true })

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n(
        'Your CLN UI password is below. Save it to a password manager.',
      ),
      result: {
        type: 'single',
        value: password,
        masked: true,
        copyable: true,
        qr: false,
        launchable: false,
      },
    }
  },
)
