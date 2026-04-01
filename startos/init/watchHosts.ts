import { clnConfig } from '../fileModels/config'
import { peerInterfaceId } from '../interfaces'
import { sdk } from '../sdk'

export const watchHosts = sdk.setupOnInit(async (effects, _) => {
  const torIp = await sdk.getContainerIp(effects, { packageId: 'tor' }).const()

  const peerAddresses =
    (await sdk.serviceInterface
      .getOwn(effects, peerInterfaceId, (i) =>
        i?.addressInfo?.public
          .filter({ exclude: { kind: 'domain' } })
          .format(),
      )
      .const()) || []

  await clnConfig.merge(
    effects,
    {
      raw: {
        proxy: torIp ? `${torIp}:9050` : undefined,
        'announce-addr': peerAddresses,
      },
    },
    { allowWriteAfterConst: true },
  )
})
