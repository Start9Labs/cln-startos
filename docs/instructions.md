# Core Lightning (CLN)

Formerly known as c-lightning, CLN is developed by Blockstream. It focuses on modularity and performance. CLN is designed to be efficient and stable.

## Getting Started
### An Introduction to Lightning

Bitcoin's Lightning Network is a second-layer scaling solution designed to enable faster and cheaper transactions on top of the Bitcoin blockchain. It allows users to create off-chain payment channels, which can facilitate multiple transactions without needing to record each one on the main blockchain.

There's a lot to learn before funding your CLN on-chain wallet and opening channels.

- [The concept of liquidity](https://bitcoin.design/guide/how-it-works/liquidity/)
- [Opening channels](https://docs.start9.com/service-guides/lightning/opening-channels.html)
- [Getting inbound liquidity](https://docs.start9.com/service-guides/lightning/getting-inbound-liquidity.html)


### Config

Your CLN node is highly configurable. Many settings are considered advanced and should be used with caution. For the vast majority of users and use cases, we recommend using the defaults but you may prefer to tweak some before you being. Once configuration is complete, you may start your node!

#### Bitcoin Backend

CLN works with both Bitcoin Core and Bitcoin Knots, whichever is running. It is recommended to use a full archival Bitcoin Core node. However, CLN can be run with a pruned node provided Bitcoin's version is >= 25.0.0~2.

#### General Settings
##### Privacy

The Lightning Network allows you to open announced channels, unannounced channels, or a mixture of the two. Announced channels are those whose existence and size are publicly visible to all participants in the network and would ordinarily be used to route payments between distant peers. Unannounced channels are those only known to you and the channel peer to whom you opened the channel. If you only have unannounced channels, then your node may go undetected on the wider network, but you'd rely entirely on the liquidity and the connectedness of your channel peer to send or receive payments, and some may fail.

Privacy-focused node runners may want to run all their traffic over TOR, and that option is available to you on StartOS. This would prevent the leaking of your IP address via clearnet.

There's lots of fun to be had for those who aren't quite as privacy-focused, such as setting a public `Alias` and `Color` for your node that can be seen across your announced channels. You can also claim your node with your real or pseudo-anonymous identity then join communities such as [Plebnet](https://t.me/plebnet), [Amboss](https://amboss.space/), and [LightningNetwork+](https://lightningnetwork.plus/). Large numbers of well-connected announced channels with plenty of liquidity can also route payments for other nodes, earning small amounts of sats per payment routed.

##### Allow Routing and Permitted Channel Sizes

Routing is the process of passing along payments in through one peer and out through another, with payments sent by and being received by third parties who may be several hops away. You can choose to allow routing requests. Preventing routing requests means that you don't earn small amounts of sats per routing event, but it also means you do not slowly unbalance your channels and later need to rebalance (perhaps costing more than you earned).

If you have many announced channels and good connectedness, peers you have no relation to may find your node on the network and decide to open a channel to it. You can set minimum and maximum channel sizes. `Minimum Channel Size` is perhaps more relevant to a beginner, as many users may not want to deal with the resources and risks associated with funds allocated across many small channels that may not be particularly useful for your own regular payment sizes. It is not recommended to open a channel of less than 100,000 satoshis since anything less could mean it's possible that the cost to open and close the channel might approach the size of the channel itself. The bigger the channel you open, the more outbound liquidity you will have, which means you have more spending power on the network.

#### Channel Configuration Settings

There are some key values found here that could become important if you intend to route payments or deploy funds to channels with large centralized peers. While different fees can be set on individual channels using the preferred software interface, you may still want to change the default values `Routing Base Fee` (fixed amount per routing event) and `Routing Fee Rate` (additional proportional amount for routing events) for all new channels created to prevent them from draining immediately.

## Backups

When your server backs up your service, it takes a copy of your settings, your hsm_secret (private key), and a Static Channel Backup. This is all you need to recover your funds in the event of a disaster.

Restoring a backup reinstates your settings, returns your original on-chain wallet, and then uses the Static Channel Backup to request that peers force-close all of your channels since you no longer know the correct balances of these channels (as they will have changed between the time of the backup and the disaster). It is not recommended that you continue using the same instance; it is better to move your funds to a safe location, then uninstall/reinstall CLN, and finally fund the new on-chain wallet.

## Watchtowers

Watchtowers act as a second line of defense in responding to malicious or accidental breach scenarios in the event that the client’s node is offline or unable to respond at the time of a breach, offering a greater degree of safety for channel funds.

You can make your CLN node a watchtower for others by enabling your Watchtower Server in the Watchtower settings. You can then provide this watchtower address to friends and family.

You can add watchtowers to monitor your node by enabling your Watchtower client in the Watchtower settings. This will back up your CLN node state to the remote watchtower(s) you added, received from friends and family.


## Interacting with your CLN node and connecting wallets
### Connect Directly to CLN

- [Alby Browser Extension](wallet-integrations/alby-extension.md)
- [RTL](wallet-integrations/rtl.md)
- [Zeus](wallet-integrations/zeus.md)