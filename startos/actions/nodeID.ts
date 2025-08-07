import { sdk } from '../sdk'
import { GetInfoResponse, mainMounts, rootDir } from '../utils'

export const nodeId = sdk.Action.withoutInput(
  // id
  'node-id',

  // metadata
  async ({ effects }) => ({
    name: 'Node ID',
    description:
      'Generate a rune with no restrictions. This rune can be used to connect with integrations such as Alby.',
    warning:
      "This rune has no restrictions! Anyone who has access to this rune could drain funds from your node. Be careful when giving this to apps that you don't trust",
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

    return {
      version: '1',
      title: 'Node ID',
      message: `The node identifier that can be used for connecting to other nodes`,
      result: {
        value: nodeInfo.id,
        qr: true,
        masked: true,
        copyable: true,
        type: 'single',
      },
    }

  },
)
