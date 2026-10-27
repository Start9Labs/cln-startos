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

/** Host path of the rune the CLN Application UI authenticates with. */
export const commandoEnv = '/media/startos/volumes/main/.commando-env'

export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: rootDir,
  readonly: false,
})

export function cliJson<T>(stdout: unknown): T | null {
  if (typeof stdout !== 'string') return null
  try {
    return JSON.parse(stdout.slice(stdout.indexOf('{'))) as T
  } catch {
    return null
  }
}

// lightning-cli reports an RPC error as a JSON object on stdout, exit code 1, sometimes after `# …` progress lines.
export const errorMessage = (res: { stdout: unknown; stderr: unknown }) => {
  const raw = String(res.stdout || res.stderr).trim()
  const parsed = cliJson<{ message?: unknown }>(raw)
  return parsed?.message ? String(parsed.message) : raw || 'unknown'
}

/**
 * bitcoind's RPC bridge address, resolved through `sdk.host.getBridgeAddress` and
 * split into the `{ host, port }` pair lightningd's config, teos.toml, and the
 * sync health check consume. `.const()` stays churn-free: bitcoind's assigned
 * RPC port persists across its updates/restarts, so CLN restarts only if
 * bitcoind is (re)installed on a new port. `null` while bitcoind's binding is
 * absent, so callers omit the address rather than writing a placeholder.
 */
export const bitcoindRpcBridge = async (effects: T.Effects) => {
  const addr = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'bitcoind',
      hostId: btcRpcHostId,
      internalPort: btcRpcPort,
      ssl: false,
    })
    .const()
  if (!addr) return null
  const [host, port] = addr.split(':')
  return { host, port: Number(port) }
}
