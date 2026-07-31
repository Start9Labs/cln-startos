import { sdk } from '../../sdk'
import { i18n } from '../../i18n'
import { fullConfigSpec, clnConfig } from '../../fileModels/config'
import { storeJson } from '../../fileModels/store.json'

export const config = sdk.Action.withInput(
  // id
  'config',

  // metadata
  async ({ effects }) => ({
    name: i18n('General Settings'),
    description: i18n('Set general configuration options for Core Lightning'),
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
    'custom-external-host': true,
    'fee-base': true,
    'fee-rate': true,
    'min-capacity': true,
    'funding-confirms': true,
  }),

  // optionally pre-fill the input form
  async ({ effects }) => ({
    ...(await clnConfig.read().once()),
    'custom-external-host':
      (await storeJson.read().once())?.customExternalHosts[0] ?? null,
  }),

  // the execution function. The custom external host lives in store.json, not
  // the config file — watchHosts merges it into announce-addr on every start —
  // and formToFile drops the field, so the same input can feed both writes.
  async ({ effects, input }) => {
    const host = input['custom-external-host']?.trim()
    await storeJson.merge(effects, {
      customExternalHosts: host ? [host] : [],
    })
    await clnConfig.merge(effects, input)
  },
)
