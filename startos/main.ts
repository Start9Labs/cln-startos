import { clnConfig } from './fileModels/config'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { clnConfDefaults, mainMounts, rootDir, uiPort } from './utils'
import { Daemons } from '@start9labs/start-sdk'
import { manifest } from './manifest'
import { peerInterfaceId } from './interfaces'
import { ListTowers } from './actions/watchtower/watchtowerClientInfo'

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
  )?.addressInfo?.publicUrls.map((u) => u.split('@')[1])

  await clnConfig.merge(effects, { proxy, 'announce-addr': peerAddresses })

  const store = await storeJson.read().once()

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
      await storeJson.merge(effects, { rescan: undefined })
    }
  }

  // restart on changes to store or config
  await storeJson.read().const(effects)
  await clnConfig.read().const(effects)

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

  const baseDaemons = sdk.Daemons.of(effects, started)
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
          return {
            command: [`scripts/entrypoint.sh`],
            env: {
              LIGHTNING_PATH: rootDir,
              BITCOIN_NETWORK: 'bitcoin',
              COMMANDO_CONFIG: `${rootDir}/.commando-env`,
            },
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
        // @TODO add REST and GRPC env variables so wallet connect screen in UI shows the correct url
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
    .addHealthCheck('check-synced', {
      requires: ['lightningd'],
      ready: {
        display: 'Synced',
        fn: async () => {
          const getinfoRes = await lightningdSubc.exec([
            'lightning-cli',
            `--lightning-dir=${rootDir}`,
            'getinfo',
          ])

          const {
            warning_lightningd_sync,
            warning_bitcoind_sync,
            blockheight,
          }: {
            warning_lightningd_sync?: string
            warning_bitcoind_sync?: string
            blockheight: number
          } = JSON.parse(getinfoRes.stdout as string)

          if (warning_bitcoind_sync) {
            return {
              message: 'Bitcoind is not up-to-date with network.',
              result: 'loading',
            }
          } else if (warning_lightningd_sync) {
            const bitcoinGetblockcount = await lightningdSubc.exec([
              'bitcoin-cli',
              '--rpcconnect=bitcoind.startos',
              '--rpccookiefile=/mnt/bitcoin/.cookie',
              'getblockcount',
            ])
            if (bitcoinGetblockcount.exitCode !== 0) {
              return {
                message:
                  'Lightningd is still loading latest blocks from bitcoind, but bitcoin-cli failed to getblockcount from bitcoind',
                result: 'failure',
              }
            }
            return {
              message: `Catching up to blocks from bitcoind. This may take several hours. Progress: ${blockheight} of ${bitcoinGetblockcount.stdout}`,
              result: 'loading',
            }
          }

          if (getinfoRes.exitCode === 0) {
            return {
              result: 'success',
              message:
                'Synced to chain and ready to perform on-chain operations',
            }
          }

          return {
            result: 'failure',
            message: `Error calling 'lightning-cli getinfo': ${getinfoRes.stderr}`,
          }
        },
      },
    })

  let daemons: Daemons<
    typeof manifest,
    | 'lightningd'
    | 'commando-config'
    | 'cln-application'
    | 'check-synced'
    | 'watchtower-server'
  > = baseDaemons

  if (store?.watchtowerServer) {
    daemons = baseDaemons.addDaemon('watchtower-server', {
      requires: ['lightningd'],
      subcontainer: lightningdSubc,
      exec: {
        command: ['teosd', '--datadir=/root/.lightning/.teos'],
      },
      ready: {
        display: 'TEOS Watchtower Server',
        fn: async () => {
          const gettowerinfoRes = await lightningdSubc.exec([
            'teos-cli',
            '--datadir=/root/.lightning/.teos',
            'gettowerinfo',
          ])
          if (gettowerinfoRes.exitCode === 0) {
            return {
              result: 'success',
              message: 'The Watchtower Server is online',
            }
          }

          return {
            result: 'starting',
            message: 'TEOSd is starting...',
          }
        },
      },
    })
  }

  if (
    store !== null &&
    store.watchtowerClients !== undefined &&
    store.watchtowerClients.length > 0
  ) {
    return daemons.addOneshot('watchtower-client', {
      subcontainer: lightningdSubc,
      requires: ['lightningd'],
      exec: {
        fn: async (subcontainer, abort) => {
          const listtowersRes = await subcontainer.exec(
            ['lightning-cli', 'listtowers'],
            { cwd: rootDir },
          )

          if (listtowersRes.exitCode === 0) {
            const parsedTowers: ListTowers = JSON.parse(
              listtowersRes.stdout as string,
            )
            const registeredTowers = Object.entries(parsedTowers).map((t) => {
              return `${t[0]}@${t[1].net_addr.split('://')[1]}`
            })
            for (const tower of store.watchtowerClients || []) {
              if (abort.aborted) break
              if (!registeredTowers.includes(tower)) {
                console.log(`Watchtower client adding ${tower}`)
                let res = await subcontainer.exec(
                  ['lightning-cli', 'registertower', tower],
                  { cwd: rootDir },
                  undefined,
                  {
                    abort: abort.reason,
                    signal: abort,
                  },
                )

                if (
                  res.exitCode === 0 &&
                  res.stdout !== '' &&
                  typeof res.stdout === 'string'
                ) {
                  console.log(`Result adding tower ${tower}: ${res.stdout}`)
                } else {
                  console.log(`Error adding tower ${tower}: ${res.stderr}`)
                }
              }
            }
          } else {
            console.log("failed to run 'listtowers':", listtowersRes)
          }
          return null
        },
      },
    })
  }

  if (
    store &&
    store.watchtowerClients !== undefined &&
    store.watchtowerClients.length > 0
  ) {
    daemons.addOneshot('abandontowers', {
      subcontainer: lightningdSubc,
      requires: ['lightningd', 'watchtower-server'],
      exec: {
        fn: async (subcontainer, abort) => {
          const listtowersRes = await subcontainer.exec(
            ['lightning-cli', 'listtowers'],
            { cwd: rootDir },
          )

          if (listtowersRes.exitCode === 0) {
            const parsedTowers: ListTowers = JSON.parse(
              listtowersRes.stdout as string,
            )
            const registeredTowers = Object.entries(parsedTowers).map((t) => {
              return `${t[0]}@${t[1].net_addr.split('://')[1]}`
            })
            for (const tower of registeredTowers) {
              if (abort.aborted) break
              if (
                store.watchtowerClients === undefined ||
                !store.watchtowerClients.includes(tower)
              ) {
                console.log(`Watchtower client removing ${tower}`)
                let res = await subcontainer.exec(
                  ['lightning-cli', 'abandontower', tower.split('@')[0]],
                  { cwd: rootDir },
                  undefined,
                  {
                    abort: abort.reason,
                    signal: abort,
                  },
                )

                if (
                  res.exitCode === 0 &&
                  res.stdout !== '' &&
                  typeof res.stdout === 'string'
                ) {
                  console.log(`Result adding tower ${tower}: ${res.stdout}`)
                } else {
                  console.log(`Error adding tower ${tower}: ${res.stderr}`)
                }
              }
            }
          } else {
            console.log(
              'Failed to run listtowers while checking for abandoned towers',
              listtowersRes,
            )
          }
          return null
        },
      },
    })
  }

  return daemons
})
