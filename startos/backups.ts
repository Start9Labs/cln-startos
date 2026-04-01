import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) =>
    sdk.Backups.ofVolumes('main')
      .setOptions({
        exclude: [
          'bitcoin/lightning-rpc',
          'bitcoin/lightningd.sqlite3',
          'bitcoin/lightningd.sqlite3-wal',
          'bitcoin/lightningd.sqlite3-shm',
          'bitcoin/gossip_store',
          'data/app/application-cln.log',
        ],
      })
      .setPostRestore(async (effects) => {
        await storeJson.merge(effects, { restore: true })
      }),
)
