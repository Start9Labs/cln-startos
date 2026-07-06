import { T } from '@start9labs/start-sdk'
import {
  rpcHostId as btcRpcHostId,
  rpcPort as btcRpcPort,
} from 'bitcoin-core-startos/startos/utils'
import { sdk } from './sdk'

export const uiPort = 4500
export const wsPort = 4269
export const rpcPort = 8080
export const peerPort = 9735
export const clnrestPort = 3010
export const watchtowerPort = 9814
export const websocketPort = 7272
export const grpcPort = 2106

export const rootDir = '/root/.lightning'
export const bitcoinDataDir = '/mnt/bitcoin'

export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: rootDir,
  readonly: false,
})

/**
 * Bridge address (`10.0.3.1:<assigned external port>`) of a dependency's
 * binding, as a minimal reactive value. Chain `.const()` in main: the mapped
 * string only changes when the address itself does, so main restarts exactly
 * on dependency install/uninstall/port-change and never on dependency
 * updates. Chain `.once()` in an action context. `fallbackPort` keeps the
 * value non-null while the dependency is absent — sanctioned only for tor's
 * allocator-guaranteed SOCKS 9050. Drop-in for the planned SDK
 * `sdk.host.getBridgeAddress` helper.
 */
export function bridgeAddress(
  effects: T.Effects,
  opts: {
    packageId: string
    hostId: string
    internalPort: number
    fallbackPort: number
  },
): { const(): Promise<string>; once(): Promise<string> }
export function bridgeAddress(
  effects: T.Effects,
  opts: { packageId: string; hostId: string; internalPort: number },
): { const(): Promise<string | null>; once(): Promise<string | null> }
export function bridgeAddress(
  effects: T.Effects,
  opts: {
    packageId: string
    hostId: string
    internalPort: number
    fallbackPort?: number
  },
) {
  const watchable = async () => {
    const osIp = await sdk.getOsIp(effects)
    return sdk.host.get(
      effects,
      { packageId: opts.packageId, hostId: opts.hostId },
      (host) => {
        const port =
          host?.bindings[opts.internalPort]?.net.assignedPort ??
          opts.fallbackPort
        return port != null ? `${osIp}:${port}` : null
      },
    )
  }
  return {
    const: async () => (await watchable()).const(),
    once: async () => (await watchable()).once(),
  }
}

/**
 * bitcoind's RPC bridge address, resolved through {@link bridgeAddress} and
 * split into the `{ host, port }` pair lightningd's config, teos.toml, and the
 * sync health check consume. `.const()` stays churn-free: bitcoind's assigned
 * RPC port persists across its updates/restarts, so CLN restarts only if
 * bitcoind is (re)installed on a new port. `null` while bitcoind's binding is
 * absent, so callers fall back to the `127.0.0.1` loopback placeholder.
 */
export const bitcoindRpcBridge = async (effects: T.Effects) => {
  const addr = await bridgeAddress(effects, {
    packageId: 'bitcoind',
    hostId: btcRpcHostId,
    internalPort: btcRpcPort,
  }).const()
  if (!addr) return null
  const [host, port] = addr.split(':')
  return { host, port: Number(port) }
}
