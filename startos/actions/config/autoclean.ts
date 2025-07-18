import {
  InputSpec,
  Value,
} from '@start9labs/start-sdk/base/lib/actions/input/builder'
import { sdk } from '../../sdk'
import { clnConfig } from '../../fileModels/config'
import { clnConfDefaults } from '../../utils'

const {
  'autoclean-cycle': autocleanCycle,
  'autoclean-succeededforwards-age': autocleanSucceededforwardsAge,
  'autoclean-failedforwards-age': autocleanFailedforwardsAge,
  'autoclean-succeededpays-age': autocleanSucceededpaysAge,
  'autoclean-failedpays-age': autocleanFailedpaysAge,
  'autoclean-paidinvoices-age': autocleanPaidinvoicesAge,
  'autoclean-expiredinvoices-age': autocleanExpiredinvoicesAge,
} = clnConfDefaults

const autocleanSpec = InputSpec.of({
  'autoclean-cycle': Value.number({
    name: 'Autoclean Interval',
    description:
      'Interval to perform search for things to clean. <b>Default: 3600 (1 hour) which is usually sufficient.</b>',
    warning: null,
    default: autocleanCycle,
    required: false,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'seconds',
    placeholder: null,
  }),
  'autoclean-succeededforwards-age': Value.number({
    name: 'Successful Forwards Age',
    description:
      'How old successful forwards (settled in listforwards status) have to be before deletion. <b>Default: 0, meaning never.</b>',
    warning: null,
    default: autocleanSucceededforwardsAge,
    required: false,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'seconds',
    placeholder: null,
  }),
  'autoclean-failedforwards-age': Value.number({
    name: 'Failed Forwards Age',
    description:
      'How old failed forwards (failed or local_failed in listforwards status) have to be before deletion.  <b>Default: 0, meaning never.</b>',
    warning: null,
    default: autocleanFailedforwardsAge,
    required: false,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'seconds',
    placeholder: null,
  }),
  'autoclean-succeededpays-age': Value.number({
    name: 'Successful Payments Age',
    description:
      'How old successful payments (complete in listpays status) have to be before deletion.  <b>Default: 0, meaning never.</b>',
    warning: null,
    default: autocleanSucceededpaysAge,
    required: false,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'seconds',
    placeholder: null,
  }),
  'autoclean-failedpays-age': Value.number({
    name: 'Failed Payments Age',
    description:
      'How old failed payment attempts (failed in listpays status) have to be before deletion.  <b>Default: 0, meaning never.</b>',
    warning: null,
    default: autocleanFailedpaysAge,
    required: false,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'seconds',
    placeholder: null,
  }),
  'autoclean-paidinvoices-age': Value.number({
    name: 'Paid Invoices Age',
    description:
      'How old invoices which were paid (paid in listinvoices status) have to be before deletion.  <b>Default: 0, meaning never.</b>',
    warning: null,
    default: autocleanPaidinvoicesAge,
    required: false,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'seconds',
    placeholder: null,
  }),
  'autoclean-expiredinvoices-age': Value.number({
    name: 'Expired Invoices Age',
    description:
      'How old invoices which were not paid (and cannot be) (expired in listinvoices status) before deletion.  <b>Default: 0, meaning never</b>',
    warning: null,
    default: autocleanExpiredinvoicesAge,
    required: false,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'seconds',
    placeholder: null,
  }),
})

export const autoclean = sdk.Action.withInput(
  // id
  'autoclean',

  // metadata
  async ({ effects }) => ({
    name: 'Autoclean Options',
    description:
      'Set autoclean options for deleting old invoices/payments/forwards',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),

  // form input specification
  autocleanSpec,

  // optionally pre-fill the input form
  async ({ effects }) => read(effects),

  // the execution function
  async ({ effects, input }) => write(effects, input),
)

async function read(effects: any): Promise<PartialAutocleanSpec> {
  const conf = (await clnConfig.read().const(effects))!

  return {
    'autoclean-cycle': conf['autoclean-cycle'],
    'autoclean-expiredinvoices-age': conf['autoclean-expiredinvoices-age'],
    'autoclean-failedforwards-age': conf['autoclean-failedforwards-age'],
    'autoclean-failedpays-age': conf['autoclean-failedpays-age'],
    'autoclean-paidinvoices-age': conf['autoclean-paidinvoices-age'],
    'autoclean-succeededforwards-age': conf['autoclean-succeededforwards-age'],
    'autoclean-succeededpays-age': conf['autoclean-succeededpays-age'],
  }
}

async function write(effects: any, input: AutocleanSpec) {
  const autocleanSettings = {
    'autoclean-cycle': input['autoclean-cycle'] || undefined,
    'autoclean-succeededforwards-age':
      input['autoclean-succeededforwards-age'] || undefined,
    'autoclean-failedforwards-age':
      input['autoclean-failedforwards-age'] || undefined,
    'autoclean-succeededpays-age':
      input['autoclean-succeededpays-age'] || undefined,
    'autoclean-failedpays-age': input['autoclean-failedpays-age'] || undefined,
    'autoclean-paidinvoices-age':
      input['autoclean-paidinvoices-age'] || undefined,
    'autoclean-expiredinvoices-age':
      input['autoclean-expiredinvoices-age'] || undefined,
  }

  await clnConfig.merge(effects, autocleanSettings)
}

type AutocleanSpec = typeof autocleanSpec._TYPE
type PartialAutocleanSpec = typeof autocleanSpec._PARTIAL
