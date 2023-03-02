import { matches, types as T, util, YAML } from "../deps.ts";
import { lazy } from "../models/lazy.ts";
import { setConfigMatcher } from "./getConfig.ts";
import { getAlias } from "./getAlias.ts";
const { shape, string, number, boolean } = matches;

const nodeInfoMatcher = shape({
  id: string,
  alias: string,
}, ["alias"]);

const towerInfoMatcher = shape({
  tower_id: string,
  n_registered_users: number,
  n_watcher_appointments: number,
  n_responder_trackers: number,
  bitcoind_reachable: boolean,
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

const noWtClientInfoFound: T.PackagePropertiesV2 = {
  "Watchtower Client Data": {
    type: "string",
    value: "Waiting for watchtower client data to load...",
    description:
      "Once your watchtower client data has loaded, this field will contain its shareable URI",
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
        "Watchtower Server URI": {
          type: "string",
          value: `${towerInfo.tower_id}@${watchtowerTorAddress}:9814`,
          description:
            "Share this Watchtower Server URI to allow other CLN nodes to register their watchtower clients with your watchtower",
          copyable: true,
          qr: true,
          masked: true,
        },
        "Number of Registered Users": {
          type: "string",
          value: `${towerInfo.n_registered_users}`,
          description: "Number of users registered with your tower",
          copyable: false,
          qr: false,
          masked: false,
        },
        "Number of Watcher Appointments": {
          type: "string",
          value: `${towerInfo.n_watcher_appointments}`,
          description:
            "Number of channel states being watched, ready to submit the justice transaction should a breach be detected. There should be at most one of these per channel being watched.",
          copyable: false,
          qr: false,
          masked: false,
        },
        "Number of Responder Trackers": {
          type: "string",
          value: `${towerInfo.n_responder_trackers}`,
          description:
            "Number of active breaches in the process of being resolved. See for more info: https://github.com/talaia-labs/rust-teos/blob/43f99713159a63884e9c851134d126ca1ec48f7e/teos/src/responder.rs#L134-L136",
          copyable: false,
          qr: false,
          masked: false,
        },
        "Bitcoind Reachable": {
          type: "string",
          value: `${towerInfo.bitcoind_reachable}`,
          description:
            "Whether your tower has an active connection to the blockchain backend.",
          copyable: false,
          qr: false,
          masked: false,
        },
      } as const))
      .catch(() => noTeosInfoFound);
  }

  let wtClientProperties: T.PackagePropertiesV2 = {};
  if (config.watchtowers["wt-client"]) {
    wtClientProperties = await effects
      .readFile({
        volumeId: "main",
        path: "start9/wtClientInfo",
      })
      .then(JSON.parse)
      .then((dataIn) => {
        for (const tower of config.watchtowers["add-watchtowers"]) {
          const [pubkey, url] = tower.split("@");
          if (!(pubkey in dataIn)) {
            dataIn[pubkey] = {
              net_addr: url,
              available_slots: 0,
              subscription_start: 0,
              subscription_expiry: 0,
              status: "unreachable",
              pending_appointments: [],
              invalid_appointments: [],
            };
          }
        }
        return dataIn;
      })
      .then(Object.entries)
      .then((xs) =>
        xs.map(([key, value], i) => [
          `Watchtower ${i + 1}: ${key}`,
          {
            type: "object",
            value: {
              "Network Address": {
                type: "string",
                value: value.net_addr,
                description: "Network address the tower is listening on",
                copyable: true,
                qr: false,
                masked: false,
              },
              "Available Slots": {
                type: "string",
                value: value.available_slots,
                description: "Number of slots the tower has available",
                copyable: false,
                qr: false,
                masked: false,
              },
              "Subscription Start": {
                type: "string",
                value: value.subscription_start,
                description: "Block height when the subscription started",
                copyable: false,
                qr: false,
                masked: false,
              },
              "Subscription Expiry": {
                type: "string",
                value: value.subscription_expiry,
                description: "Block height when the subscription will expire",
                copyable: false,
                qr: false,
                masked: false,
              },
              "Status": {
                type: "string",
                value: value.status,
                description: "Whether the tower is reachable",
                copyable: false,
                qr: false,
                masked: false,
              },
            },
            description:
              "Details for each watchtower with which your client plugin has registered",
          },
        ])
      )
      .then(Object.fromEntries)
      .catch(() => noWtClientInfoFound);
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
      "Watchtower Server Properties": {
        type: "object",
        value: watchtowerProperties,
        description: "Properties of your The Eye of Satoshi watchtower server",
      },
      "Watchtower Client Properties": {
        type: "object",
        value: wtClientProperties,
        description:
          "Status of watchtowers registered with the watchtower client plugin. Configure these in the watchtower section of your CLN configuration settings.",
      },
    },
  };
  return { result };
};
