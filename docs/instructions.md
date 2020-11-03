# c-lightning

### Dependencies

c-lightning on the Embassy requires a full archival Bitcoin node to function. Since your Embassy Bitcoin node is pruned by default, an additional service, Bitcoin Proxy, is also required. Once you have Bitcoin Proxy installed and running,

### Config

Your c-lightning node is highly configurable. Many settings are considered _advanced_ and should be used with caution. For the vast majority of users and use-cases, we recommend using the defaults. Once configured, you may start your node!

### Configuring Bitcoin Proxy

Go to `Services > c-lightning`, find the Bitcoin Proxy dependency, and click `Configure`. This will automatically configure Bitcoin Proxy to satisfy c-lightning.

### Using a Wallet

For a list of compatible wallets, see <a href="https://github.com/start9labs/c-lightning-wrapper/blob/master/docs/wallets.md" target="_blank">https://github.com/start9labs/c-lightning-wrapper/blob/master/docs/wallets.md</a> (this link will not work in the Consulate).