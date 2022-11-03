import { matches, types as T, util, YAML } from "../deps.ts";
import { lazy } from "../models/lazy.ts";
import { setConfigMatcher } from "../models/setConfig.ts";
import { getAlias } from "./getAlias.ts";
const { shape, string } = matches;

const nodeInfoMatcher = shape({
  id: string,
  alias: string,
}, ["alias"]);

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
    };
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
    },
  };
  return { result };
};
