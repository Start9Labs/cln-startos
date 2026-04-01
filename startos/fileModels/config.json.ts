import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  unit: z.string().catch('SATS'),
  fiatUnit: z.string().catch('USD'),
  appMode: z.string().catch('DARK'),
  isLoading: z.boolean().catch(false),
  error: z.null().catch(null),
  singleSignOn: z.boolean().catch(false),
  password: z.string().optional().catch(''),
})

export const configJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: '/data/app/config.json' },
  shape,
)
