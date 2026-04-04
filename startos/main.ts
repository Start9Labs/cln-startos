import { Daemons, FileHelper } from '@start9labs/start-sdk'
import { readFile, writeFile } from 'fs/promises'
import { ListTowers } from './actions/watchtower/watchtowerClientInfo'
import { clnConfig } from './fileModels/config'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { manifest } from './manifest'
import { sdk } from './sdk'
import {
  bitcoinDataDir,
  clnrestPort,
  grpcPort,
  mainMounts,
  rootDir,
  uiPort,
  wsPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup (optional) ========================
   *
   * In this section, we fetch any resources or run any desired preliminary commands.
   */
  console.info(i18n('Starting Core Lightning!'))

  // watch cln config for changes
  await clnConfig.read().const(effects)

  // get store.json but don't watch for changes
  const store = await storeJson.read().once()
  if (!store) {
    throw new Error('no store.json')
  }

  const lightningdArgs: string[] = ['--database-upgrade=true']

  if (store.rescan) {
    lightningdArgs.push(`--rescan=${store.rescan}`)
    await storeJson.merge(effects, { rescan: undefined })
  }

  /**
   * ======================== Daemons ========================
   *
   * In this section, we create one or more daemons that define the service runtime.
   *
   * Each daemon defines its own health check, which can optionally be exposed to the user.
   */

  const lightningSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'lightning' },
    mainMounts.mountDependency({
      dependencyId: 'bitcoind',
      mountpoint: bitcoinDataDir,
      subpath: null,
      readonly: true,
      volumeId: 'main',
    }),
    'lightning-sub',
  )

  // Restart if Bitcoin .cookie changes
  await FileHelper.string(`${lightningSub.rootfs}/mnt/bitcoin/.cookie`)
    .read()
    .const(effects)

  const baseDaemons = sdk.Daemons.of(effects)
    .addDaemon('lightningd', {
      subcontainer: lightningSub,
      exec: {
        command: [
          'lightningd',
          `--lightning-dir=${rootDir}`,
          `--conf=${rootDir}/config`,
          ...lightningdArgs,
        ],
      },
      ready: {
        display: i18n('RPC Interface'),
        fn: async () => {
          const res = await lightningSub.exec([
            'lightning-cli',
            `--lightning-dir=${rootDir}`,
            'getinfo',
          ])
          if (res.exitCode === 0) {
            return {
              message: i18n('The RPC interface is ready'),
              result: 'success',
            }
          }
          return {
            message: i18n('The RPC interface is not ready'),
            result: 'loading',
          }
        },
      },
      requires: [],
    })
    .addOneshot('commando-config', {
      subcontainer: lightningSub,
      exec: {
        fn: async (subcontainer) => {
          const commandoEnv = `${lightningSub.rootfs}${rootDir}/.commando-env`
          const cliBase = ['lightning-cli', `--lightning-dir=${rootDir}`]

          // Get current pubkey
          const getinfoRes = await subcontainer.exec([...cliBase, 'getinfo'])
          if (getinfoRes.exitCode !== 0) {
            throw new Error(`getinfo failed: ${getinfoRes.stderr}`)
          }
          const { id: pubkey } = JSON.parse(getinfoRes.stdout as string)

          // Check existing config
          const existing = await readFile(commandoEnv, 'utf-8').catch(() => '')
          const existingPubkey = existing.match(
            /^LIGHTNING_PUBKEY="(.+)"$/m,
          )?.[1]
          const existingRune = existing.match(/^LIGHTNING_RUNE="(.+)"$/m)?.[1]

          if (existingPubkey === pubkey && existingRune) {
            console.log('Commando config: pubkey matches, rune exists')
            return null
          }

          // Generate new rune
          console.log('Commando config: generating new rune')
          const runeRes = await subcontainer.exec([
            ...cliBase,
            'createrune',
            'null',
            '[["For Application#"]]',
          ])
          if (runeRes.exitCode !== 0) {
            throw new Error(`createrune failed: ${runeRes.stderr}`)
          }
          const { rune } = JSON.parse(runeRes.stdout as string)

          await writeFile(
            commandoEnv,
            `LIGHTNING_PUBKEY="${pubkey}"\nLIGHTNING_RUNE="${rune}"\n`,
          )

          return null
        },
      },
      requires: ['lightningd'],
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
        command: ['node', '/app/apps/backend/dist/server.js'],
        env: {
          BITCOIN_NETWORK: 'bitcoin',
          LIGHTNING_DATA_DIR: rootDir,
          APP_PROTOCOL: 'https',
          APP_HOST: '0.0.0.0',
          APP_PORT: String(uiPort),
          APP_CONFIG_FILE: `${rootDir}/data/app/config.json`,
          APP_LOG_FILE: `${rootDir}/data/app/application-cln.log`,
          LIGHTNING_VARS_FILE: `${rootDir}/.commando-env`,
          LIGHTNING_WS_PORT: String(wsPort),
          LIGHTNING_REST_PORT: String(clnrestPort),
          LIGHTNING_GRPC_PORT: String(grpcPort),
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The Web Interface is ready'),
            errorMessage: i18n('The Web Interface is not ready'),
          }),
      },
      requires: ['lightningd', 'commando-config'],
    })
    .addHealthCheck('check-synced', {
      ready: {
        display: i18n('Synced'),
        fn: async () => {
          const getinfoRes = await lightningSub.exec([
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
              message: i18n('Bitcoind is not up-to-date with network.'),
              result: 'loading',
            }
          } else if (warning_lightningd_sync) {
            const bitcoinGetblockcount = await lightningSub.exec([
              'bitcoin-cli',
              '--rpcconnect=bitcoind.startos',
              '--rpccookiefile=/mnt/bitcoin/.cookie',
              'getblockcount',
            ])
            if (bitcoinGetblockcount.exitCode !== 0) {
              return {
                message: i18n(
                  'Lightningd is still loading latest blocks from bitcoind, but bitcoin-cli failed to getblockcount from bitcoind',
                ),
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
              message: i18n(
                'Synced to chain and ready to perform on-chain operations',
              ),
            }
          }

          return {
            result: 'failure',
            message: `Error calling 'lightning-cli getinfo': ${getinfoRes.stderr}`,
          }
        },
      },
      requires: ['lightningd'],
    })

  let daemons: Daemons<
    typeof manifest,
    | 'lightningd'
    | 'commando-config'
    | 'cln-application'
    | 'check-synced'
    | 'emergency-recover'
    | 'watchtower-server'
  > = baseDaemons

  if (store.restore) {
    daemons = baseDaemons.addOneshot('emergency-recover', {
      subcontainer: lightningSub,
      exec: {
        fn: async () => {
          await sdk.setHealth(effects, {
            id: 'restored',
            name: i18n('Backup Restoration Detected'),
            message: i18n(
              'It is not recommended to continue using a Core Lightning node after emergency recovery. All channels will be force-closed and funds swept to the on-chain wallet. Please wait for all channels to resolve, then sweep remaining funds to another wallet. Afterwards, Core Lightning should be uninstalled and re-installed fresh if you would like to continue using it.',
            ),
            result: 'failure',
          })
          return {
            command: [
              'lightning-cli',
              `--lightning-dir=${rootDir}`,
              'emergencyrecover',
            ],
          }
        },
      },
      requires: ['lightningd'],
    })
  }

  // restart on changes to store or config
  await storeJson.read().const(effects)

  if (store.watchtowerServer) {
    daemons = baseDaemons.addDaemon('watchtower-server', {
      subcontainer: lightningSub,
      exec: {
        command: ['teosd', '--datadir=/root/.lightning/.teos'],
      },
      ready: {
        display: i18n('TEOS Watchtower Server'),
        fn: async () => {
          const gettowerinfoRes = await lightningSub.exec([
            'teos-cli',
            '--datadir=/root/.lightning/.teos',
            'gettowerinfo',
          ])
          if (gettowerinfoRes.exitCode === 0) {
            return {
              result: 'success',
              message: i18n('The Watchtower Server is online'),
            }
          }

          return {
            result: 'starting',
            message: i18n('TEOSd is starting...'),
          }
        },
      },
      requires: ['lightningd'],
    })
  }

  return daemons
    .addOneshot('watchtower-client', {
      subcontainer: lightningSub,
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
      requires: ['lightningd'],
    })
    .addOneshot('abandontowers', {
      subcontainer: lightningSub,
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
      requires: ['lightningd', 'watchtower-server'],
    })
})
