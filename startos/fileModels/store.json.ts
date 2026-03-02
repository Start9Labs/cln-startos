import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  rescan: z.number().optional().catch(undefined),
  watchtowerServer: z.boolean().catch(false),
  watchtowerClients: z.array(z.string()).catch([]),
  restore: z.boolean().optional().catch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: '/store.json' },
  shape,
)
