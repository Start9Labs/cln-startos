import { writeFile } from 'fs/promises'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'

export const setupCerts = sdk.setupOnInit(async (effects) => {
  const hostnames = [
    'c-lightning.startos',
    await sdk.getContainerIp(effects).const(),
  ]
  const certs = await sdk.getSslCerificate(effects, hostnames).const()
  const fullChain = certs.join('')
  const caPem = certs[0]
  const key = await sdk.getSslKey(effects, { hostnames })

  await writeFile(`/media/startos/volumes/main/ca.pem`, caPem)
  await writeFile(`/media/startos/volumes/main/ca-key.pem`, key)

  await writeFile(`/media/startos/volumes/main/server.pem`, fullChain)
  await writeFile(`/media/startos/volumes/main/server-key.pem`, key)

  await writeFile(`/media/startos/volumes/main/client.pem`, fullChain)
  await writeFile(`/media/startos/volumes/main/client-key.pem`, key)
})
