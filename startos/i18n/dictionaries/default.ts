export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Core Lightning!': 0,
  'RPC Interface': 1,
  'The RPC interface is ready': 2,
  'The RPC interface is not ready': 3,
  'Web Interface': 4,
  'The Web Interface is ready': 5,
  'The Web Interface is not ready': 6,
  'Synced': 7,
  'TEOS Watchtower Server': 8,
  'The Watchtower Server is online': 9,
  'TEOSd is starting...': 10,
  'Bitcoind is not up-to-date with network.': 11,
  'Synced to chain and ready to perform on-chain operations': 12,

  // interfaces.ts
  'Web UI': 13,
  'The web interface of CLN': 14,
  'RPC': 15,
  'Listens for JSON-RPC commands over HTTP.': 16,
  'Peer': 17,
  'Listens for incoming connections from lightning peers.': 18,
  'grpc': 19,
  'gRPC is a Rust-based plugin that provides a standardized API that apps, plugins, and other tools could use to interact with Core Lightning securely.': 20,
  'CLNrest': 21,
  'CLNRest is a lightweight Python-based built-in Core Lightning plugin (from v23.08) that transforms RPC calls into a REST service.': 22,
  'Clams Websocket': 23,
  'Websocket endpoint for Clams Remote.': 24,
  'TEOS Watchtower': 25,
  'The Eye of Satoshi is a Lightning watchtower compliant with BOLT13, written in Rust.': 26,

  // actions/resetPassword.ts
  'Reset UI Password': 27,
  'Reset UI Password in the event it is lost or forgotten': 28,
  'Success': 29,
  'Launch the CLN UI to set a new password': 30,

  // actions/generateRune.ts
  'Create Rune': 31,
  'Generate a rune with no restrictions. This rune can be used to connect with integrations such as Alby.': 32,
  "This rune has no restrictions! Anyone who has access to this rune could drain funds from your node. Be careful when giving this to apps that you don't trust": 33,
  'Successfully added unrestricted rune': 34,
  'Failed to Create Rune': 35,

  // actions/displaySeed.ts
  'Display BIP-39 Seed': 36,
  'The BIP-39 Seed can be used to recover on-chain funds in a disaster recovery scenario. Note this seed is insufficient to recover': 37,
  'No BIP-39 Seed found. Wallets initialized on earler versions of CLN were not derived from a BIP-39 Seed. If a BIP-39 Seed is desired, all funds will need to be transferred out of this node. After all funds have been safely transferred to another wallet, CLN can be uninstalled, and then installed fresh': 38,
  'BIP-39 Seed': 39,
  'WARNING: This seed is highly sensitive and sharing it with other will result in loss of funds. This Seed is for restoring on-chain ONLY funds; it has no knowledge of channel state.': 40,

  // actions/rescanBlockchain.ts
  'Rescan Blockchain': 41,
  "Rescan the blockchain from a specified height or depth. If rescanning from a specific blockheight, enter a negative number i.e. '-600000' to rescan from block 600,000 to the tip. Alternatively, you can enter a positive number as the depth i.e. '10000' to rescan the last 10,000 blocks from the tip": 42,
  'If CLN is running it will be restarted now to begin the rescan. If CLN is stopped it will rescan the next time CLN is started': 43,

  // actions/nodeInfo.ts
  'Node Info': 44,
  'Display Node ID and Peer Interface URIs.': 45,
  'Share this URI with others so they can add your CLN node as a peer': 46,
  'Necessary information about this node for peers to connect and open channels': 47,
  'Node ID': 48,
  'The node identifier that can be used for connecting to other nodes': 49,
  'Node URI(s)': 50,
  'URI(s) for other nodes to peer with and open a channels': 51,

  // actions/deleteGossipStore.ts
  'Delete Gossip Store': 52,
  'Deletes gossip_store in the case of corruption': 53,
  'The gossip_store has been deleted. On the next service start Core Lightning will rebuild gossip_store from peers': 54,

  // actions/config/config.ts
  'Other Config Options': 55,
  'Set other configuration options for CLN': 56,
  'Configuration': 57,

  // actions/config/autoclean.ts
  'Autoclean Options': 58,
  'Set autoclean options for deleting old invoices/payments/forwards': 59,

  // actions/config/plugins.ts
  'Plugins': 60,
  'Plugins are subprocesses that provide extra functionality and run alongside the lightningd process inside the main Core Lightning container in order to communicate directly with it. Their source is maintained separately from that of Core Lightning itself.': 61,

  // actions/config/experimental.ts
  'Experimental Features': 62,
  'Experimental features are those that have not yet been standardized across other major Lightning Network implementations.': 63,
  'Experimental options are subject to breakage between releases: they are made available for advanced users who want to test proposed features.': 64,

  // actions/watchtower/watchtower.ts
  'Watchtower Settings': 65,
  'Connect to external watchtower servers to protect your node from misbehaving channel peers. You can also run a watchtower server and share your server URI (found in properties) with friends/family to watch over their nodes.  You can learn more about watchtowers at https://docs.corelightning.org/docs/watchtowers.': 66,
  'Watchtower': 67,

  // actions/watchtower/watchtowerInfo.ts
  'Watchtower Info': 68,
  'Display information about the watchtower server running on this node.': 69,
  'Watchtower Server must be enabled': 70,
  'Tower Info': 71,
  'Share this Watchtower Server URI to allow other CLN nodes to register their watchtower clients with your watchtower': 72,
  'Watchtower Server URI(s)': 73,
  'Number of Registered Users': 74,
  'Number of users registered with this tower server': 75,
  'Number of Watcher Appointments': 76,
  'Number of channel states being watched, ready to submit the justice transaction should a breach be detected. There should be at most one of these per channel being watched.': 77,
  'Number of Responder Trackers': 78,
  'Number of active breaches in the process of being resolved.': 79,
  'Bitcoind Reachable': 80,
  'Whether your tower has an active connection to the blockchain backend.': 81,
  'Failure': 82,

  // actions/watchtower/watchtowerClientInfo.ts
  'Watchtower Client Info': 83,
  'Display information about the watchtower clients configured for this node.': 84,
  'Watchtower Client must be enabled': 85,
  'Watchtower Client Properties': 86,
  'Network Address': 87,
  'Network address the tower is listening on': 88,
  'Available Slots': 89,
  'Number of slots the tower has available': 90,
  'Subscription Start': 91,
  'Block height when the subscription started': 92,
  'Subscription Expiry': 93,
  'Block height when the subscription will expire': 94,
  'Status': 95,
  'Whether the tower is reachable': 96,

  // main.ts (health check)
  'Lightningd is still loading latest blocks from bitcoind, but bitcoin-cli failed to getblockcount from bitcoind': 97,

  // actions/rescanBlockchain.ts (InputSpec fields)
  'Depth (or Blockheight if prefixed with a hyphen)': 98,
  'Depth expressed as a positive number or blockheight prefixed with a hyphen.': 99,

  // actions/config/config.ts (InputSpec fields)
  'Alias': 100,
  'A custom, human-readable name for your node.  This is publicly visible to the Lightning Network.  <b>Default: Unique id of pattern: start9-[random alphanumerics]</b>': 101,
  'Must be at least 1 character and no more than 32 characters': 102,
  'Color': 103,
  'The public color of your node on the Lightning Network in hexadecimal.  <b>Default: Random color</b>': 104,
  'Must be a valid 6 digit hexadecimal RGB value. The first two digits are red, the middle two are green, and the final two are blue.': 105,
  'Tor Only': 106,
  'Only use tor connections.  This increases privacy, at the cost of some performance and reliability.  <b>Default: False</b>': 107,
  'Clams Remote': 108,
  'Accept incoming connections on port 7272, allowing Clams Remote to connect to Core Lightning.': 109,
  'Advanced': 110,
  'Advanced Options': 111,
  'Routing Base Fee': 112,
  'The base fee in millisatoshis you will charge for forwarding payments on your channels.  <b>Default: 1000</b>': 113,
  'Routing Fee Rate': 114,
  'The fee rate used when forwarding payments on your channels. The total fee charged is the Base Fee + (amount * Fee Rate / 1,000,000), where the amount is the forwarded amount.  Measured in sats per million.  <b>Default: 1</b>': 115,
  'Minimum Channel Capacity': 116,
  "This value defines the minimal effective channel capacity in satoshis to accept for channel opening requests.  This will reject any opening of a channel which can't pass an HTLC of at least this value. Usually this prevents a peer opening a tiny channel, but it can also prevent a channel you open with a reasonable amount and the peer is requesting such a large reserve that the capacity of the channel falls below this.  <b>Default: 10,000</b>": 117,
  'Ignore Fee Limits': 118,
  'Allow nodes which establish channels to you to set any fee they want. This may result in a channel which cannot be closed, should fees increase, but make channels far more reliable since Core Lightning will never close it due to unreasonable fees.  <b>Default: False</b>': 119,
  'Required Funding Confirmations': 120,
  'Confirmations required for the funding transaction when the other side opens a channel before the channel is usable.  <b>Default: 3</b>': 121,
  'Time Lock Delta': 122,
  'The number of blocks between the incoming payments and outgoing payments: this needs to be enough to make sure that if it has to, Core Lightning can close the outgoing payment before the incoming, or redeem the incoming once the outgoing is redeemed.  <b>Default: 40</b>': 123,
  'HTLC Minimum Size (Msat)': 124,
  'Sets the minimal allowed HTLC value for newly created channels. If you want to change the htlc_minimum_msat for existing channels, use the RPC call lightning-setchannel.  <b>Default: unset (no minimum)</b>': 125,
  'HTLC Maximum Size (Msat)': 126,
  'Sets the maximum allowed HTLC value for newly created channels. If you want to change the htlc_maximum_msat for existing channels, use the RPC call lightning-setchannel.  <b>Default: unset (no limit)</b>': 127,

  // actions/config/autoclean.ts (InputSpec fields)
  'Autoclean Interval': 128,
  'Interval to perform search for things to clean. <b>Default: 3600 (1 hour) which is usually sufficient.</b>': 129,
  'Successful Forwards Age': 130,
  'How old successful forwards (settled in listforwards status) have to be before deletion. <b>Default: 0, meaning never.</b>': 131,
  'Failed Forwards Age': 132,
  'How old failed forwards (failed or local_failed in listforwards status) have to be before deletion.  <b>Default: 0, meaning never.</b>': 133,
  'Successful Payments Age': 134,
  'How old successful payments (complete in listpays status) have to be before deletion.  <b>Default: 0, meaning never.</b>': 135,
  'Failed Payments Age': 136,
  'How old failed payment attempts (failed in listpays status) have to be before deletion.  <b>Default: 0, meaning never.</b>': 137,
  'Paid Invoices Age': 138,
  'How old invoices which were paid (paid in listinvoices status) have to be before deletion.  <b>Default: 0, meaning never.</b>': 139,
  'Expired Invoices Age': 140,
  'How old invoices which were not paid (and cannot be) (expired in listinvoices status) before deletion.  <b>Default: 0, meaning never</b>': 141,

  // actions/config/plugins.ts (InputSpec fields)
  'Sling': 142,
  'Automatically rebalance multiple channels. This is a CLI-only tool.  <b>Default: Disabled</b><br><b>Source:  https://github.com/daywalker90/sling</b>': 143,
  "Distinct from the C-Lightning-REST plugin, CLNRest is a lightweight Python-based built-in Core Lightning plugin (from v23.08) that transforms RPC calls into a REST service. It also broadcasts Core Lightning notifications to listeners connected to its websocket server. By generating REST API endpoints, it enables the execution of Core Lightning's RPC methods behind the scenes and provides responses in JSON format.  <b>Default: True</b>": 144,
  'CLBOSS settings': 145,
  'CLBOSS is an automated manager for Core Lightning forwarding nodes.  <b>Default: Disabled</b><br><b>Source: https://github.com/ZmnSCPxj/clboss</b>': 146,
  "CLBOSS automatically manages your CLN node. It is experimental software and will probably not be profitable to run. It will automatically open channels, buy incoming liquidity, rebalance channels, and set forwarding fees. If you don't want this behavior or don't understand what this means, please keep this option disabled. Source: https://github.com/ZmnSCPxj/clboss#operating": 147,
  'Disabled': 148,
  'Enabled': 149,
  'Minimum On-Chain': 150,
  'The minimum amount that CLBOSS will leave in the on-chain wallet. The intent is that this amount will be used in the future, by your node, to manage anchor-commitment channels, or post-Taproot Decker-Russell-Osuntokun channels. These channel types need some small amount of on-chain funds to unilaterally close, so it is not recommended to set it to 0. The amount specified is a ballpark figure, and CLBOSS may leave slightly lower or slightly higher than this amount.  <b>Default: 30000</b>': 151,
  'Auto Close': 152,
  'Enable if you want CLBOSS to have the ability to close channels it deems unprofitable.  This can be costly, please understand the ramifications before enabling.  <b>Default: False</b>': 153,
  'This feature is EXPERIMENTAL AND DANGEROUS!': 154,
  'Zero Base Fee': 155,
  'Specify how this node will advertise its base fee. <ul><li><b>Required:  </b>The base fee must be always 0.</li><li><b>Allow:  </b>If the heuristics of CLBOSS think it might be a good idea to set base fee to 0, let it be 0, but otherwise set it to whatever value the heuristics want.</li><li><b>Disallow:  </b>The base fee must always be non-zero. If the heuristics think it might be good to set it to 0, set it to 1 instead.</li></ul><b>Default:  default (use fee set by Advanced -> Routing Base Fee)</b><br>Some pathfinding algorithms under development may strongly prefer 0 or low base fees, so you might want to set CLBOSS to 0 base fee, or to allow a 0 base fee.': 156,
  'Min Channel Size': 157,
  'Sets the minimum channel sizes that CLBOSS will make.  <b>Default:  No minimum</b>': 158,
  'Max Channel Size': 159,
  'Sets the maximum channel sizes that CLBOSS will make.  <b>Default:  No maximum</b>': 160,

  // actions/config/experimental.ts (InputSpec fields)
  'Shutdown Wrong Funding': 161,
  "Allow channel shutdown with alternate txids.  If a remote node has opened a channel, but claims it used the incorrect txid (and the channel hasn't yet been used) this allows them to negotiate a clean shutdown with the txid they offer.  <b>Default: False</b>": 162,
  'Splicing': 163,
  'Enables support for the splicing protocol (bolt #863), allowing both parties to dynamically adjust the size a channel. These changes can be built interactively using PSBT and combined with other channel actions including dual fund, additional channel splices, or generic transaction activity. The operations will be bundled into a single transaction. The channel will remain active while awaiting splice confirmation, however you can only spend the smaller of the prior channel balance and the new one.  <b>Default: Disabled</b>': 164,
  'Xpay': 165,
  'Setting this makes xpay intercept simply pay commands (default false). Note that the response will be different from the normal pay command, however.  <b>Default: Disabled</b>': 166,
  'Dual Funding And Liquidity Ads': 167,
  'Dual Funding enables use of the channel opening protocol v2, in which both channel parties commit funds into the channel at opening. This potentially solves all sorts of problems with liquidity on the Lightning Network, but is currently experimental and only implemented by Core Lightning so far.<br>See https://blog.blockstream.com/setting-up-liquidity-ads-in-c-lightning/ for more details.  <b>Default: Disabled</b>': 168,
  'Dual funding is an experimental feature which can cause your node to automatically commit on-chain funds into channels that may or may not be profitable. <b>Use at your own risk!</b>': 169,
  'Dual-Funding Channel Acceptance Strategy': 170,
  "Select from two different operating strategies: Incognito, or Liquidity Merchant, and fine-tune your selected strategy's settings.<br><ul><li><b>Incognito: </b>Wait for others to stumble upon your unadvertised node and open a dual-fund request, then react in a more complex way</li><li><b>Liquidity Merchant: </b>Advertise and sell liquidity on the market in a straightforward way (i.e., always match 100% of requested funds, and don't accept dual-funding requests that aren't channel lease requests).</li></ul><br><b>Default: Incognito</b>": 171,
  'Incognito': 172,
  'Policy': 173,
  '<ul><li><b>Match: </b>Contribute a percentage of their requested funds.</li><li><b>Available: </b>Contribute policy_mod percent of our available node wallet funds.</li><li><b>Fixed: </b>Contribute a fixed number of sats to v2 channel open requests.</li></ul><br><b>Default: Match</b>': 174,
  'Match': 175,
  'Percentage of Requested Funds to Commit': 176,
  'Percentage of requested funds to commit to the channel. If this is a channel lease request, we match based on their requested funds. If it is not a channel lease request (and leases only is false, which is is by default), then we match their funding amount. Note: any lease match less than 100 will likely fail, as clients will not accept a lease less than their request.  <b>Default: 100</b>': 177,
  'Available': 178,
  'Percentage of Available Funds to Commit': 179,
  'Percentage of available on-chain funds to commit to the channel.  <b>Default: 100</b>': 180,
  'Fixed': 181,
  'Fixed Number of Satoshis to Commit': 182,
  'Fixed number of sats to contribute to the channel.  <b>Default: 10000</b>': 183,
  'Fuzz Percentage': 184,
  'A percentage to fuzz the resulting contribution amount by.<b>WARNING: Fuzzing with a Match 100% policy can cause random failures.<b><br><b>Defaults to 0% (no fuzz)</b>': 185,
  'Fund Probability': 186,
  'The percent of v2 channel open requests to apply our policy to. Valid values are integers from 0 (fund no requests) to 100 (fund every request). Useful for randomizing opens that receive funds.  <b>Default: 100</b>': 187,
  'Liquidity Merchant': 188,
  'Fixed Lease Fee': 189,
  'The flat fee for a channel lease. Node will receive this much extra added to their channel balance, paid by the opening node.  <b>Default: 2000</b>': 190,
  'Fee as Percentage of Requested Funds': 191,
  "A basis fee that's calculated as 1/10k of the total requested funds the peer is asking for. Node will receive the total of the lease fee basis * requested funds / 10k satoshis added to their channel balance, paid by the opening node. <b>Default: 0.65% (65 basis points)</b>": 192,
  'Funding Weight': 193,
  'Transaction weight the channel opener will pay us for a leased funding transaction. Node will have this funding fee added to their channel balance, paid by the opening node. <b>Default: dynamically calculated for 2 inputs + 1 P2WPKH output</b>': 194,
  'Channel Fee Max Base': 195,
  'A commitment to a maximum channel_fee_base_msat that your node will charge for routing payments over this leased channel during the lease duration. <b>Default: 5000000</b>': 196,
  'Channel Fee Max Proportional': 197,
  "A commitment to a maximum channel_fee_proportional_millionths that your node will charge for routing payments over this leased channel during the lease duration. Note that it's denominated in 'thousandths'. A setting of 1 is equal to 1k ppm; 5 is 5k ppm, etc. <b>Default: 100 (100k ppm)</b>": 198,
  'Other Settings': 199,
  'Additional settings that apply to both operating strategies': 200,
  'Minimum Their Funding': 201,
  'The minimum funding msats that we require in order to activate our contribution policy to the v2 open.  <b>Default: 10000000</b>': 202,
  'Maximum Their Funding': 203,
  'The maximum funding msats that we will consider to activate our contribution policy to the v2 open. Any channel open above this will not be funded.  <b>Default: No max</b>': 204,
  'Per-Channel Minimum': 205,
  'The minimum amount that we will contribute to a channel open.  <b>Default: 10000000': 206,
  'Per-Channel Maximum': 207,
  'The maximum amount that we will contribute to a channel open.  <b>Default: 10000000</b>': 208,
  'Reserve Tank': 209,
  'The amount of msats to leave available in the node wallet.  <b>Default: Nothing (can use all on-chain funds)</b>': 210,

  // actions/watchtower/watchtower.ts (InputSpec fields)
  'Watchtower Server': 211,
  'Allow other nodes to connect to your watchtower server on the network.  <b>Default: Disabled</b>': 212,
  'Watchtower Client': 213,
  'Enable the client and connect to a watchtower server(s) of your choice in order to use watchtower features.  <b>Default: Disabled</b>': 214,
  'Add Watchtower Servers': 215,
  "Add URIs of watchtower servers to connect to. If you don't know of anyone with a server, you can find some on this public listing: https://github.com/talaia-labs/rust-teos/discussions/158": 216,

  // install/versions/v25.12.0.1-beta.1.ts
  'No existing config found. Writing defaults': 217,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
