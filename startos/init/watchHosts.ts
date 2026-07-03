import { clnConfig } from '../fileModels/config'
import { peerHostId, peerInterfaceId } from '../interfaces'
import { sdk } from '../sdk'
import { bitcoindRpcBridge } from '../utils'

export const watchHosts = sdk.setupOnInit(async (effects, _) => {
  const torIp = await sdk.getContainerIp(effects, { packageId: 'tor' }).const()

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

  // bitcoind's RPC over the bridge (replaces the enforced bitcoind.startos:8332).
  const bitcoind = await bitcoindRpcBridge(effects)

  await clnConfig.merge(
    effects,
    {
      raw: {
        proxy: torIp ? `${torIp}:9050` : undefined,
        'announce-addr': peerAddresses,
        ...(bitcoind && {
          'bitcoin-rpcconnect': bitcoind.host,
          'bitcoin-rpcport': bitcoind.port,
        }),
      },
    },
    { allowWriteAfterConst: true },
  )
})
