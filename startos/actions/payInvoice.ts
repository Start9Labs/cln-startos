import { T } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  invoice: Value.text({
    name: i18n('Invoice'),
    description: i18n('A BOLT11 payment request.'),
    required: true,
    default: null,
    placeholder: 'lnbc…',
  }),
  amount: Value.number({
    name: i18n('Amount (sats)'),
    description: i18n('Only for an invoice that carries no amount.'),
    required: false,
    default: null,
    min: 1,
    integer: true,
    units: 'sats',
    placeholder: null,
  }),
  'max-fee-percent': Value.number({
    name: i18n('Maximum fee (%)'),
    description: i18n(
      'The most this node may pay in routing fees, as a percentage of the amount.',
    ),
    required: true,
    default: 1,
    min: 0,
    max: 100,
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

const sats = (msat: number | undefined) =>
  msat === undefined ? '' : String(Math.floor(msat / 1000))

// lightning-cli reports an RPC error as a JSON object on stdout, exit code 1, sometimes after `# …` progress lines.
const errorMessage = (res: { stdout: unknown; stderr: unknown }) => {
  const raw = String(res.stdout || res.stderr).trim()
  try {
    return String(JSON.parse(raw.slice(raw.indexOf('{'))).message ?? raw)
  } catch {
    return raw || 'unknown'
  }
}

export const payInvoice = sdk.Action.withInput(
  'pay-invoice',
  async ({ effects }) => ({
    name: i18n('Pay Invoice'),
    description: i18n('Pay a Lightning invoice from this node.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
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
        if (decoded.amount_msat === undefined && !input.amount) {
          throw new Error(i18n('This invoice carries no amount; enter one.'))
        }
        const payRes = await subc.exec(
          [
            ...cli,
            '-k',
            'pay',
            `bolt11=${invoice}`,
            `maxfeepercent=${input['max-fee-percent']}`,
            'retry_for=60',
            ...(input.amount ? [`amount_msat=${input.amount}sat`] : []),
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
        const row = (name: string, value: string, copyable: boolean) => ({
          name,
          description: null,
          copyable,
          qr: false,
          masked: false,
          type: 'single' as const,
          value,
        })
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
