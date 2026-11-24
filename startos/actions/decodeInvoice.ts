import { T } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { decodeInvoice, multilineRow, row } from './payments'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  invoice: Value.text({
    name: i18n('Invoice'),
    description: i18n('A Lightning invoice.'),
    required: true,
    default: null,
    placeholder: 'lnbc…',
  }),
})

const networks: Record<string, string> = {
  bc: 'mainnet',
  tb: 'testnet',
  tbs: 'signet',
  bcrt: 'regtest',
}

// Valid BOLT11 expiries can exceed JavaScript's calendar range.
const utc = (unix: number) => {
  const date = new Date(unix * 1000)
  return Number.isNaN(date.getTime())
    ? i18n('Beyond the supported calendar range')
    : date.toISOString().replace('T', ' ').replace('.000Z', ' UTC')
}

export const decodeInvoiceAction = sdk.Action.withInput(
  'decode-invoice',
  async ({ effects }) => ({
    name: i18n('Decode Invoice'),
    description: i18n(
      'Show what a Lightning invoice asks for before you pay it. Nothing is paid.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Payments'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => ({}),
  async ({ effects, input }): Promise<T.ActionResult & { version: '1' }> => {
    const decoded = await decodeInvoice(effects, input.invoice.trim())
    const created = decoded.created_at ?? 0
    const expires = created + (decoded.expiry ?? 3600)
    return {
      version: '1' as const,
      title: i18n('Invoice decoded'),
      message:
        expires * 1000 < Date.now()
          ? i18n('This invoice expired on ${date}. It can no longer be paid.', {
              date: utc(expires),
            })
          : i18n('Nothing has been paid. Check these details before you pay.'),
      result: {
        type: 'group' as const,
        value: [
          row(
            i18n('Amount'),
            decoded.amount_msat === undefined
              ? i18n('Amountless: you enter the amount when you pay')
              : `${decoded.amount_msat / 1000} sats`,
            false,
          ),
          row(i18n('Destination'), decoded.payee ?? '-', true),
          decoded.description !== undefined || !decoded.description_hash
            ? multilineRow(i18n('Description'), decoded.description || '-')
            : row(i18n('Description hash'), decoded.description_hash, true),
          row(i18n('Created'), utc(created), false),
          row(i18n('Expires'), utc(expires), false),
          row(
            i18n('Network'),
            networks[decoded.currency ?? ''] ?? decoded.currency ?? '-',
            false,
          ),
          row(i18n('Payment hash'), decoded.payment_hash ?? '-', true),
        ],
      },
    }
  },
)
