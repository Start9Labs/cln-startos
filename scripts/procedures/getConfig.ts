import { compat, matches, types as T, YAML } from "../deps.ts";

const { any, string, dictionary } = matches;

const matchConfig = dictionary([string, any]);

export const getConfig: T.ExpectedExports.getConfig = compat.getConfig({
  "peer-tor-address": {
    "name": "Peer Tor Address",
    "description": "The Tor address of the peer interface",
    "type": "pointer",
    "subtype": "package",
    "package-id": "c-lightning",
    "target": "tor-address",
    "interface": "peer",
  },
  "rpc-tor-address": {
    "name": "RPC Tor Address",
    "description": "The Tor address of the RPC interface",
    "type": "pointer",
    "subtype": "package",
    "package-id": "c-lightning",
    "target": "tor-address",
    "interface": "rpc",
  },
  "alias": {
    "type": "string",
    "name": "Alias",
    "description": "Recognizable name for the Lightning Network",
    "nullable": true,
    "pattern": ".{1,32}",
    "pattern-description":
      "Must be at least 1 character and no more than 32 characters",
  },
  "color": {
    "type": "string",
    "name": "Color",
    "description": "Color value for the Lightning Network",
    "nullable": false,
    "pattern": "[0-9a-fA-F]{6}",
    "pattern-description":
      "Must be a valid 6 digit hexadecimal RGB value. The first two digits are red, middle two are green and final two are\nblue\n",
    "default": {
      "charset": "a-f,0-9",
      "len": 6,
    },
  },
  "bitcoind": {
    "type": "union",
    "name": "Bitcoin Core",
    "description": "The Bitcoin Core node to connect to",
    "tag": {
      "id": "type",
      "name": "Type",
      "variant-names": {
        "internal": "Bitcoin Core",
        "internal-proxy": "Bitcoin Proxy",
      },
      "description":
        "Options<ul><li>Bitcoin Core: the Bitcoin Core node installed on your Embassy</li><li>Bitcoin Proxy: the Bitcoin Proxy service installed on your Embassy</li></ul>",
    },
    "default": "internal-proxy",
    "variants": {
      "internal": {
        "user": {
          "type": "pointer",
          "name": "RPC Username",
          "description": "The username for Bitcoin Core's RPC interface",
          "subtype": "package",
          "package-id": "bitcoind",
          "target": "config",
          "multi": false,
          "selector": "$.rpc.username",
        },
        "password": {
          "type": "pointer",
          "name": "RPC Password",
          "description": "The password for Bitcoin Core's RPC interface",
          "subtype": "package",
          "package-id": "bitcoind",
          "target": "config",
          "multi": false,
          "selector": "$.rpc.password",
        },
      },
      "internal-proxy": {
        "user": {
          "type": "pointer",
          "name": "RPC Username",
          "description":
            "The username for the RPC user allocated to Core Lightning",
          "subtype": "package",
          "package-id": "btc-rpc-proxy",
          "target": "config",
          "selector": '$.users[?(@.name == "c-lightning")].name',
          "multi": false,
        },
        "password": {
          "type": "pointer",
          "name": "RPC Password",
          "description":
            "The password for the RPC user allocated to Core Lightning",
          "subtype": "package",
          "package-id": "btc-rpc-proxy",
          "target": "config",
          "selector": '$.users[?(@.name == "c-lightning")].password',
          "multi": false,
        },
      },
    },
  },
  "rpc": {
    "type": "object",
    "name": "RPC Options",
    "description": "Options for the HTTP RPC interface",
    "spec": {
      "enabled": {
        "type": "boolean",
        "name": "Enable",
        "description": "Whether to enable the RPC webserver",
        "default": true,
      },
      "user": {
        "type": "string",
        "name": "RPC Username",
        "description":
          "The username for the RPC user on your Core Lightning node",
        "nullable": false,
        "default": "lightning",
        "copyable": true,
      },
      "password": {
        "type": "string",
        "name": "RPC Password",
        "description":
          "The password for the RPC user on your Core Lightning node",
        "nullable": false,
        "default": {
          "charset": "a-z,A-Z,0-9",
          "len": 22,
        },
        "copyable": true,
        "masked": true,
      },
    },
  },
  "advanced": {
    "type": "object",
    "name": "Advanced",
    "description": "Advanced Options",
    "spec": {
      "tor-only": {
        "type": "boolean",
        "name": "Only Use Tor",
        "description": "Use Tor for outgoing connections",
        "default": false,
      },
      "fee-base": {
        "type": "number",
        "name": "Routing Base Fee",
        "description":
          "The base fee in millisatoshis you will charge for forwarding payments on your channels.\n",
        "nullable": false,
        "range": "[0,*)",
        "integral": true,
        "default": 1000,
        "units": "millisatoshis",
      },
      "fee-rate": {
        "type": "number",
        "name": "Routing Fee Rate",
        "description":
          "The fee rate used when forwarding payments on your channels. The total fee charged is\nthe Base Fee + (amount * Fee Rate / 1,000,000), where the amount is the forwarded amount.\nMeasured in sats per million.\n",
        "nullable": false,
        "range": "[1,1000000)",
        "integral": true,
        "default": 1,
        "units": "sats per million",
      },
      "min-capacity": {
        "type": "number",
        "name": "Minimum Channel Capacity",
        "description":
          "This value defines the minimal effective channel capacity in satoshis to accept for channel opening requests.\nThis will reject any opening of a channel which can't pass an HTLC of at least this value. Usually this prevents\na peer opening a tiny channel, but it can also prevent a channel you open with a reasonable amount and the peer\nis requesting such a large reserve that the capacity of the channel falls below this.\n",
        "nullable": false,
        "range": "[1,16777215]",
        "integral": true,
        "default": 10000,
        "units": "satoshis",
      },
      "ignore-fee-limits": {
        "type": "boolean",
        "name": "Ignore Fee Limits",
        "description":
          "Allow nodes which establish channels to you to set any fee they want. This may result in a channel which cannot\nbe closed, should fees increase, but make channels far more reliable since Core Lightning will never close it due\nto unreasonable fees.\n",
        "default": false,
      },
      "funding-confirms": {
        "type": "number",
        "name": "Required Funding Confirmations",
        "description":
          "Confirmations required for the funding transaction when the other side opens a channel before the channel is\nusable.\n",
        "nullable": false,
        "range": "[1,6]",
        "integral": true,
        "default": 3,
        "units": "blocks",
      },
      "cltv-delta": {
        "type": "number",
        "name": "Time Lock Delta",
        "description":
          "The number of blocks between the incoming payments and outgoing payments: this needs to be enough to make sure\nthat if it has to, Core Lightning can close the outgoing payment before the incoming, or redeem the incoming once\nthe outgoing is redeemed.\n",
        "nullable": false,
        "range": "[6,144]",
        "integral": true,
        "default": 40,
        "units": "blocks",
      },
      "wumbo-channels": {
        "type": "boolean",
        "name": "Enable Wumbo Channels",
        "description":
          "Removes capacity limits for channel creation. Version 1.0 of the specification limited channel sizes to 16777215\nsatoshis. With this option (which your node will advertise to peers), your node will accept larger incoming\nchannels and if the peer supports it, will open larger channels.\n\nWarning: This is #Reckless and you should not enable it unless you deeply understand the risks associated with\nthe Lightning Network.\n",
        "default": false,
      },
      "experimental": {
        "type": "object",
        "name": "Experimental Features",
        "description":
          "Experimental features that have not been standardized across Lightning Network implementations",
        "change-warning":
          "These are experimental features. Enable them at your own risk. It is possible that software bugs can lead to\nunknown problems. We recommend not using them with large amounts of money. Unless you understand how these\nfeatures work, you should not enable them.\n",
        "spec": {
          "dual-fund": {
            "type": "boolean",
            "name": "Dual Funding",
            "description":
              "Enables the option to dual fund channels with other compatible lightning implementations using the v2\nchannel opening protocol\n",
            "default": false,
          },
          "onion-messages": {
            "type": "boolean",
            "name": "Onion Messages",
            "description":
              "Enable the sending, receiving, and relay of onion messages\n",
            "default": false,
          },
          "offers": {
            "type": "boolean",
            "name": "Offers",
            "description":
              "Enable the sending and receiving of offers (this requires Onion Messages to be enabled as well)\n",
            "default": false,
          },
          "shutdown-wrong-funding": {
            "type": "boolean",
            "name": "Shutdown Wrong Funding",
            "description": "Allow channel shutdown with alternate txids\n",
            "default": false,
          },
        },
        // deno-lint-ignore no-explicit-any
      } as any,
      "plugins": {
        "type": "object",
        "name": "Plugins",
        "description":
          "Plugins are subprocesses that provide extra functionality and run alongside the lightningd process inside \nthe main Core Lightning container in order to communicate directly with it.\nTheir source is maintained separately from that of Core Lightning itself.\n",
        "spec": {
          "http": {
            "type": "boolean",
            "name": "Enable C-Lightning-HTTP-Plugin",
            "description":
              "This plugin is a direct proxy for the unix domain socket from the HTTP interface. \nIt is required for Spark Wallet to connect to Core Lightning.\n\nSource: https://github.com/Start9Labs/c-lightning-http-plugin\n",
            "default": true,
          },
          "rebalance": {
            "type": "boolean",
            "name": "Enable Rebalance Plugin",
            "description":
              "Enables the `rebalance` rpc command, which moves liquidity between your channels using circular payments.\nSee `help rebalance` on the CLI or in the Spark console for usage instructions.\n\nSource: https://github.com/lightningd/plugins/tree/master/rebalance\n",
            "default": false,
          },
          "summary": {
            "type": "boolean",
            "name": "Enable Summary Plugin",
            "description":
              "Enables the `summary` rpc command, which outputs a text summary of your node, including fiat amounts.\nCan be called via command line or the Spark console.        \n\nSource: https://github.com/lightningd/plugins/tree/master/summary\n",
            "default": false,
          },
          "rest": {
            "type": "boolean",
            "name": "Enable C-Lightning-REST Plugin",
            "description":
              "This plugin exposes an LND-like REST API. It is required for Ride The Lighting to connect to Core Lightning.\n\nSource: https://github.com/Ride-The-Lightning/c-lightning-REST\n",
            "default": true,
          },
          "clboss": {
            "type": "union",
            "name": "CLBOSS settings",
            "description":
              "CLBOSS is an automated manager for Core Lightning forwarding nodes.\n\nSource: https://github.com/ZmnSCPxj/clboss\n",
            "warning":
              "CLBOSS automatically manages your CLN node. It is experimental software and will probably not be profitable to run. It will automatically open channels, buy incoming liquidity, rebalance channels, and set forwarding fees. If you don't want this behavior or don't understand what this means, please keep this option disabled. For more info, see: Source: https://github.com/ZmnSCPxj/clboss#operating .",
            "tag": {
              "id": "enabled",
              "name": "CLBOSS Enabled",
              "description":
                "- Disabled: Disable CLBOSS\n- Enabled: Enable CLBOSS",
              "variant-names": {
                "disabled": "Disabled",
                "enabled": "Enabled",
              },
            },
            "default": "disabled",
            "variants": {
              "disabled": {},
              "enabled": {
                "min-onchain": {
                  "type": "number",
                  "nullable": true,
                  "name": "Minimum On-Chain",
                  "description":
                    'Pass this option to lightningd in order to specify a target amount that CLBOSS will leave onchain. The amount specified must be an ordinary number, and must be in satoshis unit, without any trailing units or other strings. The default is "30000", or about 0.0003 BTC. The intent is that this minimal amount will be used in the future, by Core Lightning, to manage anchor-commitment channels, or post-Taproot Decker-Russell-Osuntokun channels. These channel types need some small amount of onchain funds to unilaterally close, so it is not recommended to set it to 0. The amount specified is a ballpark figure, and CLBOSS may leave slightly lower or slightly higher than this amount.',
                  "range": "[0,10000000000)",
                  "integral": true,
                  "units": "satoshis",
                },
                "auto-close": {
                  "type": "boolean",
                  "name": "Auto Close",
                  "description":
                    "Set to true if you want CLBOSS to close channels it deems unprofitable.",
                  "default": false,
                  "warning": "This feature is EXPERIMENTAL!",
                },
                "zerobasefee": {
                  "type": "enum",
                  "name": "Zero Base Fee",
                  "values": [
                    "default",
                    "required",
                    "allow",
                    "disallow",
                  ],
                  "value-names": {},
                  "description":
                    "Pass this option to lightningd to specify how this node will advertise its base_fee. require - the base_fee must be always 0. allow - if the heuristics of CLBOSS think it might be a good idea to set base_fee to 0, let it be 0, but otherwise set it to whatever value the heuristics want. disallow - the base_fee must always be non-0. If the heuristics think it might be good to set it to 0, set it to 1 instead. On 0.11C and earlier, CLBOSS had the disallow behavior. In this version, the default is the allow behavior. Some pathfinding algorithms under development may strongly prefer 0 or low base fees, so you might want to set CLBOSS to 0 base fee, or to allow a 0 base fee.",
                  "default": "default",
                },
                "min-channel": {
                  "type": "number",
                  "nullable": true,
                  "name": "Min Channel Size",
                  "description":
                    "Sets the minimum channel sizes that CLBOSS will make.",
                  "range": "[0,10000000000)",
                  "integral": true,
                  "units": "satoshis",
                },
                "max-channel": {
                  "type": "number",
                  "nullable": true,
                  "name": "Max Channel Size",
                  "description":
                    "Sets the maximum channel sizes that CLBOSS will make.",
                  "range": "[0,10000000000)",
                  "integral": true,
                  "units": "satoshis",
                },
              },
            },
          },
        },
      },
    },
  },
});
