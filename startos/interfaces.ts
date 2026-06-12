import { clnConfig } from './fileModels/config'
import { parse } from 'dotenv'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
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
  })
  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: 'ui',
    description: i18n('The web interface of CLN'),
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
  })
  const rpc = sdk.createInterface(effects, {
    name: i18n('RPC'),
    id: 'rpc',
    description: i18n('Listens for JSON-RPC commands over HTTP.'),
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
    name: i18n('Peer'),
    id: peerInterfaceId,
    description: i18n('Listens for incoming connections from lightning peers.'),
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
  // cln-grpc terminates its own mutual TLS, so StartOS must pass the port
  // through untouched rather than terminate at the edge (which would present
  // the device cert and strip the client cert). protocol/addSsl null +
  // secure.ssl routes raw TCP / SNI passthrough; protocol 'https' does NOT —
  // the SDK still synthesizes an addSsl config for it, terminating the TLS.
  const grpcMultiOrigin = await grpcMulti.bindPort(grpcPort, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: grpcPort,
    secure: { ssl: true },
  })
  const grpc = sdk.createInterface(effects, {
    name: i18n('grpc'),
    id: 'grpc',
    description: i18n(
      'gRPC is a Rust-based plugin that provides a standardized API that apps, plugins, and other tools could use to interact with Core Lightning securely.',
    ),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const grpcReceipt = await grpcMultiOrigin.export([grpc])
  receipts.push(grpcReceipt)

  const conf = await clnConfig
    .read((c) => ({
      clnrest: c.clnrest,
      'clams-remote-websocket': c['clams-remote-websocket'],
    }))
    .const(effects)

  // clnrest
  if (conf?.clnrest) {
    const clnrestMulti = sdk.MultiHost.of(effects, 'clnrest')
    // clnrest is forced to plaintext (clnrest-protocol=http in the config) so
    // that a plain-HTTP endpoint exists for Tor onion services — Tor already
    // encrypts, and wallets like Zeus can't validate StartOS-issued certs.
    // LAN/clearnet still gets HTTPS via the StartOS-terminated SSL listener.
    const clnrestMultiOrigin = await clnrestMulti.bindPort(clnrestPort, {
      protocol: 'http',
      preferredExternalPort: clnrestPort,
      addSsl: {
        preferredExternalPort: clnrestPort,
        addXForwardedHeaders: false,
      },
    })

    const contents = await FileHelper.string(
      '/media/startos/volumes/main/.commando-env',
    )
      .read()
      .const(effects)

    if (contents) {
      const rune = parse(contents)['LIGHTNING_RUNE']

      const clnrest = sdk.createInterface(effects, {
        name: i18n('CLNrest'),
        id: 'clnrest',
        description: i18n(
          'CLNRest is a lightweight Python-based built-in Core Lightning plugin (from v23.08) that transforms RPC calls into a REST service.',
        ),
        type: 'api',
        masked: false,
        // Zeus's clnrest parser reads the transport protocol from the scheme:
        // clnrest+https:// / clnrest+http://. A bare clnrest:// is treated as
        // https, so the http (Tor) URL must carry the +http marker.
        schemeOverride: { ssl: 'clnrest+https', noSsl: 'clnrest+http' },
        username: null,
        path: '',
        query: { rune: rune ? rune : 'Error parsing Rune' },
      })
      const clnrestReceipt = await clnrestMultiOrigin.export([clnrest])
      receipts.push(clnrestReceipt)
    } else {
      console.log('Rune not found')
    }
  }

  // websocket (clams)
  if (conf?.['clams-remote-websocket']) {
    const websocketMulti = sdk.MultiHost.of(effects, 'websocket')
    const websocketMultiOrigin = await websocketMulti.bindPort(websocketPort, {
      protocol: 'http',
      preferredExternalPort: websocketPort,
    })
    const websocket = sdk.createInterface(effects, {
      name: i18n('Clams Websocket'),
      id: 'websocket',
      description: i18n('Websocket endpoint for Clams Remote.'),
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
      name: i18n('TEOS Watchtower'),
      id: teosInterfaceId,
      description: i18n(
        'The Eye of Satoshi is a Lightning watchtower compliant with BOLT13, written in Rust.',
      ),
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
