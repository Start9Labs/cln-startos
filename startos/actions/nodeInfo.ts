import {
  ActionResult,
  ActionResultMember,
} from '@start9labs/start-sdk/base/lib/osBindings'
import { peerInterfaceId } from '../interfaces'
import { sdk } from '../sdk'
import { GetInfoResponse, mainMounts, rootDir } from '../utils'

export const nodeInfo = sdk.Action.withoutInput(
  // id
  'node-info',

  // metadata
  async ({ effects }) => ({
    name: 'Node Info',
    description: 'Display Node ID and Peer Interface URIs.',
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    const nodeInfo: GetInfoResponse = await sdk.SubContainer.withTemp(
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
          description:
            'Share this URI with others so they can add your CLN node as a peer',
          copyable: true,
          masked: true,
          qr: true,
          type: 'single',
          value: `${nodeInfo.id}@${url}`,
        }
      }) || []

    return {
      version: '1',
      title: 'Node Info',
      message:
        'Necessary information about this node for peers to connect and open channels',
      result: {
        type: 'group',
        value: [
          {
            name: 'Node ID',
            description: `The node identifier that can be used for connecting to other nodes`,
            copyable: true,
            value: nodeInfo.id,
            masked: true,
            qr: true,
            type: 'single',
          },
          {
            name: 'Node URI(s)',
            description:
              'URI(s) for other nodes to peer with and open a channels',
            value: uriActionResultMembers,
            type: 'group',
          },
        ],
      },
    }
  },
)
