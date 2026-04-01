import { sdk } from '../../sdk'
import { i18n } from '../../i18n'
import { fullConfigSpec, clnConfig } from '../../fileModels/config'

export const config = sdk.Action.withInput(
  // id
  'config',

  // metadata
  async ({ effects }) => ({
    name: i18n('Other Config Options'),
    description: i18n('Set other configuration options for CLN'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  // form input specification
  fullConfigSpec.filter({
    alias: true,
    color: true,
    'tor-only': true,
    'clams-remote-websocket': true,
    'fee-base': true,
    'fee-rate': true,
    'min-capacity': true,
    'funding-confirms': true,
  }),

  // optionally pre-fill the input form
  async ({ effects }) => clnConfig.read().once(),

  // the execution function
  async ({ effects, input }) => clnConfig.merge(effects, input),
)
