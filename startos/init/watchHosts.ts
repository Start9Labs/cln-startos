import { socksHostId, socksPort } from 'tor-startos/startos/utils'
import { clnConfig } from '../fileModels/config'
import { peerHostId, peerInterfaceId } from '../interfaces'
import { sdk } from '../sdk'
import { bitcoindRpcBridge, bridgeAddress } from '../utils'

export const watchHosts = sdk.setupOnInit(async (effects, _) => {
  // Tor SOCKS over the bridge. With the 9050 fallback the mapped value is a
  // constant, non-null `<osIp>:9050` across tor install/update/uninstall, so
  // lightningd's `proxy` is always set and this never restarts CLN on tor
  // churn. A dead bridge address is just connection-refused; `always-use-proxy`
  // is unset by default, so clearnet peers still connect when tor is absent.
  const proxy = await bridgeAddress(effects, {
    packageId: 'tor',
    hostId: socksHostId,
    internalPort: socksPort,
    fallbackPort: socksPort,
  }).const()

  const peerAddresses = await sdk.host
    .getOwn(effects, peerHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === peerInterfaceId)
      return iface
        ? iface.addressInfo.public
            .filter({ exclude: { kind: 'domain' } })
            .format()
        : []
    })
    .const()

  // bitcoind's RPC over the bridge; loopback placeholder until it resolves so a
  // null (bitcoind absent) reconfigures rather than latching a stale address.
  const bitcoind = await bitcoindRpcBridge(effects)

  await clnConfig.merge(
    effects,
    {
      raw: {
        proxy,
        'announce-addr': peerAddresses,
        'bitcoin-rpcconnect': bitcoind?.host ?? '127.0.0.1',
        'bitcoin-rpcport': bitcoind?.port ?? 8332,
      },
    },
    { allowWriteAfterConst: true },
  )
})
