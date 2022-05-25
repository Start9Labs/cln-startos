// @ts-check

import matches from "https://deno.land/x/ts_matches/mod.ts";
import * as YAML from "https://deno.land/std@0.140.0/encoding/yaml.ts";
const { shape, number, string, some, arrayOf, boolean } = matches;

/**
 * @typedef {import('https://raw.githubusercontent.com/Start9Labs/embassy-os/fix/making-js-work/backend/test/js_action_execute/package-data/scripts/test-package/0.3.0.3/types.d.ts').Effects} Effects
 * @typedef {import('https://raw.githubusercontent.com/Start9Labs/embassy-os/fix/making-js-work/backend/test/js_action_execute/package-data/scripts/test-package/0.3.0.3/types.d.ts').ConfigRes} ConfigRes
 * @typedef {import('https://raw.githubusercontent.com/Start9Labs/embassy-os/fix/making-js-work/backend/test/js_action_execute/package-data/scripts/test-package/0.3.0.3/types.d.ts').Config} Config
 * @typedef {import('https://raw.githubusercontent.com/Start9Labs/embassy-os/fix/making-js-work/backend/test/js_action_execute/package-data/scripts/test-package/0.3.0.3/types.d.ts').SetResult} SetResult
 * @typedef {import('https://raw.githubusercontent.com/Start9Labs/embassy-os/fix/making-js-work/backend/test/js_action_execute/package-data/scripts/test-package/0.3.0.3/types.d.ts').Properties} Properties
 * @typedef {import('https://raw.githubusercontent.com/Start9Labs/embassy-os/fix/making-js-work/backend/test/js_action_execute/package-data/scripts/test-package/0.3.0.3/types.d.ts').Dependencies} Dependencies
 */

const matchesStringRec = some(
  string,
  shape(
    {
      charset: string,
      len: number,
    },
    ["charset"]
  )
);
const matchesConfigRec = shape({
  username: matchesStringRec,
  password: matchesStringRec,
});

const matchesConfigFile = shape({
  username: string,
  password: string,
});

/**
 *
 * @param {Effects} effects
 * @returns {Promise<ConfigRes>}
 */
