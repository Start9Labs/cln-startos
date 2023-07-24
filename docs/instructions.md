# Core Lightning (CLN) (formerly c-lightning)

## Dependencies

Core Lightning on StartOS requires a full archival Bitcoin node to function.

## Core Lightning (CLN) Config

Your Core Lightning node is highly configurable. Many settings are considered
_advanced_ and should be used with caution. For the vast majority of users and
use-cases, we recommend using the defaults. You can change credentials from the
`Config` menu at any time. Once configured, you may start your node!

## Using a Wallet

CLN can be connected to wallets supporting connecting over tor to the Sparko interface or the REST inferface (credentials for both are located in
`Properties`). For a list of compatible wallets, see
<a href="https://github.com/start9labs/c-lightning-wrapper/blob/master/docs/wallets.md" target="_blank">https://github.com/start9labs/c-lightning-wrapper/blob/master/docs/wallets.md</a>.

## User Interface

Your Core Lightning service comes with a featureful built in [UI](https://github.com/ElementsProject/cln-application/tree/d53e19548939641e7e12c756f43ef5fcf164225d). This interface can be used to deposit and withdraw bitcoin on chain, send and receive bitcoin over the lightning network, and even open or close channels!

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
- Set forwarding fees so that they're competitive to other nodes
- Close channels that are not performing well (this feature is experimental)

# CLBOSS Operation **(advanced users only)**

In order to control CLBOSS, you will use several commands and config options. If
you have SSH access to your Start9 server, the commands can be entered on the command
line using `docker exec -ti c-lightning.embassy lightning-cli <command>`. If you
don't have SSH access, you can use the Console interface inside Spark Wallet (a
frontend for CLN, offered as a separate service on the Start9 Registry, see
below for more on Spark Console).

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

# Spark Console

In order to access Spark Console, first install, configure, and start Spark
Wallet from the Start9 Registry. Then open the UI and scroll to the bottom
of the page. Click the version number at the bottom left of the Spark UI:

<!-- MD_PACKER_INLINE BEGIN -->
![spark console access](./assets/spark-console-access.png)
<!-- MD_PACKER_INLINE END -->

A wrench will appear next to the version number to indicate that advanced mode
is active. Then click the "Console" button that has just appeared at the top of
the page:

<!-- MD_PACKER_INLINE BEGIN -->
![spark console button](./assets/spark-console-button.png)
<!-- MD_PACKER_INLINE END -->

Then enter any of the commands listed above, and hit "Execute" (or the ENTER
key) to see the result:

<!-- MD_PACKER_INLINE BEGIN -->
![spark console command](./assets/spark-console-command.png)
<!-- MD_PACKER_INLINE END -->

Enjoy!
