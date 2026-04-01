import { ActionResultMember } from '@start9labs/start-sdk/base/lib/osBindings'
import { i18n } from '../i18n'
import { peerInterfaceId } from '../interfaces'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'

export const nodeInfo = sdk.Action.withoutInput(
  // id
  'node-info',

  // metadata
  async ({ effects }) => ({
    name: i18n('Node Info'),
    description: i18n('Display Node ID and Peer Interface URIs.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    const nodeInfo: {
      id: string
    } = await sdk.SubContainer.withTemp(
      effects,
      {
        imageId: 'lightning',
      },
      mainMounts,
      'getinfo',
      async (subc) => {
        const res = await subc.execFail(['lightning-cli', 'getinfo'], {
          cwd: rootDir,
        })

        return JSON.parse(res.stdout as string)
      },
    )

    const peerAddresses = (
      await sdk.serviceInterface.getOwn(effects, peerInterfaceId).const()
    )?.addressInfo?.public.format()

    const uriActionResultMembers: ActionResultMember[] =
      peerAddresses?.map((url, idx) => {
        return {
          name: `URI $${idx + 1}`,
          description: i18n(
            'Share this URI with others so they can add your CLN node as a peer',
          ),
          copyable: true,
          masked: true,
          qr: true,
          type: 'single',
          value: `${nodeInfo.id}@${url}`,
        }
      }) || []

    return {
      version: '1',
      title: i18n('Node Info'),
      message: i18n(
        'Necessary information about this node for peers to connect and open channels',
      ),
      result: {
        type: 'group',
        value: [
          {
            name: i18n('Node ID'),
            description: i18n(
              'The node identifier that can be used for connecting to other nodes',
            ),
            copyable: true,
            value: nodeInfo.id,
            masked: true,
            qr: true,
            type: 'single',
          },
          {
            name: i18n('Node URI(s)'),
            description: i18n(
              'URI(s) for other nodes to peer with and open a channels',
            ),
            value: uriActionResultMembers,
            type: 'group',
          },
        ],
      },
    }
  },
)
