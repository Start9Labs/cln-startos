import { matches, types as T, util, YAML } from "../deps.ts";
import { lazy } from "../models/lazy.ts";
import { setConfigMatcher } from "./getConfig.ts";
import { getAlias } from "./getAlias.ts";
const { shape, string } = matches;

const nodeInfoMatcher = shape({
  id: string,
  alias: string,
}, ["alias"]);

const towerInfoMatcher = shape({
  tower_id: string,
});

const noPropertiesFound: T.ResultType<T.Properties> = {
  result: {
    version: 2,
    data: {
      "Not Ready": {
        type: "string",
        value: "Could not find properties. The service might still be starting",
        qr: false,
        copyable: false,
        masked: false,
        description: "Fallback Message When Properties could not be found",
      },
    },
  },
} as const;

const noTeosInfoFound: T.PackagePropertiesV2 = {
  "Watchtower Server Uri": {
    type: "string",
    value: "Waiting for watchtower to start...",
    description:
      "Once your watchtower server has started and synced to the blockchain, this field will contain its shareable URI",
    copyable: false,
    qr: false,
    masked: false,
  },
} as const;

export const properties: T.ExpectedExports.properties = async (
  effects: T.Effects,
) => {
  if (
    await util.exists(effects, {
      volumeId: "main",
      path: "start9/lightningGetInfo",
    }) === false
  ) {
    return noPropertiesFound;
  }
  if (
    await util.exists(effects, {
      volumeId: "main",
      path: "start9/peerTorAddress",
    }) === false
  ) {
    return noPropertiesFound;
  }
  if (
    await util.exists(effects, {
      volumeId: "main",
      path: "start9/restTorAddress",
    }) === false
  ) {
    return noPropertiesFound;
  }
  if (
    await util.exists(effects, {
      volumeId: "main",
      path: "start9/watchtowerTorAddress",
    }) === false
  ) {
    return noPropertiesFound;
  }

  const nodeInfo = nodeInfoMatcher.unsafeCast(
    await effects.readJsonFile({
      volumeId: "main",
      path: "start9/lightningGetInfo",
    }),
  );
  const peerTorAddress = await effects
    .readFile({
      volumeId: "main",
      path: "start9/peerTorAddress",
    })
    .then((x) => x.trim());
  const restTorAddress = await effects
    .readFile({
      volumeId: "main",
      path: "start9/restTorAddress",
    })
    .then((x) => x.trim());
  const watchtowerTorAddress = await effects
    .readFile({
      volumeId: "main",
      path: "start9/watchtowerTorAddress",
    })
    .then((x) => x.trim());
  const config = setConfigMatcher.unsafeCast(
    YAML.parse(
      await effects.readFile({
        path: "start9/config.yaml",
        volumeId: "main",
      }),
    ),
  );
  const macaroonBase64 = lazy(() =>
    effects.readFile({
      path: "start9/access.macaroon.base64",
      volumeId: "main",
    })
  );
  const hexMacaroon = lazy(() =>
    effects.readFile({
      path: "start9/access.macaroon.hex",
      volumeId: "main",
    })
  );

  const rpcProperties: T.PackagePropertiesV2 = !config.rpc.enabled ? {} : {
    "Quick Connect URL": {
      type: "string",
      value:
        `clightning-rpc://${config.rpc.user}:${config.rpc.password}@${peerTorAddress}:8080`,
      description: "A convenient way to connect a wallet to a remote node",
      copyable: true,
      qr: true,
      masked: true,
    },
    "RPC Username": {
      type: "string",
      value: config.rpc.user,
      description: "Username for RPC connections",
      copyable: true,
      qr: false,
      masked: true,
    },
    "RPC Password": {
      type: "string",
      value: config.rpc.password,
      description: "Password for RPC connections",
      copyable: true,
      qr: false,
      masked: true,
    },
  };

  const restProperties: T.PackagePropertiesV2 = !config.advanced.plugins.rest
    ? {}
    : {
      "Rest API Port": {
        type: "string",
        value: "3001",
        description: "The port your c-lightning-REST API is listening on",
        copyable: true,
        qr: false,
        masked: false,
      },
      "Rest API Macaroon": {
        type: "string",
        value: await macaroonBase64.val(),
        description:
          "The macaroon that grants access to your node's REST API plugin",
        copyable: true,
        qr: false,
        masked: true,
      },
      "Rest API Macaroon (Hex)": {
        type: "string",
        value: await hexMacaroon.val(),
        description:
          "The macaroon that grants access to your node's REST API plugin, in hexadecimal format",
        copyable: true,
        qr: false,
        masked: true,
      },
      "REST API Quick Connect URL": {
        type: "string",
        value:
          `c-lightning-rest://${restTorAddress}:3001?&macaroon=${await hexMacaroon
            .val()}`,
        description:
          "A copyable string/scannable QR code you can import into wallet client applications such as Zeus",
        copyable: true,
        qr: true,
        masked: true,
      },
    };

  let watchtowerProperties: T.PackagePropertiesV2 = {};
  if (config.watchtowers["wt-server"]) {
    watchtowerProperties = await effects
      .readFile({
        volumeId: "main",
        path: "start9/teosTowerInfo",
      })
      .then(JSON.parse)
      .then((x) => towerInfoMatcher.unsafeCast(x))
      .then((towerInfo) => ({
        "Watchtower Server Uri": {
          type: "string",
          value: `${towerInfo.tower_id}@${watchtowerTorAddress}`,
          description:
            "Share this Watchtower Server URI to allow other CLN nodes to register their watchtower clients with your watchtower",
          copyable: true,
          qr: true,
          masked: true,
        },
      } as const))
      .catch(() => noTeosInfoFound);
  }

  const alias = await getAlias(effects, config);
  const result: T.Properties = {
    version: 2,
    data: {
      "Node Id": {
        type: "string",
        value: nodeInfo.id,
        description:
          "The node identifier that can be used for connecting to other nodes",
        copyable: true,
        qr: false,
        masked: false,
      },
      "Node Uri": {
        type: "string",
        value: `${nodeInfo.id}@${peerTorAddress}`,
        description: "Enables connecting to another remote node",
        copyable: true,
        qr: true,
        masked: true,
      },
      "Node Alias": {
        type: "string",
        value: alias,
        description: "The friendly identifier for your node",
        copyable: true,
        qr: false,
        masked: false,
      },
      ...rpcProperties,
      ...restProperties,
      ...watchtowerProperties,
    },
  };
  return { result };
};
