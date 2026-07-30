import { socksHostId, socksPort } from 'tor-startos/startos/utils'
import { clnConfig } from '../fileModels/config'
import { storeJson } from '../fileModels/store.json'
import { peerHostId, peerInterfaceId } from '../interfaces'
import { sdk } from '../sdk'
import { bitcoindRpcBridge } from '../utils'

export const watchHosts = sdk.setupOnInit(async (effects, _) => {
  // Tor SOCKS over the bridge. With the 9050 fallback the resolved address is
  // a constant, non-null `<osIp>:9050` across tor install/update/uninstall, so
  // lightningd's `proxy` is always set and this never restarts CLN on tor
  // churn. A dead bridge address is just connection-refused; `always-use-proxy`
  // is unset by default, so clearnet peers still connect when tor is absent.
  const proxy = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'tor',
      hostId: socksHostId,
      internalPort: socksPort,
      fallbackPort: socksPort,
    })
    .const()

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

  const customExternalHosts =
    (await storeJson.read((s) => s.customExternalHosts).const(effects)) ?? []

  // bitcoind's RPC over the bridge; absent until it resolves. Writing undefined
  // clears the keys when bitcoind is uninstalled so no stale address latches,
  // and lightningd fails to connect naturally until the .const() heal fires.
  const bitcoind = await bitcoindRpcBridge(effects)

  await clnConfig.merge(
    effects,
    {
      raw: {
        proxy,
        'announce-addr': [...peerAddresses, ...customExternalHosts],
        'bitcoin-rpcconnect': bitcoind?.host,
        'bitcoin-rpcport': bitcoind?.port,
      },
    },
    { allowWriteAfterConst: true },
  )
})
