import { matches, FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const { object, string, boolean, literal } = matches

const shape = object({
  unit: string.onMismatch('SATS'),
  fiatUnit: string.onMismatch('USD'),
  appMode: string.onMismatch('DARK'),
  isLoading: boolean.onMismatch(false),
  error: literal(null).onMismatch(null),
  singleSignOn: boolean.onMismatch(false),
  password: string.optional().onMismatch(''),
})

export const configJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: '/data/app/config.json'},
  shape,
)
