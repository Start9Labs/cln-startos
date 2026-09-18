import { T } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'
import { errorMessage, row, sats } from './payments'

const { InputSpec, Value, Variants } = sdk

const inputSpec = InputSpec.of({
  invoice: Value.text({
    name: i18n('Invoice'),
    description: i18n('A BOLT11 payment request.'),
    required: true,
    default: null,
    placeholder: 'lnbc…',
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
})

type Decoded = {
  type: string
  valid: boolean
  payee?: string
  amount_msat?: number
  description?: string
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
    const cli = ['lightning-cli', `--lightning-dir=${rootDir}`]
    const invoice = input.invoice.trim()
    return sdk.SubContainer.withTemp(
      effects,
      { imageId: 'lightning' },
      mainMounts,
      'pay-invoice',
      async (subc) => {
        const decodeRes = await subc.exec([...cli, 'decode', invoice])
        const decoded: Decoded | null =
          decodeRes.exitCode === 0 && typeof decodeRes.stdout === 'string'
            ? JSON.parse(decodeRes.stdout)
            : null
        if (!decoded?.valid || decoded.type !== 'bolt11 invoice') {
          throw new Error(
            i18n('The invoice could not be decoded: ${error}', {
              error: errorMessage(decodeRes),
            }),
          )
        }
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
        const paid: PayResult | null =
          payRes.exitCode === 0 && typeof payRes.stdout === 'string'
            ? JSON.parse(payRes.stdout)
            : null
        if (paid?.status !== 'complete') {
          throw new Error(
            i18n('Payment failed: ${reason}', { reason: errorMessage(payRes) }),
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
