import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  rescan: z.number().optional().catch(undefined),
  watchtowerServer: z.boolean().catch(false),
  watchtowerClients: z.array(z.string()).catch([]),
  watchtowerLabels: z
    .array(z.object({ id: z.string(), label: z.string() }))
    .catch([]),
  restore: z.boolean().optional().catch(undefined),
  customExternalHosts: z.array(z.string()).catch([]),
  // Verbatim: the companion's task compares it byte for byte.
  clearnetVpn: z
    .object({ config: z.string(), announce: z.string().nullable().catch(null) })
    .nullable()
    .catch(null),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: '/store.json' },
  shape,
)
