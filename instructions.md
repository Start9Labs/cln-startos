# Core Lightning

## Documentation

- [Core Lightning documentation](https://docs.corelightning.org/docs/home) — the upstream operator and developer reference.

## What you get on StartOS

- A **Core Lightning** node (`lightningd`) running mainnet, with an auto-created wallet on first start.
- A **Web UI** (CLN Application) for managing channels, payments, and invoices, with its own password set on first access.
- A **JSON-RPC** interface, a **gRPC** interface, and (when enabled) a **CLNrest** REST interface that publishes a URL containing a pre-generated rune for wallet apps.
- An optional **Clams Websocket** endpoint for Clams Remote.
- A bundled set of plugins built into the image: **CLBOSS** (automated channel management), **Sling** (channel rebalancing), and **TEOS** for watchtower client and server functionality.
- A required dependency on **Bitcoin Core** — install and fully sync Bitcoin Core first; CLN will not start without it.

## Getting set up

1. Install and fully sync **Bitcoin Core** if you haven't already.
2. Start Core Lightning. The wallet is created automatically on first start; no seed phrase setup is required.
3. Open the **Web UI** interface and set the UI password on first access. Save this password — it is independent of your StartOS credentials.
4. To connect a wallet app or other client, run the **Create Rune** action to generate an unrestricted rune, or use the rune embedded in the **CLNrest** interface URL.

## Using Core Lightning

### Interfaces

- **Web UI** — the CLN Application web dashboard for day-to-day node operation.
- **RPC** — JSON-RPC over HTTP for `lightning-cli` and scripts.
- **Peer** — the Lightning peer-to-peer port; share this address with peers who want to open channels with you.
- **grpc** — the gRPC API for apps and plugins that prefer typed RPC.
- **CLNrest** — REST API. When enabled, the published URL contains the rune wallet apps need to authenticate; the scheme is `clnrest://`.
- **Clams Websocket** — websocket endpoint for Clams Remote, shown when the `clams-remote-websocket` option is on.
- **TEOS Watchtower** — present only when the watchtower server is enabled.

### Actions

- **Node Info** — display your node ID and peer URI(s) to share with channel partners.
- **Display BIP-39 Seed** — show the 12-word BIP-39 seed for on-chain recovery. Hidden if your wallet predates BIP-39 support in CLN; the seed alone does not recover channel state.
- **Create Rune** — generate an unrestricted rune for app integrations.
- **Other Config Options** — set alias, color, fee base and rate, minimum channel capacity, funding confirmations, Tor-only mode, and Clams Websocket.
- **Plugins** — enable or disable CLNrest, Sling, and CLBOSS, with sub-settings for CLBOSS (min on-chain reserve, auto-close, zero base fee, channel size limits).
- **Experimental Features** — toggle splicing, shutdown-wrong-funding, and dual funding / liquidity ads (with policy, fuzz percentage, fund probability, and merchant lease-fee settings).
- **Watchtower Settings** — enable the TEOS watchtower server, enable the watchtower client, and add tower URIs to register with.
- **Watchtower Info** — visible when the watchtower server is enabled; shows the server URI and stats.
- **Watchtower Client Info** — visible when at least one tower is configured; shows registered towers and subscription state.
- **Rescan Blockchain** — rescan the blockchain from a given depth or block height. Useful after restoring an on-chain wallet.
- **Reset UI Password** — clear the CLN Application UI password so you can set a new one on the next visit.
- **Delete Gossip Store** — delete a corrupted `gossip_store`; CLN will rebuild it from peers on next start. Available when the service is stopped.

### Backups and restore

StartOS backs up the `main` volume, excluding live database files and the gossip store. After a restore, CLN automatically runs `emergencyrecover` to attempt to recover channel funds via peer cooperation. Recovery is best-effort and depends on peers responding — once channels have resolved, sweep remaining funds to another wallet and reinstall fresh if you want to keep using the node.

## Limitations

- **Mainnet only.** Testnet, signet, and regtest are not exposed.
- **Bitcoin authentication is cookie-based.** `bitcoin-rpcuser` and `bitcoin-rpcpassword` are intentionally not configurable; CLN uses the mounted Bitcoin Core cookie file.
- **The `config` file is managed through actions.** Manual edits will be overwritten on the next config sync.
