import { fullConfigSpec } from '../../fileModels/config'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const customExternalHostConfig = sdk.Action.withInput(
  // id
  'custom-external-host-config',

  // metadata
  async ({ effects }) => ({
    name: i18n('Custom External Host'),
    description: i18n(
      'Advertise an additional public address (e.g. a Tunnelsats or VPN endpoint) alongside your Tor and StartOS-managed addresses',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  // form input specification
  fullConfigSpec.filter({
    'custom-external-host': true,
  }),

  // pre-fill the input form
  async ({ effects }) => ({
    'custom-external-host':
      (await storeJson.read().const(effects))?.customExternalHosts[0] ?? null,
  }),

  // execution function — source of truth is store.json; watchHosts merges it into announce-addr in config
  async ({ effects, input }) => {
    const host = input['custom-external-host']?.trim()
    await storeJson.merge(effects, {
      customExternalHosts: host ? [host] : [],
    })
  },
)
