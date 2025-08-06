import { ActionResultMember } from '@start9labs/start-sdk/base/lib/osBindings'
import { storeJson } from '../../fileModels/store.json'
import { teosInterfaceId } from '../../interfaces'
import { sdk } from '../../sdk'
import { mainMounts, rootDir } from '../../utils'

type GetTowerInfo = {
  tower_id: string
  n_registered_users: number
  n_watcher_appointments: number
  n_responder_trackers: number
  bitcoind_reachable: boolean
}

export const watchtowerInfo = sdk.Action.withoutInput(
  // id
  'watchtower-info',

  // metadata
  async ({ effects }) => ({
    name: 'Watchtower Info',
    description:
      'Display information about the watchtower server running on this node.',
    warning: null,
    allowedStatuses: 'only-running',
    group: 'Watchtower',
    visibility:
      (await storeJson.read((e) => e.watchtowerServer).const(effects)) || false
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
      'tower-info',
      async (subc) => {
        return subc.exec([
          'teos-cli',
          `--datadir=${rootDir}/.teos`,
          'gettowerinfo',
        ])
      },
    )

    if (res.exitCode === 0) {
      const towerInfo: GetTowerInfo = JSON.parse(res.stdout as string)
      const watchtowerAddress = (
        await sdk.serviceInterface.getOwn(effects, teosInterfaceId).const()
      )?.addressInfo?.publicUrls

      const watchtowerUrls: ActionResultMember[] =
        watchtowerAddress?.map((tower, idx) => {
          return {
            name: `Tower #${idx + 1}`,
            description:
              'Share this Watchtower Server URI to allow other CLN nodes to register their watchtower clients with your watchtower',
            value: `${towerInfo.tower_id}@${tower.split('://')[1]}`,
            copyable: true,
            masked: true,
            qr: true,
            type: 'single',
          }
        }) || []

      return {
        version: '1',
        title: 'Tower Info',
        message: null,
        result: {
          type: 'group',
          value: [
            {
              name: 'Watchtower Server URI(s)',
              description: null,
              value: [...new Set(watchtowerUrls)],
              copyable: true,
              masked: true,
              qr: true,
              type: 'group',
            },
            {
              name: 'Number of Registered Users',
              description: 'Number of users registered with this tower server',
              value: `${towerInfo.n_registered_users}`,
              copyable: false,
              qr: false,
              masked: false,
              type: 'single',
            },
            {
              name: 'Number of Watcher Appointments',
              value: `${towerInfo.n_watcher_appointments}`,
              description:
                'Number of channel states being watched, ready to submit the justice transaction should a breach be detected. There should be at most one of these per channel being watched.',
              copyable: false,
              qr: false,
              masked: false,
              type: 'single',
            },
            {
              name: 'Number of Responder Trackers',
              value: `${towerInfo.n_responder_trackers}`,
              description:
                'Number of active breaches in the process of being resolved. See for more info: https://github.com/talaia-labs/rust-teos/blob/43f99713159a63884e9c851134d126ca1ec48f7e/teos/src/responder.rs#L134-L136',
              copyable: false,
              qr: false,
              masked: false,
              type: 'single',
            },
            {
              name: 'Bitcoind Reachable',
              value: `${towerInfo.bitcoind_reachable}`,
              description:
                'Whether your tower has an active connection to the blockchain backend.',
              copyable: false,
              qr: false,
              masked: false,
              type: 'single',
            },
          ],
        },
      }
    }

    return {
      version: '1',
      title: 'Failure',
      message: `Error running 'gettowerinfo': ${res.stderr}`,
      result: null,
    }
  },
)