export async function getConfig(effects) {
  return {
    spec: {
      "peer-tor-address": {
        name: "Peer Tor Address",
        description: "The Tor address of the peer interface",
        type: "pointer",
        subtype: "package",
        "package-id": "c-lightning",
        target: "tor-address",
        interface: "peer",
      },
      "rpc-tor-address": {
        name: "RPC Tor Address",
        description: "The Tor address of the RPC interface",
        type: "pointer",
        subtype: "package",
        "package-id": "c-lightning",
        target: "tor-address",
        interface: "rpc",
      },
      alias: {
        type: "string",
        name: "Alias",
        description: "Recognizable name for the Lightning Network",
        nullable: true,
        pattern: ".{1,32}",
        "pattern-description": "Must be at least 1 character and no more than 32 characters",
      },
      color: {
        type: "string",
        name: "Color",
        description: "Color value for the Lightning Network",
        nullable: false,
        pattern: "[0-9a-fA-F]{6}",
        "pattern-description":
          "Must be a valid 6 digit hexadecimal RGB value. The first two digits are red, middle two are green and final two are\nblue\n",
        default: {
          charset: "a-f,0-9",
          len: 6,
        },
      },
      bitcoind: {
        type: "union",
        name: "Bitcoin Core",
        description:
          "The Bitcoin Core node to connect to:\n  - Internal: The Bitcoin Core RPC Proxy service installed to your Embassy\n  - External: An unpruned Bitcoin Core node running on a different device\n",
        tag: {
          id: "type",
          name: "Type",
          "variant-names": {
            internal: "Internal (Bitcoin Core)",
            "internal-proxy": "Internal (Bitcoin Proxy)",
            external: "External",
          },
          description:
            "The Bitcoin Core node to connect to:\n  - Internal (Bitcoin Core): The Bitcoin Core service installed to your Embassy\n  - Internal (Bitcoin Proxy): The Bitcoin RPC Proxy service installed to your Embassy\n  - External: An unpruned Bitcoin Core node running on a different device\n",
        },
        default: "internal",
        variants: {
          internal: {
            user: {
              type: "pointer",
              name: "RPC Username",
              description: "The username for Bitcoin Core's RPC interface",
              subtype: "package",
              "package-id": "bitcoind",
              target: "config",
              multi: false,
              selector: "$.rpc.username",
            },
            password: {
              type: "pointer",
              name: "RPC Password",
              description: "The password for Bitcoin Core's RPC interface",
              subtype: "package",
              "package-id": "bitcoind",
              target: "config",
              multi: false,
              selector: "$.rpc.password",
            },
          },
          "internal-proxy": {
            user: {
              type: "pointer",
              name: "RPC Username",
              description: "The username for the RPC user allocated to c-lightning",
              subtype: "package",
              "package-id": "btc-rpc-proxy",
              target: "config",
              selector: '$.users[?(@.name == "c-lightning")].name',
              multi: false,
            },
            password: {
              type: "pointer",
              name: "RPC Password",
              description: "The password for the RPC user allocated to c-lightning",
              subtype: "package",
              "package-id": "btc-rpc-proxy",
              target: "config",
              selector: '$.users[?(@.name == "c-lightning")].password',
              multi: false,
            },
          },
          external: {
            "connection-settings": {
              type: "union",
              name: "Connection Settings",
              description: "Information to connect to an external unpruned Bitcoin Core node",
              tag: {
                id: "type",
                name: "Type",
                description:
                  "- Manual: Raw information for finding a Bitcoin Core node\n- Quick Connect: A Quick Connect URL for a Bitcoin Core node\n",
                "variant-names": {
                  manual: "Manual",
                  "quick-connect": "Quick Connect",
                },
              },
              default: "quick-connect",
              variants: {
                manual: {
                  address: {
                    type: "string",
                    name: "Public Address",
                    description: "The public address of your Bitcoin Core RPC server",
                    nullable: false,
                  },
                  user: {
                    type: "string",
                    name: "RPC Username",
                    description: "The username for the RPC user on your Bitcoin Core RPC server",
                    nullable: false,
                  },
                  password: {
                    type: "string",
                    name: "RPC Password",
                    description: "The password for the RPC user on your Bitcoin Core RPC server",
                    nullable: false,
                    masked: true,
                  },
                },
                "quick-connect": {
                  "quick-connect-url": {
                    type: "string",
                    name: "Quick Connect URL",
                    description: "The Quick Connect URL for your Bitcoin Core RPC server",
                    nullable: false,
                    pattern: "btcstandup://[^:]*:[^@]*@[a-zA-Z0-9.-]+:[0-9]+(/(\\?(label=.+)?)?)?",
                    "pattern-description":
                      "Must be a valid Quick Connect URL. For help, check out https://github.com/BlockchainCommons/Gordian/blob/master/Docs/Quick-Connect-API.md",
                  },
                },
              },
            },
          },
        },
      },
      rpc: {
        type: "object",
        name: "RPC Options",
        description: "Options for the HTTP RPC interface",
        spec: {
          enabled: {
            type: "boolean",
            name: "Enable",
            description: "Whether to enable the RPC webserver",
            default: true,
          },
          user: {
            type: "string",
            name: "RPC Username",
            description: "The username for the RPC user on your c-lightning node",
            nullable: false,
            default: "lightning",
            copyable: true,
          },
          password: {
            type: "string",
            name: "RPC Password",
            description: "The password for the RPC user on your c-lightning node",
            nullable: false,
            default: {
              charset: "a-z,A-Z,0-9",
              len: 22,
            },
            copyable: true,
            masked: true,
          },
        },
      },
      advanced: {
        type: "object",
        name: "Advanced",
        description: "Advanced Options",
        spec: {
          "tor-only": {
            type: "boolean",
            name: "Only Use Tor",
            description: "Use Tor for outgoing connections",
            default: false,
          },
          "fee-base": {
            type: "number",
            name: "Routing Base Fee",
            description: "The base fee in millisatoshis you will charge for forwarding payments on your channels.\n",
            nullable: false,
            range: "[0,*)",
            integral: true,
            default: 1000,
            units: "millisatoshis",
          },
          "fee-rate": {
            type: "number",
            name: "Routing Fee Rate",
            description:
              "The fee rate used when forwarding payments on your channels. The total fee charged is\nthe Base Fee + (amount * Fee Rate / 1,000,000), where the amount is the forwarded amount.\nMeasured in sats per million.\n",
            nullable: false,
            range: "[1,1000000)",
            integral: true,
            default: 1,
            units: "sats per million",
          },
          "min-capacity": {
            type: "number",
            name: "Minimum Channel Capacity",
            description:
              "This value defines the minimal effective channel capacity in satoshis to accept for channel opening requests.\nThis will reject any opening of a channel which can't pass an HTLC of at least this value. Usually this prevents\na peer opening a tiny channel, but it can also prevent a channel you open with a reasonable amount and the peer\nis requesting such a large reserve that the capacity of the channel falls below this.\n",
            nullable: false,
            range: "[1,16777215]",
            integral: true,
            default: 10000,
            units: "satoshis",
          },
          "ignore-fee-limits": {
            type: "boolean",
            name: "Ignore Fee Limits",
            description:
              "Allow nodes which establish channels to you to set any fee they want. This may result in a channel which cannot\nbe closed, should fees increase, but make channels far more reliable since c-lightning will never close it due\nto unreasonable fees.\n",
            default: false,
          },
          "funding-confirms": {
            type: "number",
            name: "Required Funding Confirmations",
            description:
              "Confirmations required for the funding transaction when the other side opens a channel before the channel is\nusable.\n",
            nullable: false,
            range: "[1,6]",
            integral: true,
            default: 3,
            units: "blocks",
          },
          "cltv-delta": {
            type: "number",
            name: "Time Lock Delta",
            description:
              "The number of blocks between the incoming payments and outgoing payments: this needs to be enough to make sure\nthat if it has to, c-lightning can close the outgoing payment before the incoming, or redeem the incoming once\nthe outgoing is redeemed.\n",
            nullable: false,
            range: "[6,144]",
            integral: true,
            default: 40,
            units: "blocks",
          },
          "wumbo-channels": {
            type: "boolean",
            name: "Enable Wumbo Channels",
            description:
              "Removes capacity limits for channel creation. Version 1.0 of the specification limited channel sizes to 16777215\nsatoshis. With this option (which your node will advertise to peers), your node will accept larger incoming\nchannels and if the peer supports it, will open larger channels.\n\nWarning: This is #Reckless and you should not enable it unless you deeply understand the risks associated with\nthe Lightning Network.\n",
            default: false,
          },
          experimental: {
            type: "object",
            name: "Experimental Features",
            description:
              "Experimental features that have not been standardized across Lightning Network implementations",
            spec: {
              "dual-fund": {
                type: "boolean",
                name: "Dual Funding",
                description:
                  "Enables the option to dual fund channels with other compatible lightning implementations using the v2\nchannel opening protocol\n",
                default: false,
              },
              "onion-messages": {
                type: "boolean",
                name: "Onion Messages",
                description: "Enable the sending, receiving, and relay of onion messages\n",
                default: false,
              },
              offers: {
                type: "boolean",
                name: "Offers",
                description:
                  "Enable the sending and receiving of offers (this requires Onion Messages to be enabled as well)\n",
                default: false,
              },
              "shutdown-wrong-funding": {
                type: "boolean",
                name: "Shutdown Wrong Funding",
                description: "Allow channel shutdown with alternate txids\n",
                default: false,
              },
            },
          },
          plugins: {
            type: "object",
            name: "Plugins",
            description:
              "Plugins are subprocesses that provide extra functionality and run alongside the lightningd process inside \nthe main C-Lightning container in order to communicate directly with it.\nTheir source is maintained separately from that of C-Lightning itself.\n",
            spec: {
              http: {
                type: "boolean",
                name: "Enable C-Lightning-HTTP-Plugin",
                description:
                  "This plugin is a direct proxy for the unix domain socket from the HTTP interface. \nIt is required for Spark Wallet to connect to C-Lightning.\n\nSource: https://github.com/Start9Labs/c-lightning-http-plugin\n",
                default: true,
              },
              rebalance: {
                type: "boolean",
                name: "Enable Rebalance Plugin",
                description:
                  "Enables the `rebalance` rpc command, which moves liquidity between your channels using circular payments.\nSee `help rebalance` on the CLI or in the Spark console for usage instructions.\n\nSource: https://github.com/lightningd/plugins/tree/master/rebalance\n",
                default: false,
              },
              summary: {
                type: "boolean",
                name: "Enable Summary Plugin",
                description:
                  "Enables the `summary` rpc command, which outputs a text summary of your node, including fiat amounts.\nCan be called via command line or the Spark console.        \n\nSource: https://github.com/lightningd/plugins/tree/master/summary\n",
                default: false,
              },
              rest: {
                type: "boolean",
                name: "Enable C-Lightning-REST Plugin",
                description:
                  "This plugin exposes an LND-like REST API. It is required for Ride The Lighting to connect to C-Lightning.\n\nSource: https://github.com/Ride-The-Lightning/c-lightning-REST\n",
                default: true,
              },
            },
          },
        },
      },
    },
  };
}

