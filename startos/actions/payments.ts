import { T } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { cliJson, errorMessage, mainMounts, rootDir } from '../utils'

export const sats = (msat: number | undefined) =>
  msat === undefined ? '' : String(Math.floor(msat / 1000))

export const literal = (text: string) => text.replace(/\$/g, '$$$$')

export const row = (
  name: string,
  value: string,
  copyable: boolean,
  qr = false,
) => ({
  name,
  description: null,
  copyable,
  qr,
  launchable: false,
  masked: false,
  type: 'single' as const,
  value,
})

export type Decoded = {
  type: string
  valid: boolean
  currency?: string
  created_at?: number
  expiry?: number
  payee?: string
  amount_msat?: number
  description?: string
  description_hash?: string
  payment_hash?: string
}

export async function decodeInvoice(
  effects: T.Effects,
  invoice: string,
): Promise<Decoded> {
  return sdk.SubContainer.withTemp(
    effects,
    { imageId: 'lightning' },
    mainMounts,
    'decode-pay-invoice',
    async (subc) => {
      const decodeRes = await subc.exec([
        'lightning-cli',
        `--lightning-dir=${rootDir}`,
        'decode',
        invoice,
      ])
      const decoded =
        decodeRes.exitCode === 0 ? cliJson<Decoded>(decodeRes.stdout) : null
      if (decoded?.type?.startsWith('bolt12')) {
        throw new Error(
          i18n(
            'This is a BOLT12 offer or invoice. Decode Invoice and Pay Invoice take only BOLT11 invoices, which begin with lnbc.',
          ),
        )
      }
      if (!decoded?.valid || decoded.type !== 'bolt11 invoice') {
        throw new Error(
          i18n('The invoice could not be decoded: ${error}', {
            error: literal(errorMessage(decodeRes)),
          }),
        )
      }
      return decoded
    },
  )
}
