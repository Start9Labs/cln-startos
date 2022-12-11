import { compat, types as T } from "../deps.ts";


export const [getConfig, setConfigMatcher] = compat.getConfigAndMatcher({
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
  "rest-tor-address": {
    "name": "C-Lightning-REST API Address",
    "description": "The Tor address of the C-Lightning-REST API",
    "type": "pointer",
    "subtype": "package",
    "package-id": "c-lightning",
    "target": "tor-address",
    "interface": "rest",
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
    "default": "internal",
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
      "htlc-minimum-msat": {
        "type": "number",
        "name": "HTLC Minimum Size (Msat)",
        "description":
          "Default: 0. Sets the minimal allowed HTLC value for newly created channels. If you want to change the htlc_minimum_msat for existing channels, use the RPC call lightning-setchannel(7).",
        "nullable": true,
        "range": "[0,*)",
        "integral": true,
        "units": "millisatoshis",
      },
      "htlc-maximum-msat": {
        "type": "number",
        "name": "HTLC Maximum Size (Msat)",
        "description":
          "Default: unset (no limit). Sets the maximum allowed HTLC value for newly created channels. If you want to change the htlc_maximum_msat for existing channels, use the RPC call lightning-setchannel(7).",
        "nullable": true,
        "range": "[0,*)",
        "integral": true,
        "units": "millisatoshis",
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
        "spec": {
          "dual-fund": {
            "type": "union",
            "name": "Dual Funding And Liquidity Ads",
            "description":
              "Dual Funding enables use of the channel opening protocol v2, in which both channel parties commit funds into the channel at opening. This potentially solves all sorts of problems with liquidity on the Lightning Network, but is currently experimental and only implemented by Core Lightning so far.<br>See https://blog.blockstream.com/setting-up-liquidity-ads-in-c-lightning/ for more details",
            "warning":
              "Dual funding is an experimental feature which can cause your node automatically to commit on-chain funds into channels that may not be profitable. Use at your own risk.",
            "tag": {
              "id": "enabled",
              "name": "Dual Funding Enabled",
              "description":
                "<ul><li><b>Disabled</b>: Disable Dual Funding</li><li><b>Enabled</b>: Enable Dual Funding</li></ul>",
              "variant-names": {
                "disabled": "Disabled",
                "enabled": "Enabled",
              },
            },
            "default": "disabled",
            "variants": {
              "disabled": {},
              "enabled": {
                "strategy": {
                  "type": "union",
                  "name": "Dual-Funding Channel Acceptance Strategy",
                  "description":
                    "Select from two different operating strategies: Incognito, or Liquidity Merchant, and fine-tune your selected strategy's settings",
                  // "warning":
                    // "Liquidity Ads are an experimental feature which can cause your node automatically to commit on-chain funds into channels that may not be profitable. Use at your own risk.",
                  "tag": {
                    "id": "mode",
                    "name": "Operating Mode",
                    "description":
                      "<ul><li><b>Liquidity Merchant</b>: Advertise and sell liquidity on the market in a straightforward way (i.e., always match 100% of requested funds, and don't accept dual-funding requests that aren't channel lease requests).</li><li><b>Incognito</b>: Wait for others to stumble upon your unadvertised node and open a dual-fund request, then react in a more complex way</li></ul>",
                    "variant-names": {
                      "merchant": "Liquidity Merchant",
                      "incognito": "Incognito",
                    },
                  },
                  "default": "incognito",
                  "variants": {
                    "incognito": {
                      "policy": {
                        "type": "union",
                        "name": "Policy",
                        "tag": {
                          "id": "policy",
                          "name": "Policy Type",
                          "description":
                            "<ul><li><b>Match</b> – Contribute a percentage of their requested funds.</li><li><b>Available</b> – Contribute policy_mod percent of our available node wallet funds.</li><li><b>Fixed</b> – Contribute a fixed number of sats to v2 channel open requests.</li></ul>",
                          "variant-names": {
                            "match": "Match",
                            "available": "Available",
                            "fixed": "Fixed",
                          },
                        },
                        "description":
                          "Determines how your node will react to a dual-funding channel open request",
                        "default": "match",
                        "variants": {
                          "match": {
                            "policy-mod": {
                              "type": "number",
                              "nullable": true,
                              "name": "Percentage of Requested Funds to Commit",
                              "description":
                                "Percentage of requested funds to commit to the channel. If this is a channel lease request, we match based on their requested funds. If it is not a channel lease request (and lease_only is false), then we match their funding amount. Note: any lease match less than 100 will likely fail, as clients will not accept a lease less than their request.",
                              "range": "[0,200]",
                              "integral": true,
                              "units": "percent",
                              "default": 100,
                            },
                          },
                          "available": {
                            "policy-mod": {
                              "type": "number",
                              "nullable": true,
                              "name": "Percentage of Available Funds to Commit",
                              "description":
                                "Percentage of available on-chain funds to commit to the channel (default 100)",
                              "range": "[0,100]",
                              "integral": true,
                              "units": "percent",
                            },
                          },
                          "fixed": {
                            "policy-mod": {
                              "type": "number",
                              "nullable": true,
                              "name": "Fixed Number of Satoshis to Commit",
                              "description":
                                "Fixed number of sats to contribute to the channel (default 0).",
                              "range": "[0,10000000000)",
                              "integral": true,
                              "units": "satoshis",
                            },
                          },
                        }
                      },
                      "fuzz-percent": {
                        "type": "number",
                        "nullable": true,
                        "name": "Fuzz Percentage",
                        "description":
                          "A percentage to fuzz the resulting contribution amount by. Valid values are 0 to 100. Defaults to 0% (no fuzz).",
                        "range": "[0,100]",
                        "integral": true,
                        "units": "percent",
                      },
                      "fund-probability": {
                        "type": "number",
                        "nullable": true,
                        "name": "Fund Probability",
                        "description":
                          "The percent of v2 channel open requests to apply our policy to. Valid values are integers from 0 (fund 0% of all open requests) to 100 (fund every request). Useful for randomizing opens that receive funds. Defaults to 100.",
                        "range": "[0,100]",
                        "integral": true,
                        "units": "percent",
                      },
                    },
                    "merchant": {
                      "lease-fee-base-sat": {
                        "type": "number",
                        "nullable": true,
                        "name": "Fixed Lease Fee (Sats)",
                        "description":
                          "The flat fee for a channel lease. Node will receive this much extra added to their channel balance, paid by the opening node. Defaults to 2k sats. Note that the minimum is 1sat.",
                        "range": "[0,10000000000)",
                        "integral": true,
                        "units": "satoshis",
                      },
                      "lease-fee-basis": {
                        "type": "number",
                        "nullable": true,
                        "name": "Fee as Percentage of Requested Funds (basis points)",
                        "description":
                          "A basis fee that’s calculated as 1/10k of the total requested funds the peer is asking for. Node will receive the total of lease_fee_basis times requested funds / 10k satoshis added to their channel balance, paid by the opening node. Default is 0.65% (65 basis points)",
                        "range": "[0,10000000000000)",
                        "integral": true,
                        "units": "basis points (hundredths of a percent)",
                      },
                      "funding-weight": {
                        "type": "number",
                        "nullable": true,
                        "name": "Funding Weight (Weight Units)",
                        "description":
                          "Transaction weight the channel opener will pay us for a leased funding transaction. Node will have this funding fee added to their channel balance, paid by the opening node. Default is 2 inputs + 1 P2WPKH output.",
                        "range": "[0,100]",
                        "integral": true,
                        "units": "weight units",
                      },
                      "channel-fee-max-base-msat": {
                        "type": "number",
                        "nullable": true,
                        "name": "Channel Fee Max Base (Msats)",
                        "description":
                          "A commitment to a maximum channel_fee_base_msat that your node will charge for routing payments over this leased channel during the lease duration. Default is 5k sats.",
                        "range": "[0,10000000000000)",
                        "integral": true,
                        "units": "millisatoshis",
                      },
                      "channel-fee-max-proportional-thousandths": {
                        "type": "number",
                        "nullable": true,
                        "name": "Channel Fee Max Proportional (Thousandths)",
                        "description":
                          "A commitment to a maximum channel_fee_proportional_millionths that your node will charge for routing payments over this leased channel during the lease duration. Note that it’s denominated in ‘thousandths’. A setting of 1 is equal to 1k ppm; 5 is 5k ppm, etc. Default is 100 (100k ppm).",
                        "range": "[0,1000]",
                        "integral": true,
                        "units": "percent",
                      },
                    },
                  },
                },
                "other": {
                  "type": "object",
                  "name": "Other Settings",
                  "description":
                    "Settings that apply to both operating strategies\n",
                  "spec": {
                    "min-their-funding-msat": {
                      "type": "number",
                      "nullable": true,
                      "name": "Minimum Their Funding (Msats)",
                      "description":
                        "The minimum funding msats that we require in order to activate our contribution policy to the v2 open. Defaults to 10k sats.",
                      "range": "[0,10000000000000)",
                      "integral": true,
                      "units": "millisatoshis",
                    },
                    "max-their-funding-msat": {
                      "type": "number",
                      "nullable": true,
                      "name": "Maximum Their Funding (Msats)",
                      "description":
                        "The maximum funding msats that we will consider to activate our contribution policy to the v2 open. Any channel open above this will not be funded. Defaults to no max (UINT_MAX).",
                      "range": "[0,10000000000000)",
                      "integral": true,
                      "units": "millisatoshis",
                    },
                    "per-channel-min-msat": {
                      "type": "number",
                      "nullable": true,
                      "name": "Per-Channel Minimum (Msats)",
                      "description":
                        "The minimum amount that we will contribute to a channel open. Defaults to 10k sats.",
                      "range": "[0,10000000000000)",
                      "integral": true,
                      "units": "millisatoshis",
                    },
                    "per-channel-max-msat": {
                      "type": "number",
                      "nullable": true,
                      "name": "Per-Channel Maximum (Msats)",
                      "description":
                        "The minimum amount that we will contribute to a channel open. Defaults to 10k sats.",
                      "range": "[0,10000000000000)",
                      "integral": true,
                      "units": "millisatoshis",
                    },
                    "reserve-tank-msat": {
                      "type": "number",
                      "nullable": true,
                      "name": "Reserve Tank (Msats)",
                      "description":
                        "The amount of sats to leave available in the node wallet. Defaults to zero sats.",
                      "range": "[0,10000000000000)",
                      "integral": true,
                      "units": "millisatoshis",
                    },
                  },
                },
              },
            },
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
      },
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
          "teos": {
            "type": "boolean",
            "name": "Enable The Eye of Satoshi Watchtower Plugin",
            "description":
              "The Eye of Satoshi is a Lightning watchtower compliant with BOLT13, written in Rust.\n\nSource: https://github.com/talaia-labs/rust-teos\n",
            "default": true,
          },
        },
      },
    },
  },
} as const);

export type SetConfig = typeof setConfigMatcher._TYPE