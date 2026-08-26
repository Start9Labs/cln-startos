const defaultTowerPort = 9814

export type TowerUri = {
  id: string
  host: string
  port: number
}

/**
 * Split a `<tower id>@<host>[:<port>]` entry as the user typed it. `host` keeps
 * any `http://` or `https://` prefix, because that prefix is what selects the
 * scheme watchtower-client talks to the tower over.
 */
export function parseTowerUri(uri: string): TowerUri | null {
  const trimmed = uri.trim()
  const at = trimmed.indexOf('@')
  if (at < 1) return null

  const address = trimmed.slice(at + 1)
  const port = address.match(/:(\d{1,5})$/)
  const host = port ? address.slice(0, -port[0].length) : address
  if (!host) return null

  return {
    id: trimmed.slice(0, at),
    host,
    port: port ? Number(port[1]) : defaultTowerPort,
  }
}

/**
 * The address `listtowers` reports a tower under. watchtower-client fills in
 * `http://` and the default port itself, so reconstructing them here is what
 * lets an entry the user typed with a scheme, in another case, or without a
 * port match the tower that is already registered.
 */
export function towerNetAddr(tower: TowerUri): string {
  const host = /^https?:\/\//i.test(tower.host)
    ? tower.host
    : `http://${tower.host}`
  return `${host}:${tower.port}`.toLowerCase()
}

export function towerKey(id: string, netAddr: string): string {
  return `${id}@${netAddr}`.toLowerCase()
}
