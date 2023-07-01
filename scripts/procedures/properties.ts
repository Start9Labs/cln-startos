import { matches, types as T, util, YAML } from "../deps.ts";
import { lazy } from "../models/lazy.ts";
import { setConfigMatcher } from "./getConfig.ts";
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
  if (
    await util.exists(effects, {
      volumeId: "main",
      path: "start9/restTorAddress",
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
  const config = setConfigMatcher.unsafeCast(
    YAML.parse(
      await effects.readFile({
        path: "start9/config.yaml",
        volumeId: "main",
      }),
    ),
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
  };

  // const sparkoProperties: T.PackagePropertiesV2 = !config.advanced.plugins.sparko.enabled ? {} : {
  //   "Sparko Quick Connect URL": {
  //     type: "string",
  //     value:
  //       `clightning-rpc://${config.advanced.plugins.sparko.user}:${config.advanced.plugins.sparko.password}@${peerTorAddress}:9737`,
  //     description: "A convenient way to connect a wallet to a remote node",
  //     copyable: true,
  //     qr: true,
  //     masked: true,
  //   },
  // };

  const restProperties: T.PackagePropertiesV2 = !config.advanced.plugins.rest
    ? {}
    : {
      "REST API Quick Connect URL": {
        type: "string",
        value:
          `c-lightning-rest://${restTorAddress}:3001?&macaroon=${await hexMacaroon.val()}`,
        description:
          "A copyable string/scannable QR code you can import into wallet client applications such as Zeus",
        copyable: true,
        qr: true,
        masked: true,
      },
    };
  const result: T.Properties = {
    version: 2,
    data: {
      "Node Uri": {
        type: "string",
        value: `${nodeInfo.id}@${peerTorAddress}`,
        description: "Enables connecting to another remote node",
        copyable: true,
        qr: true,
        masked: true,
      },
      ...rpcProperties,
      // ...sparkoProperties,
      ...restProperties,
    },
  };
  return { result };
};
