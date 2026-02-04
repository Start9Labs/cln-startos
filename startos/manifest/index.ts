import { setupManifest } from '@start9labs/start-sdk'
import { SDKImageInputSpec } from '@start9labs/start-sdk/base/lib/types/ManifestTypes'
import { alertInstall, alertUninstall, alertRestore, bitcoindTitle, short, long } from './i18n'

const BUILD = process.env.BUILD || ''

const arch =
  BUILD === 'x86_64' || BUILD === 'aarch64' ? [BUILD] : ['x86_64', 'aarch64']

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
      arch: arch,
    } as SDKImageInputSpec,
    ui: {
      source: {
        dockerTag: 'ghcr.io/elementsproject/cln-application:25.07.3',
      },
      arch: arch,
    } as SDKImageInputSpec,
  },
  hardwareRequirements: {
    arch: arch,
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
      optional: true,
      metadata: {
        title: bitcoindTitle,
        icon: 'https://bitcoin.org/img/icons/opengraph.png',
      },
    },
  },
})
