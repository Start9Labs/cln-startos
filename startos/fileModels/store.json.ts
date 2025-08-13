import { matches, FileHelper } from '@start9labs/start-sdk'

const { object, string, arrayOf, boolean, natural, literals, number } = matches

const shape = object({
  rescan: number.optional().onMismatch(undefined),
  watchtowerServer: boolean.optional().onMismatch(false),
  watchtowerClients: arrayOf(string).optional().onMismatch([]),
  'experimental-dual-fund': boolean.optional().onMismatch(false),
  'experimental-splicing': boolean.optional().onMismatch(false),
  'experimental-shutdown-wrong-funding': boolean.optional().onMismatch(false),
  // clboss startup options passed to lightningd
  clboss: object({
    'min-onchain': natural.optional().onMismatch(undefined),
    'auto-close': boolean.optional().onMismatch(undefined),
    zerobasefee: literals('default', 'required', 'allow', 'disallow')
      .optional()
      .onMismatch(undefined),
    'min-channel': natural.optional().onMismatch(undefined),
    'max-channel': natural.optional().onMismatch(undefined),
  })
    .optional()
    .onMismatch(undefined),
  restore: boolean.optional().onMismatch(undefined),
})

export const storeJson = FileHelper.json(
  {
    volumeId: 'main',
    subpath: '/store.json',
  },
  shape,
)
