import { matches, types as T, util, YAML } from "../deps.ts";
import { lazy } from "../models/lazy.ts";
import { setConfigMatcher } from "./getConfig.ts";
const { shape, string, number, boolean } = matches;

const nodeInfoMatcher = shape(
  {
    id: string,
    alias: string,
  },
  ["alias"]
);

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
  effects: T.Effects
) => {
  if (
    (await util.exists(effects, {
      volumeId: "main",
      path: "start9/lightningGetInfo",
    })) === false
  ) {
    return noPropertiesFound;
  }
  if (
    (await util.exists(effects, {
      volumeId: "main",
      path: "start9/peerTorAddress",
    })) === false
  ) {
    return noPropertiesFound;
  }
  if (
    (await util.exists(effects, {
      volumeId: "main",
      path: "start9/clamsRemoteWebsocketTorAddress",
    })) === false
  ) {
    return noPropertiesFound;
  }
  if (
    (await util.exists(effects, {
      volumeId: "main",
      path: "start9/watchtowerTorAddress",
    })) === false
  ) {
    return noPropertiesFound;
  }
  if (
    (await util.exists(effects, {
      volumeId: "main",
      path: "start9/watchtowerTorAddress",
    })) === false
  ) {
    return noPropertiesFound;
  }

  const nodeInfo = nodeInfoMatcher.unsafeCast(
    await effects.readJsonFile({
      volumeId: "main",
      path: "start9/lightningGetInfo",
    })
  );
  const peerTorAddress = await effects
    .readFile({
      volumeId: "main",
      path: "start9/peerTorAddress",
    })
    .then((x) => x.trim());
  const clamsRemoteWebsocketTorAddress = await effects
    .readFile({
      volumeId: "main",
      path: "start9/clamsRemoteWebsocketTorAddress",
    })
    .then((x) => x.trim());
  const watchtowerTorAddress = await effects
    .readFile({
      volumeId: "main",
      path: "start9/watchtowerTorAddress",
    })
    .then((x) => x.trim());
  const clnRestTorAddress = await effects
    .readFile({
      volumeId: "main",
      path: "start9/clnRestTorAddress",
    })
    .then((x) => x.trim());
  const clnRestRune = await effects
    .readFile({
      volumeId: "main",
      path: "public/clnrest_rune",
    })
    .then((x) => {
      const trimmed = x.trim();
      const rune = trimmed.split(/=(.+)/)[1].replace(/"/g, "");
      return rune;
    });
  const config = setConfigMatcher.unsafeCast(
    YAML.parse(
      await effects.readFile({
        path: "start9/config.yaml",
        volumeId: "main",
      })
    )
  );
  const hexMacaroon = lazy(() =>
    effects.readFile({
      path: "start9/access.macaroon.hex",
      volumeId: "main",
    })
  );

  let watchtowerProperties: T.PackagePropertiesV2 = {};
  if (config.watchtowers["wt-server"]) {
    watchtowerProperties = await effects
      .readFile({
        volumeId: "main",
        path: "start9/teosTowerInfo",
      })
      .then(JSON.parse)
      .then((x) => towerInfoMatcher.unsafeCast(x))
      .then(
        (towerInfo) =>
          ({
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
          } as const)
      )
      .catch(() => noTeosInfoFound);
  }

  let wtClientProperties: T.PackagePropertiesV2 = {};
  if (config.watchtowers["wt-client"].enabled == "enabled") {
    wtClientProperties = await effects
      .readFile({
        volumeId: "main",
        path: "start9/wtClientInfo",
      })
      .then(JSON.parse)
      .then((dataIn) => {
        if (config.watchtowers["wt-client"].enabled == "enabled") {
          for (const tower of config.watchtowers["wt-client"][
            "add-watchtowers"
          ]) {
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
        }
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
              Status: {
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

  const result: T.Properties = {
    version: 2,
    data: {
      "Node ID": {
        type: "string",
        value: nodeInfo.id,
        description:
          "The node identifier that can be used for connecting to other nodes",
        copyable: true,
        qr: false,
        masked: false,
      },
      "Node URI": {
        type: "string",
        value: `${nodeInfo.id}@${peerTorAddress}`,
        description:
          "Share this URI with others so they can add your CLN node as a peer",
        copyable: true,
        qr: true,
        masked: true,
      },
      ...(config.advanced["clams-remote-websocket"]
        ? {
            "Clams Remote Websocket URI": {
              type: "string",
              value: `${nodeInfo.id}@${clamsRemoteWebsocketTorAddress}:7272`,
              description:
                "The URI needed by Clams Remote to connect to Core Lightning's websocket interface.",
              copyable: true,
              qr: true,
              masked: true,
            },
          }
        : {}),
      "UI Password": {
        type: "string",
        value: config["ui-password"],
        description: "The password for your CLN UI",
        copyable: true,
        qr: true,
        masked: true,
      },
      ...(config.advanced.plugins.clnrest
        ? {
            "CLNRest Quick Connect": {
              type: "string",
              value: `clnrest://${clnRestTorAddress}:3010?rune=${clnRestRune}`,
              description:
                "URI to connect a wallet to Core Lightning's CLNRest interface remotely via Tor",
              copyable: true,
              qr: true,
              masked: true,
            },
          }
        : {}),
      ...(config.watchtowers["wt-server"]
        ? {
            "Watchtower Server Properties": {
              type: "object",
              value: watchtowerProperties,
              description:
                "Properties of your The Eye of Satoshi watchtower server",
            },
          }
        : {}),
      ...(config.watchtowers["wt-client"].enabled == "enabled"
        ? {
            "Watchtower Client Properties": {
              type: "object",
              value: wtClientProperties,
              description:
                "Status of watchtowers registered with the watchtower client plugin. Configure these in the watchtower section of your CLN configuration settings.",
            },
          }
        : {}),
    },
  };
  return { result };
};
