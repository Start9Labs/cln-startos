# Core Lightning (CLN) (formerly c-lightning)

## Dependencies

When running Core Lightning on StartOS it is recommended to use a full archival Bitcoin Core node. However, CLN can be run with a pruned node provided Bitcoin Core's version is >= 25.0.0~2.

## Core Lightning (CLN) Config

Your Core Lightning node is highly configurable. Many settings are considered
_advanced_ and should be used with caution. For the vast majority of users and
use-cases, we recommend using the defaults. You can change credentials from the
`Config` menu at any time. Once configured, you may start your node!

## Using a Wallet

CLN can be connected via LNLink or a Rune (generated from "Actions"), or alternatively, via the clnrest interface over tor (credentials are located in`Properties`). For a list of compatible wallets, refer to the
<a href="https://docs.start9.com/0.3.5.x/service-guides/lightning/index" target="_blank">lightning documentation</a>.

## User Interface

Your Core Lightning service comes with a featureful built in [UI](https://github.com/ElementsProject/cln-application). This interface can be used to deposit and withdraw bitcoin on chain, send and receive bitcoin over the lightning network, and even open or close channels! The password for your CLN UI can be found in the `Config` and `Properties` menus.

**Note: If the password for the CLN UI is changed outside of the `Config` menu i.e. within the CLN UI, the password shown in `Config` and `Properties` will not be updated!**

## CLBOSS

CLBOSS is an [Automated Node Manager](https://github.com/ZmnSCPxj/clboss) for
CLN.

Warning: CLBOSS is experimental software; use with caution! If you don't
understand what it's doing, then please leave it off, or use it only on a node
with small amounts until you get a feel for it. Unfortunately CLBOSS requires a
minimum of 1M sats in order to activate, so if you would regret losing this
amount, PLEASE USE CAUTION.

_CLBOSS is not designed to make your node profitable_. It will, however, attempt
to place your node in an advantageous position in the network graph, in order
that your node can always send, receive, and forward as many payments as
possible. This makes it an excellent feature for a node that is expecting to be
receiving lots of payments, such as a node connected to BTCPay Server or some
other merchant software.

To this end, here are some of the things CLBOSS can do automatically:

- Open channels to other, useful nodes when fees are low and there are onchain
  funds
- Acquire incoming capacity via boltz.exchange swaps.
- Rebalance open channels by self-payment (including JIT rebalancer).
- Set forwarding fees so that they're competitive with other nodes
- Close channels that are not performing well (this feature is experimental)

# CLBOSS Operation **(advanced users only)**

In order to control CLBOSS, you will use several commands and config options. If
you have SSH access to your Start9 server, the commands can be entered on the command
line using `podman exec -ti c-lightning.embassy lightning-cli <command>`.

The commands are:

- [`clboss-status`](https://github.com/ZmnSCPxj/clboss#clboss-status)
- [`clboss-externpay`](https://github.com/ZmnSCPxj/clboss#clboss-externpay)
- [`clboss-ignore-onchain` and `clboss-notice-onchain`](https://github.com/ZmnSCPxj/clboss#clboss-ignore-onchain-clboss-notice-onchain)
- [`clboss-unmanage`](https://github.com/ZmnSCPxj/clboss#clboss-unmanage)
- [`clboss-swaps`](https://github.com/ZmnSCPxj/clboss#clboss-swaps)

The config options can be found in your Service Details page for CLN (click on
Config below where you just clicked Instructions, then navigate to
Advanced->Plugins->CLBOSS Settings and then toggle to Enabled). Again, activate
these options with caution. You can see more info about each config option by
clicking the tooltips (question marks) next to each option.

To read more about operating CLBOSS, see
[the Operating section of the CLBOSS README](https://github.com/ZmnSCPxj/clboss#operating).

If you have any questions about CLBOSS, don't hesitate to reach out to
[Start9 support](https://start9.com/latest/support/contact).
