import { mkdir, writeFile } from 'fs/promises'
import { sdk } from '../sdk'

export const setupCerts = sdk.setupOnInit(async (effects) => {
  const hostnames = [
    'c-lightning.startos',
    await sdk.getContainerIp(effects).const(),
  ]
  const certs = await sdk.getSslCerificate(effects, hostnames).const()
  const fullChain = certs.join('')
  const caPem = certs[0]
  const key = await sdk.getSslKey(effects, { hostnames })
  await mkdir('/media/startos/volumes/main/bitcoin', { recursive: true })

  await writeFile(`/media/startos/volumes/main/bitcoin/ca.pem`, caPem)
  await writeFile(`/media/startos/volumes/main/bitcoin/ca-key.pem`, key)

  await writeFile(`/media/startos/volumes/main/bitcoin/server.pem`, fullChain)
  await writeFile(`/media/startos/volumes/main/bitcoin/server-key.pem`, key)

  await writeFile(`/media/startos/volumes/main/bitcoin/client.pem`, fullChain)
  await writeFile(`/media/startos/volumes/main/bitcoin/client-key.pem`, key)
})
