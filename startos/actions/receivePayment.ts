import { T } from '@start9labs/start-sdk'
import { randomUUID } from 'crypto'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'
import { cliJson, errorMessage, literal, row } from './payments'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  amount: Value.number({
    name: i18n('Amount'),
    description: i18n('Leave empty to let the payer choose the amount.'),
    required: false,
    default: null,
    min: 1,
    integer: true,
    units: 'sats',
    placeholder: null,
  }),
  description: Value.text({
    name: i18n('Description'),
    description: i18n('Shown to the payer in their wallet.'),
    required: false,
    default: null,
    placeholder: null,
  }),
  expiry: Value.number({
    name: i18n('Expires in'),
    description: null,
    required: true,
    default: 24,
    min: 1,
    integer: true,
    units: 'hours',
    placeholder: null,
  }),
})

export const receivePayment = sdk.Action.withInput(
  'receive-payment',
  async ({ effects }) => ({
    name: i18n('Receive Payment'),
    description: i18n('Create a Lightning invoice for this node to be paid.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Payments'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => ({}),
  async ({ effects, input }): Promise<T.ActionResult & { version: '1' }> => {
    const res = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'lightning' },
      mainMounts,
      'receive-payment',
      (subc) =>
        subc.exec([
          'lightning-cli',
          `--lightning-dir=${rootDir}`,
          '-k',
          'invoice',
          `amount_msat=${input.amount ? `${input.amount}sat` : 'any'}`,
          `label=startos-${randomUUID()}`,
          `description=${JSON.stringify(input.description ?? '')}`,
          `expiry=${input.expiry * 3600}`,
        ]),
    )
    const created =
      res.exitCode === 0
        ? cliJson<{ bolt11: string; payment_hash: string }>(res.stdout)
        : null
    if (!created) {
      throw new Error(
        i18n('The invoice could not be created: ${error}', {
          error: literal(errorMessage(res)),
        }),
      )
    }
    return {
      version: '1' as const,
      title: i18n('Invoice created'),
      message: i18n('Payable for ${hours} hours.', {
        hours: String(input.expiry),
      }),
      result: {
        type: 'group' as const,
        value: [
          row(i18n('Invoice'), created.bolt11, true, true),
          row(
            i18n('Amount'),
            input.amount ? `${input.amount} sats` : i18n('Any amount'),
            false,
          ),
          row(i18n('Description'), input.description || '-', false),
          row(i18n('Payment hash'), created.payment_hash, true),
        ],
      },
    }
  },
)
