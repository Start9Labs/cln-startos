import { resetPassword } from '../actions/resetPassword'
import { configJson } from '../fileModels/config.json'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { lockedUiPassword } from '../utils'

export const taskUiPassword = sdk.setupOnInit(async (effects) => {
  const isSet = await storeJson.read((s) => s.uiPasswordSet).const(effects)
  // cln-application lets any visitor set the first password, so an empty or missing one is never left in place.
  const hasPassword = !!(await configJson.read((c) => c.password).once())

  if (hasPassword) {
    if (isSet) return
    // Installs that predate the flag: a password already in place means the owner holds it.
    if (isSet === undefined) {
      await storeJson.merge(effects, { uiPasswordSet: true })
      return
    }
  } else {
    await configJson.merge(effects, { password: lockedUiPassword() })
  }

  await storeJson.merge(effects, { uiPasswordSet: false })
  await sdk.action.createOwnTask(effects, resetPassword, 'important', {
    reason: i18n('Create a password to sign in to the CLN UI'),
  })
})
