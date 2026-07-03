import { T } from '@start9labs/start-sdk'
import {
  rpcHostId as btcRpcHostId,
  rpcInterfaceId as btcRpcInterfaceId,
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
 * bitcoind's RPC endpoint over the LXC bridge (host + proxy port), replacing the
 * deprecated `bitcoind.startos:8332`. `undefined` until the dependency's
 * interface is available.
 */
export const bitcoindRpcBridge = (effects: T.Effects) =>
  sdk.host
    .get(effects, { hostId: btcRpcHostId, packageId: 'bitcoind' }, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === btcRpcInterfaceId)
      const h =
        iface &&
        iface.addressInfo
          .filter({
            kind: 'bridge',
            predicate: (hn) => hn.metadata.kind === 'ipv4' && !hn.ssl,
          })
          .hostnames[0]
      return h && h.port != null ? { host: h.hostname, port: h.port } : undefined
    })
    .const()
