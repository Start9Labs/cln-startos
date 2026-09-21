import { T } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'
import { cliJson, errorMessage, literal, row, sats } from './payments'

const { InputSpec, Value, Variants } = sdk

const cli = ['lightning-cli', `--lightning-dir=${rootDir}`]

type Decoded = {
  type: string
  valid: boolean
  payee?: string
  amount_msat?: number
  description?: string
}

type ReviewedInvoice = { invoice: string; decoded: Decoded }
const reviewedInvoices = new Map<string, ReviewedInvoice>()

async function decodeInvoice(
  effects: T.Effects,
  invoice: string,
): Promise<Decoded> {
  return sdk.SubContainer.withTemp(
    effects,
    { imageId: 'lightning' },
    mainMounts,
    'decode-pay-invoice',
    async (subc) => {
      const decodeRes = await subc.exec([...cli, 'decode', invoice])
      const decoded =
        decodeRes.exitCode === 0 ? cliJson<Decoded>(decodeRes.stdout) : null
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

const inputSpec = async ({
  effects,
  prefill,
}: {
  effects: T.Effects
  prefill: unknown | null
}) => {
  const invoice =
    typeof (prefill as { invoice?: unknown } | null)?.invoice === 'string'
      ? (prefill as { invoice: string }).invoice.trim()
      : null
  const decoded = invoice ? await decodeInvoice(effects, invoice) : null
  if (invoice && decoded && effects.eventId) {
    reviewedInvoices.set(effects.eventId, { invoice, decoded })
  }
  const details = decoded
    ? decoded.amount_msat === undefined
      ? i18n('Amountless invoice to ${destination}; enter the amount below.', {
          destination: decoded.payee ?? '-',
        })
      : i18n('Invoice details: ${amount} sats to ${destination}.', {
          amount: sats(decoded.amount_msat),
          destination: decoded.payee ?? '-',
        })
    : i18n('A Lightning invoice.')
  const description = decoded
    ? `${details} ${i18n('Description')}: ${decoded.description || '-'}`
    : details

  return InputSpec.of({
    invoice: Value.text({
      name: i18n('Invoice'),
      description,
      required: true,
      default: null,
      placeholder: 'lnbc…',
      immutable: true,
    }),
    amount: Value.union({
      name: i18n('Amount'),
      description: i18n(
        'Most invoices state their amount; enter one only when the invoice leaves it open.',
      ),
      default: 'invoice',
      variants: Variants.of({
        invoice: {
          name: i18n('As stated in the invoice'),
          spec: InputSpec.of({}),
        },
        custom: {
          name: i18n('Enter an amount'),
          spec: InputSpec.of({
            sats: Value.number({
              name: i18n('Amount to pay'),
              description: null,
              required: true,
              default: null,
              min: 1,
              integer: true,
              units: 'sats',
              placeholder: null,
            }),
          }),
        },
      }),
    }),
    'max-fee-percent': Value.number({
      name: i18n('Maximum fee'),
      description: i18n(
        'The most this node may pay in routing fees, as a percentage of the amount.',
      ),
      required: true,
      default: 1,
      min: 0,
      max: 100,
      step: 0.1,
      integer: false,
      units: '%',
      placeholder: null,
    }),
    confirmed: Value.toggle({
      name: i18n('I verified the amount and destination'),
      description: i18n(
        'Confirm these details before sending. Lightning payments cannot be reversed.',
      ),
      default: false,
    }),
  })
}

type PayResult = {
  status: 'complete' | 'pending' | 'failed'
  payment_preimage?: string
  destination?: string
  amount_msat?: number
  amount_sent_msat?: number
}

export const payInvoice = sdk.Action.withInput(
  'pay-invoice',
  async ({ effects }) => ({
    name: i18n('Pay Invoice'),
    description: i18n('Pay a Lightning invoice from this node.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Payments'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => ({}),
  async ({ effects, input }): Promise<T.ActionResult & { version: '1' }> => {
    if (!input.confirmed) {
      throw new Error(
        i18n(
          'Confirm these details before sending. Lightning payments cannot be reversed.',
        ),
      )
    }
    const invoice = input.invoice.trim()
    const reviewed = effects.eventId
      ? reviewedInvoices.get(effects.eventId)
      : undefined
    if (effects.eventId) reviewedInvoices.delete(effects.eventId)
    if (reviewed && reviewed.invoice !== invoice) {
      throw new Error(
        i18n(
          'The invoice changed after review. Reopen the action and verify its details.',
        ),
      )
    }
    const decoded = reviewed?.decoded ?? (await decodeInvoice(effects, invoice))
    const entered =
      input.amount.selection === 'custom' ? input.amount.value.sats : null
    if (decoded.amount_msat === undefined && entered === null) {
      throw new Error(
        i18n('This invoice carries no amount; select "Enter an amount".'),
      )
    }
    if (decoded.amount_msat !== undefined && entered !== null) {
      throw new Error(
        i18n(
          'This invoice already carries an amount of ${amount} sats; select "As stated in the invoice".',
          { amount: sats(decoded.amount_msat) },
        ),
      )
    }
    return sdk.SubContainer.withTemp(
      effects,
      { imageId: 'lightning' },
      mainMounts,
      'pay-invoice',
      async (subc) => {
        const payRes = await subc.exec(
          [
            ...cli,
            '-k',
            'pay',
            `bolt11=${invoice}`,
            `maxfeepercent=${input['max-fee-percent']}`,
            'retry_for=60',
            ...(entered === null ? [] : [`amount_msat=${entered}sat`]),
          ],
          {},
          90_000,
        )
        const paid =
          payRes.exitCode === 0 ? cliJson<PayResult>(payRes.stdout) : null
        if (paid?.status !== 'complete') {
          throw new Error(
            i18n('Payment failed: ${reason}', {
              reason: literal(errorMessage(payRes)),
            }),
          )
        }
        const amount = sats(paid.amount_msat)
        const fee = sats((paid.amount_sent_msat ?? 0) - (paid.amount_msat ?? 0))
        const destination = paid.destination ?? decoded.payee ?? ''
        return {
          version: '1' as const,
          title: i18n('Payment sent'),
          message: i18n('Paid ${amount} sats to ${destination}.', {
            amount,
            destination,
          }),
          result: {
            type: 'group' as const,
            value: [
              row(i18n('Amount'), `${amount} sats`, false),
              row(i18n('Fee'), `${fee} sats`, false),
              row(i18n('Description'), decoded.description || '-', false),
              row(i18n('Destination'), destination, true),
              row(i18n('Preimage'), paid.payment_preimage ?? '', true),
            ],
          },
        }
      },
    )
  },
)