/**
 *
 * @param {Effects} effects
 * @param {Config} input
 * @returns {Promise<SetResult>}
 */
export async function setConfig(effects, input) {
  await effects.createDir({
    path: "start9",
    volumeId: "main",
  });
  await effects.writeFile({
    path: "start9/config.yaml",
    toWrite: YAML.stringify(input),
    volumeId: "main",
  });
  return {
    signal: "SIGTERM",
    "depends-on": {},
  };
}

const matchesSyncthingSystem = shape({
  myID: string,
});

// /**
//  *
//  * @param {Effects} effects
//  * @returns {Promise<Properties>}
//  */
// export async function properties(effects) {
//   const config_promise = effects
//     .readFile({
//       volumeId: "main",
//       path: "./start9/config.yaml",
//     })
//     .then((x) => YAML.parse(x))
//     .then((x) => matchesConfigFile.unsafeCast(x));

//   return {
//     version: 2,
//     data: {
//       "Device Id": {
//         type: "string",
//         value: syncthing_system.myID,
//         description: "his is the ID for syncthing to attach others to",
//         copyable: true,
//         qr: true,
//         masked: false,
//       },
//       Username: {
//         type: "string",
//         value: config.username,
//         description: "Username to login to the UI",
//         copyable: true,
//         qr: false,
//         masked: false,
//       },
//       Password: {
//         type: "string",
//         value: config.password,
//         description: "Password to login to the UI",
//         copyable: true,
//         qr: false,
//         masked: true,
//       },
//     },
//   };
// }

