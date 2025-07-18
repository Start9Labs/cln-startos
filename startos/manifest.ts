import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'c-lightning',
  title: 'Core Lightning',
  license: 'mit',
  wrapperRepo: 'https://github.com/Start9Labs/cln-startos',
  upstreamRepo: 'https://github.com/ElementsProject/lightning',
  supportSite: 'https://github.com/ElementsProject/lightning/issues',
  marketingSite: 'https://blockstream.com/lightning',
  donationUrl: null,
  docsUrl:
    'https://github.com/Start9Labs/cln-startos/blob/master/docs/instructions.md',
  description: {
    short:
      'An implementation of the Lightning Network protocol by Blockstream.',
    long: 'Core Lightning (CLN) (formerly c-lightning) is a lightweight, highly customizable, and standards compliant implementation of the Lightning Network protocol. It is optimized for performance and extensibility.',
  },
  volumes: ['main'],
  images: {
    lightning: {
      source: {
        dockerTag: 'elementsproject/lightningd:v25.05',
      },
    },
    ui: {
      source: {
        dockerTag: 'ghcr.io/elementsproject/cln-application:25.07',
      },
    },
    // @TODO disect 0.3.5.1 Dockerfile and build additional plugins into another image
  },
  hardwareRequirements: {},
  alerts: {
    install:
      'READ CAREFULLY! Core Lightning and the Lightning Network are considered beta software. Please use with caution and do not risk more money than you are willing to lose. We encourage frequent backups. If for any reason, you need to restore CLN from a backup, your on-chain wallet will be restored, but the money locked up in your channels will be stuck in those channels for an indeterminate period of time, if they are returned to you at all. It depends on the cooperation of your peers. Choose peers with discretion.',
    uninstall:
      'READ CAREFULLY! Uninstalling Core Lightning will result in permanent loss of data, including its private keys for its on-chain wallet and all channel states. Please make a backup if you have any funds in your on-chain wallet or in any channels. Recovering from backup will restore your on-chain wallet, but due to the architecture of the Lightning Network, your channels cannot be recovered. All your channel funds will be stuck in those channels for an indeterminate period of time, and if your peers do not cooperate, they will not be recoverable at all.',
    // @TODO implement atuomatic recovery from SCB (or a better alternative if it exists)
    restore:
      'Restoring Core Lightning will overwrite its current data, including its on-chain wallet and channels. Any channels opened since the last backup will be forgotten and may linger indefinitely, and channels contained in the backup will be closed and their funds returned to your wallet, assuming your peers choose to cooperate.',
    update: null,
    start: null,
    stop: null,
  },
  dependencies: {
    bitcoind: {
      description: 'Used to subscribe to new block events.',
      optional: false,
      s9pk: 'https://github.com/Start9Labs/bitcoind-startos/releases/download/v28.1.0.3-alpha.7/bitcoind.s9pk',
    },
  },
})
