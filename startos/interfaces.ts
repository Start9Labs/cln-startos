import { readFile } from 'fs/promises'
import { clnConfig } from './fileModels/config'
import { parse } from 'dotenv'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import {
  uiPort,
  rpcPort,
  peerPort,
  clnrestPort,
  watchtowerPort,
  grpcPort,
  websocketPort,
} from './utils'
import { FileHelper } from '@start9labs/start-sdk'

export const peerInterfaceId = 'peer'
export const teosInterfaceId = 'watchtower'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const receipts = []

  // UI
  const uiMulti = sdk.MultiHost.of(effects, 'web-ui')
  const uiMultiOrigin = await uiMulti.bindPort(uiPort, {
    protocol: 'http',
    preferredExternalPort: uiPort,
  })
  const ui = sdk.createInterface(effects, {
    name: 'Web UI',
    id: 'ui',
    description: 'The web interface of CLN',
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const uiReceipt = await uiMultiOrigin.export([ui])
  receipts.push(uiReceipt)

  // RPC
  const rpcMulti = sdk.MultiHost.of(effects, 'rpc')
  const rpcMultiOrigin = await rpcMulti.bindPort(rpcPort, {
    protocol: 'http',
    preferredExternalPort: rpcPort,
  })
  const rpc = sdk.createInterface(effects, {
    name: 'RPC',
    id: 'rpc',
    description: 'Listens for JSON-RPC commands over HTTP.',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const rpcReceipt = await rpcMultiOrigin.export([rpc])
  receipts.push(rpcReceipt)

  // Peer
  const peerMulti = sdk.MultiHost.of(effects, 'peer')
  const peerMultiOrigin = await peerMulti.bindPort(peerPort, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: peerPort,
    secure: { ssl: false },
  })
  const peer = sdk.createInterface(effects, {
    name: 'Peer',
    id: peerInterfaceId,
    description: 'Listens for incoming connections from lightning peers.',
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: '',
    path: '',
    query: {},
  })
  const peerReceipt = await peerMultiOrigin.export([peer])
  receipts.push(peerReceipt)

  // gRPC
  const grpcMulti = sdk.MultiHost.of(effects, 'grpc')
  const grpcMultiOrigin = await grpcMulti.bindPort(grpcPort, {
    protocol: 'https',
    preferredExternalPort: grpcPort,
    addSsl: {
      alpn: null,
      preferredExternalPort: grpcPort,
    },
  })
  const grpc = sdk.createInterface(effects, {
    name: 'grpc',
    id: 'grpc',
    description:
      'gRPC is a Rust-based plugin that provides a standardized API that apps, plugins, and other tools could use to interact with Core Lightning securely.',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const grpcReceipt = await grpcMultiOrigin.export([grpc])
  receipts.push(grpcReceipt)

  const conf = await clnConfig.read().const(effects)

  // clnrest
  if (conf && conf['clnrest-host'] && conf['clnrest-port']) {
    try {
      const clnrestMulti = sdk.MultiHost.of(effects, 'clnrest')
      const clnrestMultiOrigin = await clnrestMulti.bindPort(clnrestPort, {
        protocol: 'https',
        preferredExternalPort: clnrestPort,
        addSsl: {
          alpn: null,
          preferredExternalPort: clnrestPort,
        },
      })

      await FileHelper.string('/media/startos/volumes/main/.commando-env')
        .read()
        .const(effects)

      const contents = await readFile(
        '/media/startos/volumes/main/.commando-env',
        'utf-8',
      )
      const rune = parse(contents)['LIGHTNING_RUNE']

      console.log('Rune: ', rune)

      const clnrest = sdk.createInterface(effects, {
        name: 'CLNrest',
        id: 'clnrest',
        description:
          'CLNRest is a lightweight Python-based built-in Core Lightning plugin (from v23.08) that transforms RPC calls into a REST service.',
        type: 'api',
        masked: false,
        schemeOverride: { ssl: 'clnrest', noSsl: 'clnrest' },
        username: null,
        path: '',
        query: { rune: rune ? rune : 'Error parsing Rune' },
      })
      const clnrestReceipt = await clnrestMultiOrigin.export([clnrest])
      receipts.push(clnrestReceipt)
    } catch {
      console.log('Rune not found')
    }
  }

  // websocket (clams)
  if (conf && conf['bind-addr'].includes('ws::7272')) {
    const websocketMulti = sdk.MultiHost.of(effects, 'websocket')
    const websocketMultiOrigin = await websocketMulti.bindPort(websocketPort, {
      protocol: 'http',
      preferredExternalPort: websocketPort,
    })
    const websocket = sdk.createInterface(effects, {
      name: 'Clams Websocket',
      id: 'websocket',
      description: 'Websocket endpoint for Clams Remote.',
      type: 'api',
      masked: false,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    })
    const websocketReceipt = await websocketMultiOrigin.export([websocket])
    receipts.push(websocketReceipt)
  }

  const watchtowerServerEnabled = await storeJson
    .read((e) => e.watchtowerServer)
    .const(effects)

  // watchtower
  if (watchtowerServerEnabled) {
    const watchtowerMulti = sdk.MultiHost.of(effects, 'watchtower')
    const watchtowerMultiOrigin = await watchtowerMulti.bindPort(
      watchtowerPort,
      {
        protocol: null,
        addSsl: null,
        preferredExternalPort: watchtowerPort,
        secure: null,
      },
    )
    const watchtower = sdk.createInterface(effects, {
      name: 'TEOS Watchtower',
      id: teosInterfaceId,
      description:
        'The Eye of Satoshi is a Lightning watchtower compliant with BOLT13, written in Rust.',
      type: 'api',
      masked: false,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    })
    const watchtowerReceipt = await watchtowerMultiOrigin.export([watchtower])
    receipts.push(watchtowerReceipt)
  }

  return receipts
})
