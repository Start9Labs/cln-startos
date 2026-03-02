import { setupManifest } from '@start9labs/start-sdk'
import { alertInstall, alertUninstall, alertRestore, bitcoindTitle, short, long } from './i18n'

export const manifest = setupManifest({
  id: 'c-lightning',
  title: 'Core Lightning',
  license: 'mit',
  packageRepo: 'https://github.com/Start9Labs/cln-startos',
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
      description: 'Used to subscribe to new block events.',
      optional: false,
      metadata: {
        title: bitcoindTitle,
        icon: 'https://bitcoin.org/img/icons/opengraph.png',
      },
    },
  },
})
