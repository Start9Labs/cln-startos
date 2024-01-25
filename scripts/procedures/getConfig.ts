import { compat } from "../deps.ts";

export const [getConfig, setConfigMatcher] = compat.getConfigAndMatcher({
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
    description: "The Tor address of the RPC (Remote Procedure Call) interface",
    type: "pointer",
    subtype: "package",
    "package-id": "c-lightning",
    target: "tor-address",
    interface: "rpc",
  },
  "web-ui-tor-address": {
    name: "UI Tor Address",
    description: "The Tor address of the cln-application interface",
    type: "pointer",
    subtype: "package",
    "package-id": "c-lightning",
    target: "tor-address",
    interface: "web-ui",
  },
  "rest-tor-address": {
    name: "C-Lightning-REST API Address",
    description: "The Tor address of the C-Lightning-REST API",
    type: "pointer",
    subtype: "package",
    "package-id": "c-lightning",
    target: "tor-address",
    interface: "rest",
  },
  "clnrest-tor-address": {
    name: "CLNRest Address",
    description: "The Tor address of the CLNRest plugin interface",
    type: "pointer",
    subtype: "package",
    "package-id": "c-lightning",
    target: "tor-address",
    interface: "clnrest",
  },
  "watchtower-tor-address": {
    name: "TEoS Watchtower API Address",
    description: "The Tor address of the TEoS Watchtower API",
    type: "pointer",
    subtype: "package",
    "package-id": "c-lightning",
    target: "tor-address",
    interface: "watchtower",
  },
  alias: {
    type: "string",
    name: "Alias",
    description: "A custom, human-readable name for your node.  This is publicly visible to the Lightning Network.  <b>Default: Unique id of pattern: start9-[random alphanumerics]</b>",
    nullable: true,
    pattern: ".{1,32}",
    "pattern-description":
      "Must be at least 1 character and no more than 32 characters",
  },
  color: {
    type: "string",
    name: "Color",
    description: "The public color of your node on the Lightning Network in hexadecimal.  <b>Default: Random color</b>",
    nullable: false,
    pattern: "[0-9a-fA-F]{6}",
    "pattern-description":
      "Must be a valid 6 digit hexadecimal RGB value. The first two digits are red, the middle two are green, and the final two are blue.",
    default: {
      charset: "a-f,0-9",
      len: 6,
    },
  },
  "bitcoin-user": {
    type: "pointer",
    name: "RPC Username",
    description: "The username for Bitcoin Core's RPC interface.",
    subtype: "package",
    "package-id": "bitcoind",
    target: "config",
    multi: false,
    selector: "$.rpc.username",
  },
  "bitcoin-password": {
    type: "pointer",
    name: "RPC Password",
    description: "The password for Bitcoin Core's RPC interface.",
    subtype: "package",
    "package-id": "bitcoind",
    target: "config",
    multi: false,
    selector: "$.rpc.password",
  },
  "ui-password": {
    type: "string",
    name: "UI Password",
    description: "The password for your CLN UI (User Interface).  <b>Default: Randomly generated password</b>",
    nullable: false,
    copyable: true,
    masked: true,
    default: {
      charset: "a-z,A-Z,0-9",
      len: 22
    }
  },
  "watchtowers": {
    type: "object",
    name: "Watchtowers",
    description: "Connect to external watchtower servers to protect your node from misbehaving channel peers. You can also run a watchtower server and share your server URI (found in properties) with friends/family to watch over their nodes.  You can learn more about watchtowers at https://docs.corelightning.org/docs/watchtowers.",
    spec: {
      "wt-server": {
        type: "boolean",
        name: "Watchtower Server",
        description:
          "Allow other nodes to connect to your watchtower server on the network.  <b>Default: Disabled</b>",
        nullable: true,
        default: false,
      },
      "wt-client": {
        type: "union",
        name: "Watchtower Client",
        nullable: true,
        tag: {
          id: "enabled",
          name: "Watchtower Client",
          description: "Enable the client and connect to a watchtower server of your choice in order to use watchtower features.  <b>Default: Disabled</b>",
          "variant-names": {
            disabled: "Disabled",
            enabled: "Enabled",
          },
        },
        default: "disabled",
        variants: {
          disabled: {},
          enabled: {
            "add-watchtowers": {
              type: "list",
              name: "Add Watchtower Servers",
              description:
                "Add URIs of watchtower servers to connect to. If you don't know of anyone with a server, you can find some on this public listing: https://github.com/talaia-labs/rust-teos/discussions/158",
              range: "[1,*)",
              subtype: "string",
              spec: {
                masked: false,
                copyable: true,
                placeholder:
                  "02b4891f562c8b80571ddd2eeea48530471c30766295e1c78556ae4c4422d24436@recnedb7xfhzjdrcgxongzli3a6qyrv5jwgowoho3v5g3rwk7kkglrid.onion:9814",
              },
              default: Array<string>(),
            },
          }
        }
      },
    },
  },
  autoclean: {
    type: "object",
    name: "Autoclean Options",
    description: "Autoclean settings to delete old entries",
    spec: {
      "autoclean-cycle": {
        type: "number",
        name: "Autoclean Interval",
        description: "Interval to perform search for things to clean. <b>Default: 3600 (1 hour) which is usually sufficient.</b>",
        nullable: true,
        range: "[0,*)",
        integral: true,
        default: 3600,
        units: "seconds"
      },
      "autoclean-succeededforwards-age": {
        type: "number",
        name: "Successful Forwards Age",
        description:
          "How old successful forwards (settled in listforwards status) have to be before deletion. <b>Default: 0, meaning never.</b>",
        nullable: true,
        range: "[0,*)",
        integral: true,
        default: 0,
        units: "seconds"
      },
      "autoclean-failedforwards-age": {
        type: "number",
        name: "Failed Forwards Age",
        description:
          "How old failed forwards (failed or local_failed in listforwards status) have to be before deletion.  <b>Default: 0, meaning never.</b>",
        nullable: true,
        range: "[0,*)",
        integral: true,
        default: 0,
        units: "seconds"
      },
      "autoclean-succeededpays-age": {
        type: "number",
        name: "Successful Payments Age",
        description:
          "How old successful payments (complete in listpays status) have to be before deletion.  <b>Default: 0, meaning never.</b>",
        nullable: true,
        range: "[0,*)",
        integral: true,
        default: 0,
        units: "seconds"
      },
      "autoclean-failedpays-age": {
        type: "number",
        name: "Failed Payments Age",
        description:
          "How old failed payment attempts (failed in listpays status) have to be before deletion.  <b>Default: 0, meaning never.</b>",
        nullable: true,
        range: "[0,*)",
        integral: true,
        default: 0,
        units: "seconds"
      },
      "autoclean-paidinvoices-age": {
        type: "number",
        name: "Paid Invoices Age",
        description:
          "How old invoices which were paid (paid in listinvoices status) have to be before deletion.  <b>Default: 0, meaning never.</b>",
        nullable: true,
        range: "[0,*)",
        integral: true,
        default: 0,
        units: "seconds"
      },
      "autoclean-expiredinvoices-age": {
        type: "number",
        name: "Expired Invoices Age",
        description:
          "How old invoices which were not paid (and cannot be) (expired in listinvoices status) before deletion.  <b>Default: 0, meaning never</b>",
        nullable: true,
        range: "[0,*)",
        integral: true,
        default: 0,
        units: "seconds"
      },
    }
  },
  advanced: {
    type: "object",
    name: "Advanced",
    description: "Advanced Options",
    spec: {
      "tor-only": {
        type: "boolean",
        name: "Tor Only",
        description: "Only use tor connections.  This increases privacy, at the cost of some performance and reliability.  <b>Default: False</b>",
        default: false,
      },
      "fee-base": {
        type: "number",
        name: "Routing Base Fee",
        description:
          "The base fee in millisatoshis you will charge for forwarding payments on your channels.  <b>Default: 1000</b>",
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
          "The fee rate used when forwarding payments on your channels. The total fee charged is the Base Fee + (amount * Fee Rate / 1,000,000), where the amount is the forwarded amount.  Measured in sats per million.  <b>Default: 1</b>",
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
          "This value defines the minimal effective channel capacity in satoshis to accept for channel opening requests.  This will reject any opening of a channel which can't pass an HTLC of at least this value. Usually this prevents a peer opening a tiny channel, but it can also prevent a channel you open with a reasonable amount and the peer is requesting such a large reserve that the capacity of the channel falls below this.  <b>Default: 10,000</b>",
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
          "Allow nodes which establish channels to you to set any fee they want. This may result in a channel which cannot be closed, should fees increase, but make channels far more reliable since Core Lightning will never close it due to unreasonable fees.  <b>Default: False</b>",
        default: false,
      },
      "funding-confirms": {
        type: "number",
        name: "Required Funding Confirmations",
        description:
          "Confirmations required for the funding transaction when the other side opens a channel before the channel is usable.  <b>Default: 3</b>",
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
          "The number of blocks between the incoming payments and outgoing payments: this needs to be enough to make sure that if it has to, Core Lightning can close the outgoing payment before the incoming, or redeem the incoming once the outgoing is redeemed.  <b>Default: 40</b>",
        nullable: false,
        range: "[6,144]",
        integral: true,
        default: 40,
        units: "blocks",
      },
      "htlc-minimum-msat": {
        type: "number",
        name: "HTLC Minimum Size (Msat)",
        description:
          "Sets the minimal allowed HTLC value for newly created channels. If you want to change the htlc_minimum_msat for existing channels, use the RPC call lightning-setchannel.  <b>Default: unset (no minimum)</b>",
        nullable: true,
        range: "[0,*)",
        integral: true,
        units: "millisatoshis",
      },
      "htlc-maximum-msat": {
        type: "number",
        name: "HTLC Maximum Size (Msat)",
        description:
          "Sets the maximum allowed HTLC value for newly created channels. If you want to change the htlc_maximum_msat for existing channels, use the RPC call lightning-setchannel.  <b>Default: unset (no limit)</b>",
        nullable: true,
        range: "[0,*)",
        integral: true,
        units: "millisatoshis",
      },
      "wumbo-channels": {
        type: "boolean",
        name: "Enable Wumbo Channels",
        description:
          "Removes capacity limits for channel creation. Version 1.0 of the specification limited channel sizes to 16777215 satoshis. With this option (which your node will advertise to peers), your node will accept larger incoming channels, and if the peer supports it, will open larger channels.  <b>Warning</b>: This is #Reckless and you should not enable it unless you deeply understand the risks associated with the Lightning Network.  <b>Default: False</b>",
        default: false,
      },
      experimental: {
        type: "object",
        name: "Experimental Features",
        description:
          "Experimental features are those that have not yet been standardized across other major Lightning Network implementations.",
        spec: {
          "dual-fund": {
            type: "union",
            name: "Dual Funding And Liquidity Ads",
            tag: {
              id: "enabled",
              name: "Dual Funding",
              warning: "Dual funding is an experimental feature which can cause your node to automatically commit on-chain funds into channels that may or may not be profitable. <b>Use at your own risk!</b>",
              description:
                "Dual Funding enables use of the channel opening protocol v2, in which both channel parties commit funds into the channel at opening. This potentially solves all sorts of problems with liquidity on the Lightning Network, but is currently experimental and only implemented by Core Lightning so far.<br>See https://blog.blockstream.com/setting-up-liquidity-ads-in-c-lightning/ for more details.  <b>Default: Disabled</b>",
              "variant-names": {
                disabled: "Disabled",
                enabled: "Enabled",
              },
            },
            default: "disabled",
            variants: {
              disabled: {},
              enabled: {
                strategy: {
                  type: "union",
                  name: "Dual-Funding Channel Acceptance Strategy",
                  tag: {
                    id: "mode",
                    name: "Operating Mode",
                    description:
                      "Select from two different operating strategies: Incognito, or Liquidity Merchant, and fine-tune your selected strategy's settings.<br><ul><li><b>Incognito: </b>Wait for others to stumble upon your unadvertised node and open a dual-fund request, then react in a more complex way</li><li><b>Liquidity Merchant: </b>Advertise and sell liquidity on the market in a straightforward way (i.e., always match 100% of requested funds, and don't accept dual-funding requests that aren't channel lease requests).</li></ul><br><b>Default: Incognito</b>",
                    "variant-names": {
                      incognito: "Incognito",
                      merchant: "Liquidity Merchant",
                    },
                  },
                  default: "incognito",
                  variants: {
                    incognito: {
                      policy: {
                        type: "union",
                        name: "Policy",
                        tag: {
                          id: "policy",
                          name: "Policy Type",
                          description:
                            "<ul><li><b>Match: </b>Contribute a percentage of their requested funds.</li><li><b>Available: </b>Contribute policy_mod percent of our available node wallet funds.</li><li><b>Fixed: </b>Contribute a fixed number of sats to v2 channel open requests.</li></ul><br><b>Default: Match</b>",
                          "variant-names": {
                            match: "Match",
                            available: "Available",
                            fixed: "Fixed",
                          },
                        },
                        description:
                          "Determines how your node will react to a dual-funding channel open request",
                        default: "match",
                        variants: {
                          match: {
                            "policy-mod": {
                              type: "number",
                              nullable: true,
                              name: "Percentage of Requested Funds to Commit",
                              description:
                                "Percentage of requested funds to commit to the channel. If this is a channel lease request, we match based on their requested funds. If it is not a channel lease request (and leases only is false, which is is by default), then we match their funding amount. Note: any lease match less than 100 will likely fail, as clients will not accept a lease less than their request.  <b>Default: 100</b>",
                              range: "[0,200]",
                              integral: true,
                              units: "percent",
                              default: 100
                            },
                          },
                          available: {
                            "policy-mod": {
                              type: "number",
                              nullable: true,
                              name: "Percentage of Available Funds to Commit",
                              description:
                                "Percentage of available on-chain funds to commit to the channel.  <b>Default: 100</b>",
                              range: "[0,100]",
                              integral: true,
                              units: "percent",
                              default: 100
                            },
                          },
                          fixed: {
                            "policy-mod": {
                              type: "number",
                              nullable: true,
                              name: "Fixed Number of Satoshis to Commit",
                              description:
                                "Fixed number of sats to contribute to the channel.  <b>Default: 10000</b>",
                              range: "[0,10000000000)",
                              integral: true,
                              units: "satoshis",
                              default: 10000
                            },
                          },
                        },
                      },
                      "fuzz-percent": {
                        type: "number",
                        nullable: true,
                        name: "Fuzz Percentage",
                        description:
                          "A percentage to fuzz the resulting contribution amount by.<b>WARNING: Fuzzing with a Match 100% policy can cause random failures.<b><br><b>Defaults to 0% (no fuzz)</b>",
                        range: "[0,100]",
                        integral: true,
                        units: "percent",
                      },
                      "fund-probability": {
                        type: "number",
                        nullable: true,
                        name: "Fund Probability",
                        description:
                          "The percent of v2 channel open requests to apply our policy to. Valid values are integers from 0 (fund no requests) to 100 (fund every request). Useful for randomizing opens that receive funds.  <b>Default: 100</b>",
                        range: "[0,100]",
                        integral: true,
                        units: "percent",
                        default: 100,
                      },
                    },
                    merchant: {
                      "lease-fee-base-sat": {
                        type: "number",
                        nullable: true,
                        name: "Fixed Lease Fee",
                        description:
                          "The flat fee for a channel lease. Node will receive this much extra added to their channel balance, paid by the opening node.  <b>Default: 2000</b>",
                        range: "[1,10000000000)",
                        integral: true,
                        units: "satoshis",
                        default: 2000,
                      },
                      "lease-fee-basis": {
                        type: "number",
                        nullable: true,
                        name: "Fee as Percentage of Requested Funds",
                        description:
                          "A basis fee that's calculated as 1/10k of the total requested funds the peer is asking for. Node will receive the total of the lease fee basis * requested funds / 10k satoshis added to their channel balance, paid by the opening node. <b>Default: 0.65% (65 basis points)</b>",
                        range: "[0,1000000)",
                        integral: true,
                        units: "basis points (hundredths of a percent)",
                        default: 65,
                      },
                      "funding-weight": {
                        type: "number",
                        nullable: true,
                        name: "Funding Weight",
                        description:
                          "Transaction weight the channel opener will pay us for a leased funding transaction. Node will have this funding fee added to their channel balance, paid by the opening node. <b>Default: dynamically calculated for 2 inputs + 1 P2WPKH output</b>",
                        range: "[0,10000]",
                        integral: true,
                        units: "weight units",
                      },
                      "channel-fee-max-base-msat": {
                        type: "number",
                        nullable: true,
                        name: "Channel Fee Max Base",
                        description:
                          "A commitment to a maximum channel_fee_base_msat that your node will charge for routing payments over this leased channel during the lease duration. <b>Default: 5000000</b>",
                        range: "[0,10000000000000)",
                        integral: true,
                        units: "millisatoshis",
                        default: 5000000,
                      },
                      "channel-fee-max-proportional-thousandths": {
                        type: "number",
                        nullable: true,
                        name: "Channel Fee Max Proportional",
                        description:
                          "A commitment to a maximum channel_fee_proportional_millionths that your node will charge for routing payments over this leased channel during the lease duration. Note that it's denominated in 'thousandths'. A setting of 1 is equal to 1k ppm; 5 is 5k ppm, etc. <b>Default: 100 (100k ppm)</b>",
                        range: "[0,1000]",
                        integral: true,
                        units: "thousandths",
                        default: 100,
                      },
                    },
                  },
                },
                other: {
                  type: "object",
                  name: "Other Settings",
                  description:
                    "Additional settings that apply to both operating strategies",
                  spec: {
                    "min-their-funding-msat": {
                      type: "number",
                      nullable: true,
                      name: "Minimum Their Funding",
                      description:
                        "The minimum funding msats that we require in order to activate our contribution policy to the v2 open.  <b>Default: 10000000</b>",
                      range: "[0,10000000000000)",
                      integral: true,
                      units: "millisatoshis",
                      default: 10000000,
                    },
                    "max-their-funding-msat": {
                      type: "number",
                      nullable: true,
                      name: "Maximum Their Funding",
                      description:
                        "The maximum funding msats that we will consider to activate our contribution policy to the v2 open. Any channel open above this will not be funded.  <b>Default: No max</b>",
                      range: "[0,10000000000000)",
                      integral: true,
                      units: "millisatoshis",
                    },
                    "per-channel-min-msat": {
                      type: "number",
                      nullable: true,
                      name: "Per-Channel Minimum",
                      description:
                        "The minimum amount that we will contribute to a channel open.  <b>Default: 10000000",
                      range: "[0,10000000000000)",
                      integral: true,
                      units: "millisatoshis",
                      default: 10000000,
                    },
                    "per-channel-max-msat": {
                      type: "number",
                      nullable: true,
                      name: "Per-Channel Maximum",
                      description:
                        "The minimum amount that we will contribute to a channel open.  <b>Default: 10000000</b>",
                      range: "[0,10000000000000)",
                      integral: true,
                      units: "millisatoshis",
                      default: 10000000,
                    },
                    "reserve-tank-msat": {
                      type: "number",
                      nullable: true,
                      name: "Reserve Tank",
                      description:
                        "The amount of msats to leave available in the node wallet.  <b>Default: Nothing (can use all on-chain funds)</b>",
                      range: "[0,10000000000000)",
                      integral: true,
                      units: "millisatoshis",
                    },
                  },
                },
              },
            },
          },
          "shutdown-wrong-funding": {
            type: "boolean",
            name: "Shutdown Wrong Funding",
            description: "Allow channel shutdown with alternate txids.  If a remote node has opened a channel, but claims it used the incorrect txid (and the channel hasn't yet been used) this allows them to negotiate a clean shutdown with the txid they offer.  <b>Default: False</b>",
            default: false,
          },
        },
      },
      plugins: {
        type: "object",
        name: "Plugins",
        description:
          "Plugins are subprocesses that provide extra functionality and run alongside the lightningd process inside \nthe main Core Lightning container in order to communicate directly with it.\nTheir source is maintained separately from that of Core Lightning itself.",
        spec: {
          rebalance: {
            type: "boolean",
            name: "Rebalance",
            description:
              "Enables rebalancing, which moves liquidity between your channels using circular payments.  As of early 2024, this can only be done in the CLI.  <b>Default: False</b><br><b>Source:  https://github.com/lightningd/plugins/tree/master/rebalance</b>",
            default: false,
          },
          summary: {
            type: "boolean",
            name: "Summary",
            description:
              "Enables the `summary` rpc command, which outputs a text summary of your node, including fiat amounts.  This is a CLI-only tool.  <b>Default: False</b><br><b>Source:  https://github.com/lightningd/plugins/tree/master/summary</b>",
            default: false,
          },
          rest: {
            type: "boolean",
            name: "C-Lightning-REST",
            description:
            "This plugin exposes an LND-like REST API. It is required for some wallets, such as Zeus to connect to Core Lightning.  <b>Default: True</b><br><b>Source:  https://github.com/Ride-The-Lightning/c-lightning-REST</b>",
            default: true,
          },
          clnrest: {
            type: "boolean",
            name: "CLNRest",
            description:
            "Distinct from the C-Lightning-REST plugin, CLNRest is a lightweight Python-based built-in Core Lightning plugin (from v23.08) that transforms RPC calls into a REST service. It also broadcasts Core Lightning notifications to listeners connected to its websocket server. By generating REST API endpoints, it enables the execution of Core Lightning's RPC methods behind the scenes and provides responses in JSON format.  <b>Default: True</b>",
            default: true,
          },
          clboss: {
            type: "union",
            name: "CLBOSS settings",
            tag: {
              id: "enabled",
              name: "CLBOSS",
              warning: "CLBOSS automatically manages your CLN node. It is experimental software and will probably not be profitable to run. It will automatically open channels, buy incoming liquidity, rebalance channels, and set forwarding fees. If you don't want this behavior or don't understand what this means, please keep this option disabled. Source: https://github.com/ZmnSCPxj/clboss#operating",
              description:
                "CLBOSS is an automated manager for Core Lightning forwarding nodes.  <b>Default: Disabled</b><br><b>Source: https://github.com/ZmnSCPxj/clboss</b>",
              "variant-names": {
                disabled: "Disabled",
                enabled: "Enabled",
              },
            },
            default: "disabled",
            variants: {
              disabled: {},
              enabled: {
                "min-onchain": {
                  type: "number",
                  nullable: true,
                  name: "Minimum On-Chain",
                  description:
                    "The minimum amount that CLBOSS will leave in the on-chain wallet. The intent is that this amount will be used in the future, by your node, to manage anchor-commitment channels, or post-Taproot Decker-Russell-Osuntokun channels. These channel types need some small amount of on-chain funds to unilaterally close, so it is not recommended to set it to 0. The amount specified is a ballpark figure, and CLBOSS may leave slightly lower or slightly higher than this amount.  <b>Default: 30000</b>",
                  range: "[0,10000000000)",
                  integral: true,
                  units: "satoshis",
                  deafult: 30000
                },
                "auto-close": {
                  type: "boolean",
                  name: "Auto Close",
                  description:
                    "Enable if you want CLBOSS to have the ability to close channels it deems unprofitable.  This can be costly, please understand the ramifications before enabling.  <b>Default: False</b>",
                  default: false,
                  warning: "This feature is EXPERIMENTAL AND DANGEROUS!",
                },
                zerobasefee: {
                  type: "enum",
                  name: "Zero Base Fee",
                  values: ["default", "required", "allow", "disallow"],
                  "value-names": {},
                  description:
                    "Specify how this node will advertise its base fee. <ul><li><b>Require:  </b>The base fee must be always 0.</li><li><b>Allow:  </b>If the heuristics of CLBOSS think it might be a good idea to set base_fee to 0, let it be 0, but otherwise set it to whatever value the heuristics want.</li><li><b>Disallow:  </b>The base fee must always be non-zero. If the heuristics think it might be good to set it to 0, set it to 1 instead.</li></ul><b>Default:  Allow</b><br>Some pathfinding algorithms under development may strongly prefer 0 or low base fees, so you might want to set CLBOSS to 0 base fee, or to allow a 0 base fee.",
                  default: "default",
                },
                "min-channel": {
                  type: "number",
                  nullable: true,
                  name: "Min Channel Size",
                  description:
                    "Sets the minimum channel sizes that CLBOSS will make.  <b>Default:  No minimum</b>",
                  range: "[0,10000000000)",
                  integral: true,
                  units: "satoshis",
                },
                "max-channel": {
                  type: "number",
                  nullable: true,
                  name: "Max Channel Size",
                  description:
                    "Sets the maximum channel sizes that CLBOSS will make.  <b>Default:  No maximum</b>",
                  range: "[0,10000000000)",
                  integral: true,
                  units: "satoshis",
                },
              },
            },
          },
        },
      },
    },
  },
} as const,
);

export type SetConfig = typeof setConfigMatcher._TYPE;
