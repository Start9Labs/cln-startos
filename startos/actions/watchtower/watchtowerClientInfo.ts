import { ActionResultMember } from '@start9labs/start-sdk/base/lib/osBindings'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { mainMounts, rootDir } from '../../utils'

export type ListTowers = {
  [pubkey: string]: {
    net_addr: string
    available_slots: number
    subscription_start: number
    subscription_expiry: number
    status: string
  }
}

export const watchtowerClientInfo = sdk.Action.withoutInput(
  // id
  'watchtower-client-info',

  // metadata
  async ({ effects }) => ({
    name: i18n('Watchtower Client Info'),
    description:
      i18n('Display information about the watchtower clients configured for this node.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Watchtower'),
    visibility: (await storeJson
      .read(
        (e) =>
          e.watchtowerClients !== undefined && e.watchtowerClients.length > 0,
      )
      .const(effects))
      ? 'enabled'
      : { disabled: i18n('Watchtower Client must be enabled') },
  }),

  // the execution function
  async ({ effects }) => {
    const res = await sdk.SubContainer.withTemp(
      effects,
      {
        imageId: 'lightning',
      },
      mainMounts,
      'listtowers',
      async (subc) => {
        return subc.exec(['lightning-cli', `listtowers`], { cwd: rootDir })
      },
    )

    if (res.exitCode === 0) {
      const towerInfo: ListTowers = JSON.parse(res.stdout as string)

      const towers: ActionResultMember[] =
        Object.entries(towerInfo).map((tower) => {
          return {
            name: `Watchtower Pubkey #${tower[0]}`,
            description:
              i18n('Share this Watchtower Server URI to allow other CLN nodes to register their watchtower clients with your watchtower'),
            value: [
              {
                name: i18n('Network Address'),
                value: tower[1].net_addr,
                description: i18n('Network address the tower is listening on'),
                copyable: true,
                qr: false,
                masked: false,
                type: 'single',
              },
              {
                name: i18n('Available Slots'),
                value: `${tower[1].available_slots}`,
                description: i18n('Number of slots the tower has available'),
                copyable: false,
                qr: false,
                masked: false,
                type: 'single',
              },
              {
                name: i18n('Subscription Start'),
                value: `${tower[1].subscription_start}`,
                description: i18n('Block height when the subscription started'),
                copyable: false,
                qr: false,
                masked: false,
                type: 'single',
              },
              {
                name: i18n('Subscription Expiry'),
                value: `${tower[1].subscription_expiry}`,
                description: i18n('Block height when the subscription will expire'),
                copyable: false,
                qr: false,
                masked: false,
                type: 'single',
              },
              {
                name: i18n('Status'),
                value: `${tower[1].status}`,
                description: i18n('Whether the tower is reachable'),
                copyable: false,
                qr: false,
                masked: false,
                type: 'single',
              },
            ],
            type: 'group',
          }
        }) || []

      return {
        version: '1',
        title: i18n('Watchtower Client Properties'),
        message: null,
        result: {
          type: 'group',
          value: towers,
        },
      }
    }

    return {
      version: '1',
      title: i18n('Failure'),
      message: `Error running 'listtowers': ${res.stderr}`,
      result: null,
    }
  },
)