const matchConfigShape = shape({
  users: arrayOf(
    shape({
      name: string,
      "allowed-calls": arrayOf(string),
      password: string,
      "fetch-blocks": boolean,
    })
  ),
});

/**
 * @template T
 * @param {(i: number) => T} fn
 * @param {number} amount
 * @returns {Array<T>}
 */
function times(fn, amount) {
  const answer = new Array(amount);
  for (let i = 0; i < amount; i++) {
    answer[i] = fn(i);
  }
  return answer;
}

/**
 *
 * @param {string} input
 * @returns
 */
function randomItemString(input) {
  return input[Math.floor(Math.random() * input.length)];
}

const serviceName = "c-lightning";
const fullChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
/** @typedef {{
    currentError(config: Config): string | void ,
    fix(config: Config): void
  }} Check 
*/

/**
  @type {Array<Check>}
 */
const checks = [
  {
    currentError(config) {
      if (!matchConfigShape.test(config)) {
        return "Config is not the correct shape";
      }
      if (config.users.some((x) => x.name === serviceName)) {
        return;
      }
      return `Must have an RPC user named "c-lightning"`;
    },
    fix(config) {
      config.users.push({
        name: serviceName,
        "allowed-calls": [],
        password: times(() => randomItemString(fullChars), 22).join(""),
      });
    },
  },
  ...[
    "echo",
    "gettxout",
    "getblockchaininfo",
    "sendrawtransaction",
    "getblockhash",
    "getblock",
    "getblockcount",
    "estimatesmartfee",
    "getnetworkinfo",
  ].map(
    (operator) =>
      /** @type Check */ ({
        currentError(config) {
          if (!matchConfigShape.test(config)) {
            return "Config is not the correct shape";
          }
          if (
            config.users.find((x) => x.name === serviceName)?.["allowed-calls"]?.some((x) => x === operator) ??
            false
          ) {
            return;
          }
          return `RPC user "c-lightning" must have "${operator}" enabled`;
        },
        fix(config) {
          if (!matchConfigShape.test(config)) {
            throw new Error("Config is not the correct shape");
          }
          const found = config.users.find((x) => x.name === serviceName);
          if (!found) {
            throw new Error("Users for c-lightning should exist");
          }
          found["allowed-calls"].push(operator);
        },
      })
  ),
  {
    currentError(config) {
      if (!matchConfigShape.test(config)) {
        return "Config is not the correct shape";
      }
      if (config.users.find((x) => x.name === serviceName)?.["fetch-blocks"] ?? false) {
        return;
      }
      return `RPC user "c-lightning" must have "Fetch Blocks" enabled`;
    },
    fix(config) {
      if (!matchConfigShape.test(config)) {
        throw new Error("Config is not the correct shape");
      }
      const found = config.users.find((x) => x.name === serviceName);
      if (!found) {
        throw new Error("Users for c-lightning should exist");
      }
      found["fetch-blocks"] = true;
    },
  },
];

