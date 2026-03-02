<p align="center">
  <img src="icon.png" alt="Core Lightning Logo" width="21%">
</p>

# Core Lightning on StartOS

> **Upstream docs:** <https://docs.corelightning.org/docs/home>
>
> Everything not listed in this document should behave the same as upstream
> Core Lightning v25.12.1. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable.

An implementation of the Lightning Network protocol by [Blockstream](https://blockstream.com/lightning). See the [upstream repo](https://github.com/ElementsProject/lightning) for general CLN documentation.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Default Overrides](#default-overrides)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property | Value |
|----------|-------|
| Image | Custom Dockerfile based on `elementsproject/lightningd:v25.12.1` |
| Architectures | x86_64, aarch64 |
| Entrypoint | `lightningd` with `--database-upgrade=true` |

The custom Dockerfile adds the following plugins on top of the upstream CLN image:

| Plugin | Source |
|--------|--------|
| **CLBOSS** | Built from source (automated channel management) |
| **Sling** | Built from source (channel rebalancing) |
| **TEOS watchtower-client** | Built from Rust (watchtower client plugin) |
| **TEOS server** (`teosd` / `teos-cli`) | Built from Rust (watchtower server) |

A second container runs the **CLN Application** web UI (`ghcr.io/elementsproject/cln-application:26.01.2`).

## Volume and Data Layout

| Volume | Mount Point | Purpose |
|--------|-------------|---------|
| `main` | `/root/.lightning` | All CLN data (wallet, channels, DB, config, plugins) |

StartOS-specific files on the `main` volume:

| File | Purpose |
|------|---------|
| `store.json` | Persistent StartOS state (restore flag, plugin settings, watchtower config) |
| `.commando-env` | Auto-generated commando rune for CLN Application UI |
| `bitcoin/ca.pem`, `server.pem`, `client.pem` + keys | StartOS-managed TLS certificates for gRPC |

The Bitcoin Core `main` volume is mounted read-only at `/mnt/bitcoin` for cookie authentication.

## Installation and First-Run Flow

1. TLS certificates (CA, server, client) are generated using StartOS's certificate system and written to the `main` volume
2. The CLN wallet is **automatically created** on first start by `lightningd` — no manual setup required
3. A **commando rune** is auto-generated on startup for the CLN Application web UI
4. The CLN Application web UI prompts the user to set a password on first access

## Configuration Management

CLN is configured through **StartOS actions** that write to the `config` file (INI format) and `store.json` on the `main` volume.

| StartOS-Managed (via Actions) | Details |
|-------------------------------|---------|
| General settings | Alias, color, fee base, fee rate, min capacity, CLTV delta, HTLC limits, funding confirms |
| Autoclean | Cycle interval, age thresholds for forwards, pays, and invoices |
| Plugins | CLNrest (toggle), Sling (toggle), CLBOSS (toggle + settings) |
| Experimental features | Dual funding, splicing, shutdown-wrong-funding, xpay |
| Watchtower server | Enable/disable TEOS watchtower server |
| Watchtower client | Enable/disable, add tower URIs |

Settings **not** managed by StartOS (hardcoded):

| Setting | Value | Reason |
|---------|-------|--------|
| `network` | `bitcoin` | Only mainnet supported |
| `bitcoin-rpcconnect` | `bitcoind.startos` | StartOS service networking |
| `bitcoin-rpcport` | `8332` | StartOS service networking |
| `bitcoin-datadir` | `/mnt/bitcoin` | Mounted dependency volume |
| `clnrest-port` | `3010` | Fixed internal port |
| `grpc-port` | `2106` | Fixed internal port |

## Default Overrides

The following settings are intentionally set to values that differ from
upstream CLN defaults. When a user leaves the field empty in the StartOS UI,
CLN uses its own upstream default (shown in the **Upstream** column). The
**Our Default** column shows what the StartOS form pre-fills.

| Setting | Upstream | Our Default | Reason |
|---------|----------|-------------|--------|
| `clnrest` | Disabled (no host/port set) | Enabled | Most users want REST API access for wallet apps |

All other numeric fields in the Experimental and Plugins actions use upstream
CLN defaults as placeholders. When a field is left empty, CLN's own default
applies.

## Network Access and Interfaces

| Interface | Port | Protocol | Purpose |
|-----------|------|----------|---------|
| Web UI (CLN Application) | 4500 | HTTP | Web-based node management UI |
| RPC | 8080 | HTTP | JSON-RPC commands |
| Peer | 9735 | TCP (raw) | Lightning peer-to-peer connections |
| gRPC | 2106 | HTTPS | gRPC API (with TLS) |
| CLNrest | 3010 | HTTPS | REST API with `clnrest://` URIs and embedded rune (when enabled) |
| Websocket (Clams) | 7272 | HTTP | Websocket for Clams Remote (when `ws::7272` bind-addr configured) |
| TEOS Watchtower | 9814 | TCP (raw) | Watchtower server (when enabled) |

## Actions (StartOS UI)

### Information

| Action | Purpose | Availability | Inputs |
|--------|---------|-------------|--------|
| **Node Info** | Display node ID and peer URI(s) | Running only | None |
| **Display BIP-39 Seed** | Display the wallet's 12-word BIP-39 seed | Any (disabled/hidden if no seed or legacy wallet) | None |
| **Create Rune** | Generate an unrestricted rune for app integrations | Running only | None |
| **Watchtower Info** | Display watchtower server URI and stats | Running only (disabled if watchtower server inactive) | None |
| **Watchtower Client Info** | Display registered tower details | Running only (disabled if no watchtower clients configured) | None |

### Configuration

| Action | Purpose | Availability |
|--------|---------|-------------|
| **General Settings** | Alias, color, fees, HTLC limits, routing settings | Any |
| **Autoclean** | Configure automatic cleanup of old forwards, payments, invoices | Any |
| **Plugins** | Enable/disable CLNrest, Sling, CLBOSS (with sub-settings) | Any |
| **Experimental Features** | Dual funding (incognito/merchant strategies), splicing, xpay, shutdown-wrong-funding | Any |
| **Watchtower Settings** | Enable/disable server and client, add tower URIs | Any |

### Maintenance

| Action | Purpose | Availability |
|--------|---------|-------------|
| **Rescan Blockchain** | Rescan from a specified height or depth | Any |
| **Reset UI Password** | Clear the CLN Application UI password | Any |
| **Delete Gossip Store** | Delete corrupted gossip_store (rebuilt from peers on next start) | Stopped only |

## Backups and Restore

**Backed up:** The entire `main` volume, **excluding** `bitcoin/lightning-rpc` (Unix socket) and `bitcoin/lightningd.sqlite3` (active database lock file).

**Restore behavior:** After restore, CLN runs `emergencyrecover` to attempt recovery of channel funds. Channel recovery depends on peer cooperation — funds may be stuck for an indeterminate period.

## Health Checks

| Check | Method | Messages |
|-------|--------|----------|
| **RPC Interface** | `lightning-cli getinfo` | Ready: "The RPC interface is ready" |
| **Web Interface** | Port listening (4500) | Ready: "The Web Interface is ready" |
| **Synced** | `lightning-cli getinfo` (warnings check) | Synced / Syncing to chain (with block progress) / Bitcoind not synced |
| **TEOS Watchtower Server** | `teos-cli gettowerinfo` | Online: "The Watchtower Server is online" (when enabled) |

## Dependencies

| Dependency | Required | Version | Purpose |
|------------|----------|---------|---------|
| Bitcoin Core | Required | `>=29.1:1-beta.0` | Block data, transaction broadcasting via RPC cookie auth |

CLN requires Bitcoin Core to be running and synced (health checks `sync-progress` and `primary` must pass).

## Limitations and Differences

1. **Mainnet only** — testnet/regtest/signet are not available
2. **Custom Docker image** — includes CLBOSS, Sling, and TEOS watchtower plugins not present in the upstream image
3. **Configuration via actions only** — the `config` file is managed by StartOS; manual edits will be overwritten on mismatch
4. **Bitcoin Core cookie auth only** — `bitcoin-rpcuser`/`bitcoin-rpcpassword` are explicitly removed; authentication uses the mounted `.cookie` file
5. **Tor proxy is auto-configured** — the `proxy` setting is set to the StartOS Tor SOCKS proxy on every start
6. **UI password managed separately** — the CLN Application web UI has its own password (set on first access, resettable via action), independent of StartOS credentials
7. **BIP-39 seed not available for legacy wallets** — wallets initialized on earlier CLN versions before BIP-39 support will not have a displayable seed

## What Is Unchanged from Upstream

- Channel management (open, close, force-close, cooperative close)
- Payment sending and receiving
- Invoice creation and management
- On-chain wallet functionality
- Routing and forwarding
- All JSON-RPC commands via `lightning-cli`
- gRPC API
- CLNrest REST API behavior
- Plugin system and plugin compatibility
- BOLT specification compliance
- Commando/rune authentication system

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: c-lightning
upstream_version: 25.12.1
image: custom Dockerfile (based on elementsproject/lightningd:v25.12.1)
ui_image: ghcr.io/elementsproject/cln-application:26.01.2
architectures: [x86_64, aarch64]
volumes:
  main: /root/.lightning
ports:
  web-ui: 4500
  rpc: 8080
  peer: 9735
  grpc: 2106
  clnrest: 3010
  websocket: 7272
  watchtower: 9814
dependencies:
  - bitcoind (required, >=29.1:1-beta.0)
startos_managed_env_vars: []
startos_managed_files:
  - store.json
  - .commando-env
  - bitcoin/ca.pem
  - bitcoin/server.pem
  - bitcoin/client.pem
actions:
  - config
  - autoclean
  - plugins
  - experimental
  - watchtower
  - node-info
  - display-seed
  - createrune
  - watchtower-info
  - watchtower-client-info
  - rescan-blockchain
  - reset-password
  - delete-gossip-store
bundled_plugins:
  - clboss
  - sling
  - watchtower-client (TEOS)
  - teosd (watchtower server)
health_checks:
  - lightning-cli_getinfo: rpc_ready
  - port_listening: 4500
  - lightning-cli_getinfo: synced
  - teos-cli_gettowerinfo: watchtower (conditional)
backup_volumes:
  - main (excluding bitcoin/lightning-rpc, bitcoin/lightningd.sqlite3)
```
