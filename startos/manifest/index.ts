import { setupManifest } from '@start9labs/start-sdk'
import { depBitcoindDescription, long, short } from './i18n'

export const manifest = setupManifest({
  id: 'c-lightning',
  title: 'Core Lightning',
  license: 'mit',
  packageRepo: 'https://github.com/Start9Labs/cln-startos',
  upstreamRepo: 'https://github.com/ElementsProject/lightning',
  marketingUrl: 'https://blockstream.com/lightning',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    lightning: {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissingAs: 'aarch64',
    },
    ui: {
      source: {
        dockerTag: 'ghcr.io/elementsproject/cln-application:26.04',
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissingAs: 'aarch64',
    },
  },
  dependencies: {
    bitcoind: {
      description: depBitcoindDescription,
      optional: false,
      metadata: {
        title: 'Bitcoin',
        icon: 'https://raw.githubusercontent.com/Start9Labs/bitcoin-core-startos/feec0b1dae42961a257948fe39b40caf8672fce1/dep-icon.svg',
      },
    },
  },
})
