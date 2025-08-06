import { ActionResultMember } from '@start9labs/start-sdk/base/lib/osBindings'
import { storeJson } from '../../fileModels/store.json'
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
    name: 'Watchtower Client Info',
    description:
      'Display information about the watchtower clients configured for this node.',
    warning: null,
    allowedStatuses: 'only-running',
    group: 'Watchtower',
    visibility: (await storeJson
      .read((e) => e.watchtowerClients && e.watchtowerClients.length > 0)
      .const(effects))
      ? 'enabled'
      : 'hidden',
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
        Object.entries(towerInfo).map((tower, idx) => {
          return {
            name: `Watchtower #${idx + 1}`,
            description:
              'Share this Watchtower Server URI to allow other CLN nodes to register their watchtower clients with your watchtower',
            value: [
              {
                name: 'Network Address',
                value: tower[1].net_addr,
                description: 'Network address the tower is listening on',
                copyable: true,
                qr: false,
                masked: false,
                type: 'single',
              },
              {
                name: 'Available Slots',
                value: `${tower[1].available_slots}`,
                description: 'Number of slots the tower has available',
                copyable: false,
                qr: false,
                masked: false,
                type: 'single',
              },
              {
                name: 'Subscription Start',
                value: `${tower[1].subscription_start}`,
                description: 'Block height when the subscription started',
                copyable: false,
                qr: false,
                masked: false,
                type: 'single',
              },
              {
                name: 'Subscription Expiry',
                value: `${tower[1].subscription_expiry}`,
                description: 'Block height when the subscription will expire',
                copyable: false,
                qr: false,
                masked: false,
                type: 'single',
              },
              {
                name: 'Status',
                value: `${tower[1].status}`,
                description: 'Whether the tower is reachable',
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
        title: 'Watchtower Client Properties',
        message: null,
        result: {
          type: 'group',
          value: towers,
        },
      }
    }

    return {
      version: '1',
      title: 'Failure',
      message: `Error running 'listtowers': ${res.stderr}`,
      result: null,
    }
  },
)
