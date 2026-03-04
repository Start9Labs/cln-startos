import { setupManifest } from '@start9labs/start-sdk'
import {
  alertInstall,
  alertRestore,
  alertUninstall,
  depBitcoindDescription,
  long,
  short,
} from './i18n'

export const manifest = setupManifest({
  id: 'c-lightning',
  title: 'Core Lightning',
  license: 'mit',
  packageRepo: 'https://github.com/Start9Labs/cln-startos/tree/update/040',
  upstreamRepo: 'https://github.com/ElementsProject/lightning',
  marketingUrl: 'https://blockstream.com/lightning',
  donationUrl: null,
  docsUrls: ['https://docs.corelightning.org/docs/home'],
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
        dockerTag: 'ghcr.io/elementsproject/cln-application:26.01.2',
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissingAs: 'aarch64',
    },
  },
  alerts: {
    install: alertInstall,
    uninstall: alertUninstall,
    restore: alertRestore,
    update: null,
    start: null,
    stop: null,
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
