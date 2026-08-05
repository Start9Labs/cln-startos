# Core Lightning

## Documentation

- [Core Lightning documentation](https://docs.corelightning.org/docs/) — the upstream operator and developer reference.

## What you get on StartOS

- A **Core Lightning** node (`lightningd`) running mainnet, with an auto-created wallet on first start.
- A **Web UI** (CLN Application) for managing channels, payments, and invoices, with its own password set on first access.
- A **JSON-RPC** interface, a **gRPC** interface, and (when enabled) a **CLNrest** REST interface that publishes a URL containing a pre-generated rune for wallet apps.
- An optional **Clams Websocket** endpoint for Clams Remote.
- A bundled set of plugins built into the image: **CLBOSS** (automated channel management), **Sling** (channel rebalancing), and **TEOS** for watchtower client and server functionality.
- A required dependency on **Bitcoin** — install and fully sync Bitcoin first; CLN will not start without it.

## Getting set up

1. Install and fully sync **Bitcoin** if you haven't already.
2. Start Core Lightning. The wallet is created automatically on first start; no seed phrase setup is required.
3. Open the **Web UI** interface and set the UI password on first access. Save this password — it is independent of your StartOS credentials.
4. To connect a wallet app or other client, run the **Create Rune** action to generate an unrestricted rune, or use the rune embedded in the **CLNrest** interface URL.

## Using Core Lightning

### Interfaces

- **Web UI** — the CLN Application web dashboard for day-to-day node operation.
- **RPC** — JSON-RPC over HTTP for `lightning-cli` and scripts.
- **Peer** — the Lightning peer-to-peer port; share this address with peers who want to open channels with you.
- **grpc** — the gRPC API for apps and plugins that prefer typed RPC.
- **CLNrest** — REST API. When enabled, the published URL contains the rune wallet apps need to authenticate. The scheme tells wallets like Zeus which protocol to use: `clnrest+http://` for plain-HTTP addresses (use this for Tor onion addresses — Tor already encrypts) and `clnrest+https://` for SSL addresses (LAN/clearnet).
- **Clams Websocket** — websocket endpoint for Clams Remote, shown when the `clams-remote-websocket` option is on.
- **TEOS Watchtower** — present only when the watchtower server is enabled.

### Actions

- **Node Info** — display your node ID and peer URI(s) to share with channel partners.
- **Display BIP-39 Seed** — show the 12-word BIP-39 seed for on-chain recovery. Hidden if your wallet predates BIP-39 support in CLN; the seed alone does not recover channel state.
- **Create Rune** — generate an unrestricted rune for app integrations.
- **General Settings** — set alias, color, fee base and rate, minimum channel capacity, funding confirmations, Tor-only mode, Clams Websocket, and a custom external host.
  - **Custom External Host** announces an external tunnel or VPN endpoint, such as Tunnelsats, as your node's public address. It is announced in place of any public IP StartOS detects, so peers are not handed the home IP the tunnel exists to hide; your Tor address is still announced. Core Lightning resolves the name once at startup, so restart it if the endpoint moves to a new address. Nothing is announced while Tor-only mode is on, because Core Lightning cannot resolve a hostname with every connection forced through the proxy — a failing **Custom External Host** health check appears while both are set, to tell you so.
- **Plugins** — enable or disable CLNrest, Sling, and CLBOSS, with sub-settings for CLBOSS (min on-chain reserve, auto-close, zero base fee, channel size limits).
- **Experimental Features** — toggle splicing, shutdown-wrong-funding, and dual funding / liquidity ads (with policy, fuzz percentage, fund probability, and merchant lease-fee settings).
- **Watchtower Settings** — enable the TEOS watchtower server, enable the watchtower client, and add tower URIs to register with.
- **Watchtower Info** — visible when the watchtower server is enabled; shows the server URI and stats.
- **Watchtower Client Info** — visible when at least one tower is configured; shows registered towers and subscription state. Towers you add are registered automatically the next time Core Lightning starts, and stay registered across restarts and updates. If this list is empty, give the service a minute after startup and check it again — registration runs shortly after Core Lightning is up. Tower URIs are usually `.onion` addresses, which need Tor installed and running to reach.
- **Rescan Blockchain** — rescan the blockchain from a given depth or block height. **Required after restoring from backup** — the wallet balance reads zero until a rescan completes.
- **Reset UI Password** — clear the CLN Application UI password so you can set a new one on the next visit.
- **Delete Gossip Store** — delete a corrupted `gossip_store`; CLN will rebuild it from peers on next start. Available when the service is stopped.

### Backups and restore

StartOS backs up the `main` volume, excluding live database files and the gossip store. Restoring brings back your keys and settings, but **not** the wallet's record of its own coins — so right after a restore, your on-chain balance reads **zero**. This is expected and your funds are not lost.

After a restore, Core Lightning automatically:

- runs `emergencyrecover` to attempt recovery of channel funds via peer cooperation (best-effort — it depends on peers responding),
- pre-registers your wallet's addresses so the rescan below finds all of your coins,
- saves an untouched copy of the channel-recovery file as `bitcoin/emergency.recover.restored-<date>` for support and manual recovery,
- prompts you with a task to run **Rescan Blockchain**.

Run the rescan with a blockheight from before your node was created, prefixed with a hyphen (e.g. `-800000`). It takes hours; the **Synced** health check stays red while it works — leave Core Lightning and Bitcoin running until it turns green, then check your balance.

If the balance is still missing funds after the rescan completes, contact support: your funds are recoverable — the wallet's public descriptors can locate every coin exactly, even ones the rescan missed.

Once any recovered channels have resolved, sweep remaining funds to another wallet and reinstall fresh if you want to keep using the node. Restore only what you must: restoring an old backup over a working node replaces its live records with stale ones.

## Limitations

- **Mainnet only.** Testnet, signet, and regtest are not exposed.
- **Bitcoin authentication is cookie-based.** `bitcoin-rpcuser` and `bitcoin-rpcpassword` are intentionally not configurable; CLN uses the mounted Bitcoin cookie file.
- **The `config` file is managed through actions.** Manual edits will be overwritten on the next config sync.