const matchBitcoindConfig = shape({
  advanced: shape({
    pruning: shape({
      mode: string,
    }),
  }),
});

/** @type {Dependencies} */
export const dependencies = {
  "btc-rpc-proxy": {
    async check(effects, configInput) {
      for (const checker of checks) {
        const error = checker.currentError(configInput);
        if (error) {
          throw error;
        }
      }
      return null;
    },
    async autoConfigure(effects, configInput) {
      for (const checker of checks) {
        const error = checker.currentError(configInput);
        if (error) {
          checker.fix(configInput);
        }
      }
      const config = matchBitcoindConfig.unsafeCast(configInput);
      config.advanced.pruning.mode = "disabled";
      return config;
    },
  },
  bitcoind: {
    async check(effects, configInput) {
      effects.error("check");
      const config = matchBitcoindConfig.unsafeCast(configInput);
      if (config.advanced.pruning.mode !== "disabled") {
        throw 'Pruning must be disabled to use Bitcoin Core directly. To use with a pruned node, set Bitcoin Core to "Internal (Bitcoin Proxy)" instead.';
      }
      return null;
    },
    async autoConfigure(effects, configInput) {
      effects.error("AutoCOnfigure");
      const config = matchBitcoindConfig.unsafeCast(configInput);
      config.advanced.pruning.mode = "disabled";
      return config;
    },
  },
};
