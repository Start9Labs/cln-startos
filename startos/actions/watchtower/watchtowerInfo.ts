import { T } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { teosInterfaceId, watchtowerHostId } from '../../interfaces'
import { i18n } from '../../i18n'
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
    name: i18n('Watchtower Info'),
    description:
      i18n('Display information about the watchtower server running on this node.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Watchtower'),
    visibility: (await storeJson
      .read((e) => e.watchtowerServer !== undefined && e.watchtowerServer)
      .const(effects))
      ? 'enabled'
      : { disabled: i18n('Watchtower Server must be enabled') },
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
      const watchtowerAddresses = await sdk.host
        .getOwn(effects, watchtowerHostId, (host) => {
          const iface =
            host &&
            Object.values(host.bindings)
              .flatMap((b) => Object.values(b.interfaces))
              .find((i) => i.id === teosInterfaceId)
          return iface ? iface.addressInfo.public.format() : undefined
        })
        .const()

      const watchtowerUrls: T.ActionResultMember[] =
        watchtowerAddresses?.map((tower, idx) => {
          return {
            name: `Tower #${idx + 1}`,
            description:
              i18n('Share this Watchtower Server URI to allow other CLN nodes to register their watchtower clients with your watchtower'),
            value: `${towerInfo.tower_id}@${tower}`,
            copyable: true,
            masked: true,
            qr: true,
            type: 'single',
          }
        }) || []

      return {
        version: '1',
        title: i18n('Tower Info'),
        message: null,
        result: {
          type: 'group',
          value: [
            {
              name: i18n('Watchtower Server URI(s)'),
              description: null,
              value: [...new Set(watchtowerUrls)],
              copyable: true,
              masked: true,
              qr: true,
              type: 'group',
            },
            {
              name: i18n('Number of Registered Users'),
              description: i18n('Number of users registered with this tower server'),
              value: `${towerInfo.n_registered_users}`,
              copyable: false,
              qr: false,
              masked: false,
              type: 'single',
            },
            {
              name: i18n('Number of Watcher Appointments'),
              value: `${towerInfo.n_watcher_appointments}`,
              description:
                i18n('Number of channel states being watched, ready to submit the justice transaction should a breach be detected. There should be at most one of these per channel being watched.'),
              copyable: false,
              qr: false,
              masked: false,
              type: 'single',
            },
            {
              name: i18n('Number of Responder Trackers'),
              value: `${towerInfo.n_responder_trackers}`,
              description:
                i18n('Number of active breaches in the process of being resolved.'),
              copyable: false,
              qr: false,
              masked: false,
              type: 'single',
            },
            {
              name: i18n('Bitcoind Reachable'),
              value: `${towerInfo.bitcoind_reachable}`,
              description:
                i18n('Whether your tower has an active connection to the blockchain backend.'),
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
      title: i18n('Failure'),
      message: `Error running 'gettowerinfo': ${String(res.stderr)}`,
      result: null,
    }
  },
)
