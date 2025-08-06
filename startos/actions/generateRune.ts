import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'

export const createRune = sdk.Action.withoutInput(
  // id
  'createrune',

  // metadata
  async ({ effects }) => ({
    name: 'Create Rune',
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
    const runeRes = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'lightning' },
      mainMounts,
      'createrune',
      async (subc) => {
        return await subc.exec(['lightning-cli', 'createrune'], {
          cwd: rootDir,
        })
      },
    )

    if (runeRes.exitCode === 0) {
      const rune: { rune: string } = JSON.parse(runeRes.stdout as string)
      return {
        version: '1',
        title: 'Success',
        message: `Successfully added unrestricted rune`,
        result: {
          value: rune.rune,
          qr: true,
          masked: true,
          copyable: true,
          type: 'single',
        },
      }
    }

    return {
      version: '1',
      title: 'Failed to Create Rune',
      message: `Error: ${runeRes.stderr}`,
      result: null,
    }
  },
)
