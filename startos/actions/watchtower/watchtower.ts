import { clnConfig } from '../../fileModels/config'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { parseTowerUri } from './towerUri'

const { InputSpec, List, Value, Variants } = sdk

export const watchtowerClientPlugin =
  '/usr/local/libexec/c-lightning/plugins/watchtower-client'

const watchtowerSpec = InputSpec.of({
  'wt-server': Value.toggle({
    name: i18n('Watchtower Server'),
    default: false,
    description: i18n(
      'Allow other nodes to connect to your watchtower server on the network.  <b>Default: Disabled</b>',
    ),
    warning: null,
  }),
  'wt-client': Value.union({
    name: i18n('Watchtower Client'),
    description: i18n(
      'Enable the client and connect to a watchtower server(s) of your choice in order to use watchtower features.  <b>Default: Disabled</b>',
    ),
    warning: null,
    default: 'disabled',
    variants: Variants.of({
      disabled: { name: i18n('Disabled'), spec: InputSpec.of({}) },
      enabled: {
        name: i18n('Enabled'),
        spec: InputSpec.of({
          'add-watchtowers': Value.list(
            List.obj(
              {
                name: i18n('Add Watchtower Servers'),
                minLength: 1,
                description: i18n(
                  "Add URIs of watchtower servers to connect to, in the form <pubkey>@<host>:<port>. Prefix the host with https:// if the tower serves its API over TLS. If you don't know of anyone with a server, you can find some on this public listing: https://github.com/talaia-labs/rust-teos/discussions/158",
                ),
              },
              {
                displayAs: '{{uri}}',
                uniqueBy: 'uri',
                spec: InputSpec.of({
                  uri: Value.text({
                    name: i18n('Tower URI'),
                    required: true,
                    default: null,
                    placeholder:
                      '02b4891f562c8b80571ddd2eeea48530471c30766295e1c78556ae4c4422d24436@recnedb7xfhzjdrcgxongzli3a6qyrv5jwgowoho3v5g3rwk7kkglrid.onion:9814',
                  }),
                  label: Value.text({
                    name: i18n('Label'),
                    description: i18n(
                      'An optional name for this tower, such as who runs it.',
                    ),
                    required: false,
                    default: null,
                  }),
                }),
              },
            ),
          ),
        }),
      },
    }),
  }),
})

export const watchtower = sdk.Action.withInput(
  // id
  'watchtower',

  // metadata
  async ({ effects }) => ({
    name: i18n('Watchtower Settings'),
    description: i18n(
      'Connect to external watchtower servers to protect your node from misbehaving channel peers. You can also run a watchtower server and share your server URI (found in properties) with friends/family to watch over their nodes.  You can learn more about watchtowers at https://docs.corelightning.org/docs/watchtowers.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Watchtower'),
    visibility: 'enabled',
  }),

  // form input specification
  watchtowerSpec,

  // optionally pre-fill the input form
  async ({ effects }) => read(effects),

  // the execution function
  async ({ effects, input }) => write(effects, input),
)

async function read(effects: any): Promise<PartialWatchTowerSpec> {
  const store = await storeJson.read().const(effects)
  if (!store) return {}

  return {
    'wt-server': store.watchtowerServer,
    'wt-client':
      store.watchtowerClients && store.watchtowerClients.length > 0
        ? {
            selection: 'enabled',
            value: {
              'add-watchtowers': store.watchtowerClients.map((uri) => ({
                uri,
                label:
                  store.watchtowerLabels.find(
                    (l) => l.id === parseTowerUri(uri)?.id,
                  )?.label ?? null,
              })),
            },
          }
        : { selection: 'disabled' },
  }
}

async function write(effects: any, input: WatchtowerSpec) {
  const towers =
    input['wt-client'].selection === 'enabled'
      ? input['wt-client'].value['add-watchtowers']
      : []
  const watchtowerSettings = {
    watchtowerServer: input['wt-server'],
    watchtowerClients: towers.map((t) => t.uri),
    watchtowerLabels: towers.flatMap((t) => {
      const id = parseTowerUri(t.uri)?.id
      return id && t.label ? [{ id, label: t.label }] : []
    }),
  }
  const form = await clnConfig.read().once()
  const plugins = [...(form?.raw?.plugin || [])].filter(
    (p): p is string => typeof p === 'string',
  )

  // Never removed: the plugin provides abandontower, and an emptied list is
  // exactly what abandontowers has to act on at the next start.
  if (
    watchtowerSettings.watchtowerClients.length > 0 &&
    !plugins.includes(watchtowerClientPlugin)
  ) {
    plugins.push(watchtowerClientPlugin)
  }
  await clnConfig.merge(effects, {
    raw: { ...(form?.raw ?? {}), plugin: plugins },
  })
  await storeJson.merge(effects, watchtowerSettings)
}

type WatchtowerSpec = typeof watchtowerSpec._TYPE
type PartialWatchTowerSpec = typeof watchtowerSpec._PARTIAL
