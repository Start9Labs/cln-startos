import { sdk } from '../sdk'
import { FileHelper } from '@start9labs/start-sdk'

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
      name: 'Display BIP-39 Seed',
      description:
        'The BIP-39 Seed can be used to recover on-chain funds in a disaster recovery scenario. Note this seed is insufficient to recover',
      warning: null,
      allowedStatuses: 'any',
      group: null,
      visibility:
        hsmSecretContents === null
          ? 'hidden'
          : hsmSecretContents.toString().split(' ').length === 12
            ? 'enabled'
            : {
                disabled:
                  'No BIP-39 Seed found. Wallets initialized on earler versions of CLN were not derived from a BIP-39 Seed. If a BIP-39 Seed is desired, all funds will need to be transferred out of this node. After all funds have been safely transferred to another wallet, CLN can be uninstalled, and then installed fresh',
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
      title: 'BIP-39 Seed',
      message:
        'WARNING: This seed is highly sensitive and sharing it with other will result in loss of funds. This Seed is for restoring on-chain ONLY funds; it has no knowledge of channel state.',
      result: {
        copyable: true,
        masked: true,
        qr: false,
        type: 'single',
        value: hsmSecretContents!
          .replace(/\u0000/g, '')
          .split(' ')
          .map((word, i) => `${i + 1}: ${word}`)
          .join(' '),
      },
    }
  },
)
