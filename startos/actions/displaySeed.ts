import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { FileHelper } from '@start9labs/start-sdk'

const seedGrid = (words: string[]) => {
  const cells = words.map((w, i) => `${String(i + 1).padStart(2)}. ${w}`)
  const width = Math.max(...cells.map((c) => c.length))
  const rows: string[] = []
  for (let i = 0; i < cells.length; i += 4) {
    rows.push(
      cells
        .slice(i, i + 4)
        .map((c) => c.padEnd(width))
        .join('  ')
        .trimEnd(),
    )
  }
  return rows.join('\n')
}

export const displaySeed = sdk.Action.withoutInput(
  // id
  'display-seed',

  // metadata
  async ({ effects }) => {
    const hsmSecretContents = await FileHelper.string(
      '/media/startos/volumes/main/bitcoin/hsm_secret',
    )
      .read()
      .const(effects)

    return {
      name: i18n('Display BIP-39 Seed'),
      description: i18n(
        "The BIP-39 seed recovers this node's on-chain funds in a disaster. It does not recover funds in channels.",
      ),
      warning: null,
      allowedStatuses: 'any',
      group: null,
      visibility:
        hsmSecretContents === null
          ? 'hidden'
          : hsmSecretContents.toString().split(' ').length === 12
            ? 'enabled'
            : {
                disabled: i18n(
                  'No BIP-39 Seed found. Wallets initialized on earlier versions of CLN were not derived from a BIP-39 Seed. If a BIP-39 Seed is desired, all funds will need to be transferred out of this node. After all funds have been safely transferred to another wallet, CLN can be uninstalled, and then installed fresh',
                ),
              },
    }
  },

  // the execution function
  async ({ effects }) => {
    const hsmSecretContents = await FileHelper.string(
      '/media/startos/volumes/main/bitcoin/hsm_secret',
    )
      .read()
      .once()

    return {
      version: '1',
      title: i18n('BIP-39 Seed'),
      message: i18n(
        'WARNING: This seed is highly sensitive and sharing it with others will result in loss of funds. This Seed is for restoring on-chain ONLY funds; it has no knowledge of channel state.',
      ),
      result: {
        copyable: true,
        masked: true,
        qr: false,
        type: 'multiline',
        value: seedGrid(hsmSecretContents!.replace(/\u0000/g, '').split(' ')),
      },
    }
  },
)
