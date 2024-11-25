import { Backups } from "../deps.ts";

export const { createBackup } = Backups.with_options({
  exclude: [".lightning/bitcoin/lightningd.sqlite3"],
})
  .volumes("main", "cert")
  .build();
