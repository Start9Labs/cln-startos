import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'

export const createRune = sdk.Action.withoutInput(
  // id
  'createrune',

  // metadata
  async ({ effects }) => ({
    name: i18n('Create Rune'),
    description: i18n(
      'Generate a rune with no restrictions. This rune can be used to connect with integrations such as Alby.',
    ),
    warning: i18n(
      "This rune has no restrictions! Anyone who has access to this rune could drain funds from your node. Be careful when giving this to apps that you don't trust",
    ),
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
        title: i18n('Success'),
        message: i18n('Successfully added unrestricted rune'),
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
      title: i18n('Failed to Create Rune'),
      message: `Error: ${runeRes.stderr}`,
      result: null,
    }
  },
)
