import { z } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { errorMessage, mainMounts, rootDir } from '../utils'

const { InputSpec, Value, Variants } = sdk

// createrune stores an empty alternatives array, and showrunes then crashes lightningd on that rune.
const restrictionsShape = z.array(z.array(z.string()).min(1)).min(1)

const parseRestrictions = (text: string) => {
  try {
    return JSON.stringify(restrictionsShape.parse(JSON.parse(text)))
  } catch {
    throw new Error(
      i18n(
        'Restrictions must be a JSON array of arrays of strings, with at least one string in each, such as [["method=getinfo"]].',
      ),
    )
  }
}

export const createRune = sdk.Action.withInput(
  'createrune',

  async ({ effects }) => ({
    name: i18n('Create Rune'),
    description: i18n(
      'Generate a rune, the credential an app uses to connect to this node, with the permissions you choose.',
    ),
    warning: i18n(
      'An unrestricted rune can do anything on this node, including draining its funds. Choose it only for an app you trust.',
    ),
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  InputSpec.of({
    permissions: Value.union({
      name: i18n('Permissions'),
      description: i18n(
        "What an app holding the rune may do.\n- Read-only: Core Lightning's list and get commands and summary, except listdatastore. Enough to view the node, not to spend from or change it.\n- Custom restrictions: only what the restrictions you enter allow.\n- Unrestricted: everything, including spending all of the node's funds.",
      ),
      default: null,
      variants: Variants.of({
        readonly: { name: i18n('Read-only'), spec: InputSpec.of({}) },
        custom: {
          name: i18n('Custom restrictions'),
          spec: InputSpec.of({
            restrictions: Value.text({
              name: i18n('Restrictions'),
              description: i18n(
                "A JSON array of restrictions, as Core Lightning's createrune takes them. Every restriction must pass, and each is an array of alternatives, one of which must pass. An app that gives you a lightning-cli createrune command has them inside the quotes after restrictions=.",
              ),
              required: true,
              default: null,
              placeholder: '[["method^list", "method^get"], ["rate=60"]]',
            }),
          }),
        },
        unrestricted: { name: i18n('Unrestricted'), spec: InputSpec.of({}) },
      }),
    }),
  }),

  async () => ({}),

  async ({ effects, input: { permissions } }) => {
    const restrictions =
      permissions.selection === 'readonly'
        ? ['null', 'readonly']
        : permissions.selection === 'custom'
          ? ['null', parseRestrictions(permissions.value.restrictions)]
          : []
    const runeRes = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'lightning' },
      mainMounts,
      'createrune',
      (subc) =>
        subc.exec(['lightning-cli', 'createrune', ...restrictions], {
          cwd: rootDir,
        }),
    )

    if (runeRes.exitCode === 0) {
      const rune: { rune: string } = JSON.parse(runeRes.stdout as string)
      return {
        version: '1',
        title: i18n('Success'),
        message: {
          readonly: i18n('Created a read-only rune.'),
          custom: i18n(
            'Created a rune limited to the restrictions you entered.',
          ),
          unrestricted: i18n(
            'Created an unrestricted rune. Anyone who holds it has full control of this node, including its funds.',
          ),
        }[permissions.selection],
        result: {
          value: rune.rune,
          qr: true,
          launchable: false,
          masked: true,
          copyable: true,
          type: 'single',
        },
      }
    }

    return {
      version: '1',
      title: i18n('Failed to Create Rune'),
      message: i18n('Creating the rune failed. Its error output is below.'),
      result: {
        type: 'multiline',
        value: errorMessage(runeRes),
        copyable: true,
        masked: false,
        qr: false,
        filename: null,
      },
    }
  },
)
