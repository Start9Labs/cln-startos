import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

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
  virtualNetworking: true,
  images: {
    lightning: {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissing: true,
    },
    ui: {
      source: {
        dockerTag:
          'ghcr.io/elementsproject/cln-application:26.09@sha256:27684e8e495d077ce661793f74b25d50c2e40f68552cb1ba57d6750dd2585798',
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissing: true,
    },
  },
})
