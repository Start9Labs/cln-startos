# Core Lightning (CLN) (formerly c-lightning)

## Dependencies

Core Lightning on the Embassy requires a full archival Bitcoin node to function. If your Embassy Bitcoin node is pruned, an additional service, Bitcoin Proxy, is also required.

## Core Lightning (CLN) Config

Your Core Lightning node is highly configurable. Many settings are considered _advanced_ and should be used with caution. For the vast majority of users and use-cases, we recommend using the defaults. You can change credentials from the `Config` menu at any time. Once configured, you may start your node!

## Bitcoin Proxy Configs

On the Core Lightning service details page, scroll down to find the Bitcoin Proxy dependency. Click `Configure`. This will automatically configure Bitcoin Proxy to satisfy Core Lightning.

## Using a Wallet

Enter your QuickConnect QR code **OR** your raw credentials (both located in `Properties`) into any wallet that supports connecting to a remote Core Lightning node over Tor. For a list of compatible wallets, see <a href="https://github.com/start9labs/c-lightning-wrapper/blob/master/docs/wallets.md" target="_blank">https://github.com/start9labs/c-lightning-wrapper/blob/master/docs/wallets.md</a>.
