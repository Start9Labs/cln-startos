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

  // Onions and IPs are kept apart because a custom external host replaces the
  // IPs (below). Domains are excluded: lightningd resolves a bare hostname and
  // announces the address it resolves to, which for a StartOS domain is the
  // public IP already in this list.
  const peerAddresses = await sdk.host
    .getOwn(effects, peerHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === peerInterfaceId)
      if (!iface) return { onions: [], ips: [] }
      const publicInfo = iface.addressInfo.public.filter({
        exclude: { kind: 'domain' },
      })
      return {
        onions: publicInfo
          .filter({
            predicate: ({ metadata }) =>
              metadata.kind === 'plugin' && metadata.packageId === 'tor',
          })
          .format(),
        ips: publicInfo.filter({ kind: 'ip' }).format(),
      }
    })
    .const()

  const customExternalHosts =
    (await storeJson.read((s) => s.customExternalHosts).const(effects)) ?? []

  // `always-use-proxy` disables lightningd's DNS lookups, and an announce-addr
  // it cannot resolve is a fatal parse error, not a warning — writing the host
  // anyway would leave lightningd refusing to start, so drop it instead. The
  // `custom-external-host` health check in main.ts reports the same condition.
  const torOnly = await clnConfig
    .read((c) => c['tor-only'] === true)
    .const(effects)
  const externalHosts = torOnly ? [] : customExternalHosts

  // A tunnel endpoint stands in for this server's own address, so it replaces
  // the detected public IPs rather than joining them — announcing both hands
  // peers the home IP the tunnel exists to hide.
  const announceAddr = [
    ...peerAddresses.onions,
    ...(externalHosts.length ? externalHosts : peerAddresses.ips),
  ]

  // bitcoind's RPC over the bridge; absent until it resolves. Writing undefined
  // clears the keys when bitcoind is uninstalled so no stale address latches,
  // and lightningd fails to connect naturally until the .const() heal fires.
  const bitcoind = await bitcoindRpcBridge(effects)

  await clnConfig.merge(
    effects,
    {
      raw: {
        proxy,
        'announce-addr': [...new Set(announceAddr)],
        'bitcoin-rpcconnect': bitcoind?.host,
        'bitcoin-rpcport': bitcoind?.port,
      },
    },
    { allowWriteAfterConst: true },
  )
})
