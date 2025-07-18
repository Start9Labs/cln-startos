import {
  bitcoinConfDefaults,
  peerInterfaceId,
} from 'bitcoind-startos/startos/utils'
import { clnConfig } from './fileModels/config'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { clnConfDefaults, mainMounts, rootDir, rpcPort, uiPort } from './utils'
import { access } from 'fs/promises'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup (optional) ========================
   *
   * In this section, we fetch any resources or run any desired preliminary commands.
   */
  console.info('Starting Core Lightning!')

  const depResult = await sdk.checkDependencies(effects)
  depResult.throwIfRunningNotSatisfied('bitcoind')
  depResult.throwIfInstalledVersionNotSatisfied('bitcoind')
  depResult.throwIfTasksNotSatisfied('bitcoind')
  depResult.throwIfHealthNotSatisfied('bitcoind', 'primary')

  const osIp = await sdk.getOsIp(effects)
  const proxy = `${osIp}:9050`

  const peerAddresses = (
    await sdk.serviceInterface.getOwn(effects, peerInterfaceId).const()
  )?.addressInfo?.publicUrls

  await clnConfig.merge(effects, { proxy, 'announce-addr': peerAddresses })

  const store = await storeJson.read().const(effects)

  const lightningdArgs: string[] = []

  if (store && store.clboss) {
    for (const [key, value] of Object.entries(store.clboss)) {
      lightningdArgs.push(`--clboss-${key}=${value}`)
    }
  }

  if (store) {
    if (store['experimental-dual-fund']) {
      lightningdArgs.push('--experimental-dual-fund')
    }
    if (store['experimental-shutdown-wrong-funding']) {
      lightningdArgs.push('--experimental-shutdown-wrong-funding')
    }
    if (store['experimental-splicing']) {
      lightningdArgs.push('--experimental-splicing')
    }
    if (store.rescan) {
      lightningdArgs.push(`--rescan=${store.rescan}`)
    }
  }

  /**
   * ======================== Daemons ========================
   *
   * In this section, we create one or more daemons that define the service runtime.
   *
   * Each daemon defines its own health check, which can optionally be exposed to the user.
   */

  const lightningdSubc = await sdk.SubContainer.of(
    effects,
    { imageId: 'lightning' },
    mainMounts
      .mountDependency({
        dependencyId: 'bitcoind',
        mountpoint: clnConfDefaults['bitcoin-datadir'],
        readonly: true,
        subpath: null,
        volumeId: 'main',
      })
      .mountAssets({
        mountpoint: '/scripts',
        subpath: null,
      }),
    'lightning-sub',
  )

  return sdk.Daemons.of(effects, started)
    .addDaemon('lightningd', {
      subcontainer: lightningdSubc,
      exec: {
        command: [
          'lightningd',
          `--lightning-dir=${rootDir}`,
          `--conf=${rootDir}/config`,
          ...lightningdArgs,
        ],
      },
      ready: {
        display: 'RPC Interface',
        fn: async () => {
          const res = await lightningdSubc.exec([
            'lightning-cli',
            `--lightning-dir=${rootDir}`,
            'getinfo',
          ])
          if (res.exitCode === 0) {
            return {
              message: 'The RPC interface is ready',
              result: 'success',
            }
          }
          return {
            message: 'The RPC interface is not ready',
            result: 'loading',
          }
        },
      },
      requires: [],
    })
    .addOneshot('commando-config', {
      requires: ['lightningd'],
      subcontainer: lightningdSubc,
      exec: {
        fn: async () => {
          try {
            await access(`${rootDir}/.commando-env`)
            console.log('Existing .commando-env found')
            return {
              command: ['pwd'], // noop command because exec requires a command
            }
          } catch (error) {
            console.log(
              'No .commando-env found. Creating with entrypoint.sh...',
            )
            return {
              command: [`scripts/entrypoint.sh`],
              env: {
                LIGHTNING_PATH: rootDir,
                BITCOIN_NETWORK: 'bitcoin',
                COMMANDO_CONFIG: `${rootDir}/.commando-env`,
              },
            }
          }
        },
      },
    })
    .addDaemon('cln-application', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        {
          imageId: 'ui',
        },
        mainMounts,
        'cln-application-sub',
      ),
      exec: {
        command: ['npm', 'run', 'start'],
        // Passing env variables instead of using a FileModel as these settings shouldn't be configurable
        env: {
          BITCOIN_NETWORK: 'bitcoin',
          LIGHTNING_DATA_DIR: rootDir,
          APP_PROTOCOL: 'https',
          APP_HOST: '0.0.0.0',
          APP_PORT: '4500',
          APP_CONFIG_FILE: `${rootDir}/data/app/config.json`,
          APP_LOG_FILE: `${rootDir}/data/app/application-cln.log`,
          LIGHTNING_VARS_FILE: `${rootDir}/.commando-env`,
          LIGHTNING_WS_PORT: '4269',
          LIGHTNING_GRPC_PORT: '2106',
        },
      },
      requires: ['lightningd', 'commando-config'],
      ready: {
        display: 'Web Interface',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: 'The Web Interface is ready',
            errorMessage: 'The Web Interface is not ready',
          }),
      },
    })
})
