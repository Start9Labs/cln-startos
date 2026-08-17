<p align="center">
  <img src="icon.svg" alt="Core Lightning Logo" width="21%">
</p>

# Core Lightning on StartOS

> Everything not listed in this document should behave the same as upstream
> Core Lightning. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Core Lightning](https://github.com/ElementsProject/lightning) is a Lightning Network node implementation. This package builds it with three plugins compiled in, runs a web UI alongside it, and can act as — or subscribe to — a BOLT13 watchtower.

- **Upstream repo:** <https://github.com/ElementsProject/lightning>
- **Wrapper repo:** <https://github.com/Start9Labs/cln-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Two images. The node's is built here because three plugins are compiled from source and copied into upstream's image; the web UI's is pulled as published.

| Property      | Value                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Images        | Built from `Dockerfile` on `elementsproject/lightningd`, plus `ghcr.io/elementsproject/cln-application` |
| Architectures | x86_64, aarch64 — both images declare `emulateMissingAs: 'aarch64'`                                     |
| Entrypoint    | `lightningd` with an explicit config path; the UI runs its own server                                   |

Three plugins are built from git submodules and dropped into the plugin directory: **CLBOSS** (automated channel management), **watchtower-client** and **teosd** from rust-teos (BOLT13 watchtower, both client and server), and **sling** (rebalancing). They are compiled in rather than downloaded at runtime, so the image is self-contained.

| Subcontainer          | Purpose                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| `lightning-sub`       | `lightningd`, the watchtower server, and every oneshot — the one to `attach` to |
| `cln-application-sub` | The web UI, which talks to the node over its RPC and rune                       |

## Volume and Data Layout

One volume, holding everything.

| Volume | Mount Point        | Purpose                                                                                                                                |
| ------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `main` | `/root/.lightning` | The lightning directory: `config`, the node's `hsm_secret` and channel database, the UI's own data, the watchtower's, and `store.json` |

Bitcoin's data directory is mounted **read-only** at `/mnt/bitcoin`, which is how both `lightningd` and the watchtower read its RPC cookie without a password ever being stored.

The watchtower client's own database is deliberately relocated onto this volume. Upstream defaults it to the user's home directory, which is not persistent here, and the effect of leaving it there is silent: the client would re-key and forget every registered tower on each container rebuild.

## File Models

Four models. One is the node's own configuration, one is the web UI's, one is the watchtower's, and one is StartOS-side state.

| File                    | Format | Modelled                | Written by                                                          |
| ----------------------- | ------ | ----------------------- | ------------------------------------------------------------------- |
| `/config`               | INI    | Yes — `FileHelper.raw`  | Every init, the config actions, and `watchHosts` on address changes |
| `/store.json`           | JSON   | Yes — `FileHelper.json` | Every init, the watchtower and rescan actions, `main`, and restore  |
| `/data/app/config.json` | JSON   | Yes — `FileHelper.json` | Every init, and the Reset UI Password action                        |
| `/.teos/teos.toml`      | TOML   | Yes — `FileHelper.toml` | Every init                                                          |

### config

**Enforced** — rewritten whenever the package writes the file: `network`, `bitcoin-datadir`, `bind-addr`, `grpc-port`, `grpc-host`, and `clnrest-protocol`. `bitcoin-rpcuser` and `bitcoin-rpcpassword` are modelled as "must be absent" and deleted if present, because authentication is by the cookie read through the mount.

`clnrest-protocol` is the one enforced value that is an override rather than a constant: **upstream defaults CLNrest to HTTPS, and this package forces plaintext.** A Tor onion address already encrypts, and wallets reaching the node that way cannot validate a StartOS-issued certificate; LAN and clearnet callers still get TLS, terminated by StartOS at the edge. See [Network Access and Interfaces](#network-access-and-interfaces).

**Derived, and rewritten whenever the underlying address changes:** `proxy` (Tor's SOCKS address), `announce-addr` (the onion and public addresses published on the peer interface, or your custom external host in place of the IPs), and `bitcoin-rpcconnect` / `bitcoin-rpcport`. Editing any of these by hand does not stick.

Everything else — alias, colour, fee policy, channel minimums, the plugin selection, CLBOSS's tuning, the experimental flags — is yours, through the config actions. The only override install makes is switching `clnrest` on.

Two interactions are worth knowing because they produce a state neither setting explains alone. A **custom external host is dropped rather than written while Tor Only is enabled**: `always-use-proxy` disables lightningd's DNS resolution, and an `announce-addr` it cannot resolve is a fatal startup error rather than a warning — so the package omits it and raises a health check saying so. And **enabling the Clams websocket adds a second `ws::` bind address** rather than replacing the first.

### store.json

`watchtowerServer` and `watchtowerClients` are the watchtower configuration, `customExternalHosts` the announced address override, and `rescan` and `restore` are one-shot request flags.

Those two flags are deliberately **not** cleared when `main` reads them. A session where `lightningd` never comes up must not consume a request, or it vanishes silently — which is how a rescan requested during a crash loop used to be lost. A oneshot clears them only once the node answers RPC, and `main` ignores that clearing write so it does not bounce the service.

### config.json and teos.toml

The web UI's `config.json` carries its display preferences and its password hash. `teos.toml` is entirely enforced apart from Bitcoin's address, which is derived like the node's: every port, bind address, and subscription parameter is a fixed value, so the watchtower is not configurable from here.

## Dependencies

One, and it is required.

| Dependency | Kind      | Health checks               | Mount                     | Why                            |
| ---------- | --------- | --------------------------- | ------------------------- | ------------------------------ |
| Bitcoin    | `running` | `bitcoind`, `sync-progress` | `/mnt/bitcoin`, read-only | Chain data, and the RPC cookie |

Both health checks are required, not just "running": a node that is up but still syncing cannot serve a Lightning node correctly, and the sync state is surfaced again in this package's own [`check-synced`](#health-checks).

Bitcoin's RPC address is resolved from its own binding over the service bridge, so nothing is configured by hand and a Bitcoin update does not move it. When Bitcoin is absent the address keys are cleared rather than left stale, and `lightningd` fails to connect until it returns.

The node additionally **restarts when Bitcoin writes a replacement RPC cookie**, but not when the cookie merely disappears — an absent cookie means Bitcoin is down, and stopping `lightningd` at that moment hangs its shutdown.

## Network Access and Interfaces

Four interfaces always, and three more depending on what is enabled.

| Interface       | Id           | Type | Port | Present                                     |
| --------------- | ------------ | ---- | ---- | ------------------------------------------- |
| Web UI          | `ui`         | ui   | 4500 | always                                      |
| RPC             | `rpc`        | api  | 8080 | always                                      |
| Peer            | `peer`       | p2p  | 9735 | always                                      |
| gRPC            | `grpc`       | api  | 2106 | always                                      |
| CLNrest         | `clnrest`    | api  | 3010 | when CLNrest is enabled (it is, at install) |
| Clams Websocket | `websocket`  | api  | 7272 | when the Clams remote websocket is enabled  |
| TEOS Watchtower | `watchtower` | api  | 9814 | when the watchtower server is enabled       |

**gRPC is passed through, not terminated.** The plugin performs its own mutual TLS, so StartOS must not terminate at the edge — doing so would present the device certificate and strip the client's. The binding is configured for raw passthrough deliberately; a conventional HTTPS binding would look correct and silently break client authentication.

**CLNrest carries its own credential in the address.** The interface's URL includes the rune the package generated, and its scheme is overridden to `clnrest+https` or `clnrest+http` so that a wallet reading the scheme knows which transport to use — a bare `clnrest://` is assumed to be TLS, which would be wrong for the Tor address.

## Installation and First-Run Flow

Install seeds the four models, switches CLNrest on, and starts the node — there is no wizard, and no credential is asked for. Wallet creation is `lightningd`'s own: it generates `hsm_secret` on first start.

The one piece of setup the package performs is the web UI's credential. A oneshot creates a rune scoped to the application and records it alongside the node's public key, regenerating it only if the node's identity changes or the rune is missing. The UI cannot start until that has happened.

The ordering that matters is Bitcoin's: the node starts, but `check-synced` reports Bitcoin's progress and then its own until both are caught up, which on a fresh Bitcoin node is the length of an initial block download.

## Actions

Thirteen actions. Four configure the node, three concern the watchtower, and the rest are recovery and information.

### Configuration — General Settings, Plugins, Experimental Features

Three actions writing `/config`, grouped together. Each writes only the fields it presents, costs seconds plus a restart, and is safe to re-run — the forms are pre-filled from the current file.

- **General Settings** carries node identity, fee policy, channel minimums, Tor Only, the custom external host, and the CLNrest and Clams toggles. Two combinations produce a visible consequence rather than an error: Tor Only with a custom external host drops the host and raises a health check, and the Clams toggle changes the bind addresses.
- **Plugins** selects which of the compiled-in plugins load, and carries CLBOSS's tuning.
- **Experimental Features** exposes upstream's experimental flags, which are not standardized across implementations and may break between releases.

### Watchtower Server, Watchtower Info, Watchtower Client Info

**Watchtower Server** turns this node into a BOLT13 tower for others, which starts the `teosd` daemon and publishes an interface. It also registers and de-registers the towers **this** node subscribes to: a tower removed from the list is abandoned on the next start.

- **What it changes:** `watchtowerServer` and `watchtowerClients` in `store.json`, and through them the daemon chain and the exported interfaces.
- **Cost:** seconds, then a restart.
- **Repeat safety:** safe both ways.

**Watchtower Info** and **Watchtower Client Info** are read-only, available only while running, and each is hidden unless the corresponding side is enabled: the first reports this node's tower identity, the second the towers it is subscribed to.

### Create Rune, Revoke All Runes

**Create Rune** mints an access credential for an external application, with the restrictions you specify. Available only while running; each run produces a new rune and does not affect existing ones.

**Revoke All Runes** invalidates every rune this node has issued **including the web UI's**, which is regenerated automatically on the next start. Run it when a credential may have been exposed. It is not selective — that is the point of it — so anything you have connected must be re-authorized afterwards.

### Display BIP-39 Seed

Shows the seed words backing the on-chain wallet, for disaster recovery. Note what it is not: the seed alone cannot recover channel funds.

- **Visibility:** hidden entirely when no wallet exists yet, and shown as disabled with an explanation on a node whose wallet predates BIP-39 seeds — such a wallet cannot be given one, and moving the funds to a fresh install is the only route.
- **Repeat safety:** read-only.

### Rescan Blockchain

Re-scans the chain for wallet outputs. Run it after a restore, or when an on-chain balance is missing.

- **Input:** a depth from the tip, or an absolute block height written with a leading hyphen.
- **What it changes:** sets the `rescan` request flag, which the next start turns into a `lightningd` argument and then clears.
- **Cost:** hours. `check-synced` stays red for the duration; leave the node and Bitcoin running.
- **Repeat safety:** safe to re-run. Because the flag is only consumed once the node answers RPC, a request survives a failed start rather than being silently dropped.

### Reset UI Password

Sets a new password for the web UI, writing its `config.json`. It does not touch the node, its runes, or any external application's access.

### Delete Gossip Store

Deletes the network gossip database, which the node rebuilds from peers. Run it if gossip is suspected corrupt.

- **Availability:** only while stopped, since the file is open in use.
- **Cost:** the node re-learns the network graph after starting, which takes time and affects routing until it does.
- **Repeat safety:** idempotent.

### Node Info

Read-only, running only: the node's identity and current state.

## Tasks

One task, raised by a restore rather than at install.

| Task              | Severity    | Raised when                        | Cleared when    |
| ----------------- | ----------- | ---------------------------------- | --------------- |
| Rescan Blockchain | `important` | Immediately after a backup restore | The action runs |

The reason is that a restored node reports an **on-chain balance of zero** until the chain is rescanned, and nothing else in the interface explains why. `important` rather than `critical`: the node should keep running — indeed it must, for the rescan to proceed.

## Health Checks

Between three and five checks, plus one that appears only after a restore.

| Check                  | Displayed                     | Method                                               | Present                                   |
| ---------------------- | ----------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| `lightningd`           | "RPC Interface"               | `lightning-cli getinfo` succeeds                     | always                                    |
| `cln-application`      | "Web Interface"               | The UI's port is listening                           | always                                    |
| `check-synced`         | "Synced"                      | `getinfo`'s sync warnings, and Bitcoin's block count | always                                    |
| `watchtower-server`    | "TEOS Watchtower Server"      | `teos-cli gettowerinfo` succeeds                     | while the watchtower server is enabled    |
| `custom-external-host` | "Custom External Host"        | Always fails, with an explanation                    | while Tor Only and a custom host conflict |
| `restored`             | "Backup Restoration Detected" | Always fails, with an explanation                    | after an emergency recovery               |

**`check-synced` distinguishes three states**, which is what makes it worth reading: Bitcoin not yet synced, the node catching up to Bitcoin (reported as a block count against Bitcoin's own), and synced. It fails only when `lightning-cli` itself errors, so a red check here is the node, not the chain.

**Two checks are deliberate permanent failures**, used as a way to say something the interface has nowhere else to put. `custom-external-host` reports that an announced address is being suppressed by Tor Only, and names both settings to change. `restored` reports that an emergency recovery has happened and that the node should be drained and reinstalled rather than kept in service — a state that is not a fault in the running software but is a serious one for the operator.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')` — but the exclusions are the substance, because **the channel database is deliberately not backed up.**

- **Excluded:** `lightningd.sqlite3` and its write-ahead sidecars, the RPC socket, the gossip store, and the application log.
- **Included:** `hsm_secret`, `config`, `store.json`, the emergency-recovery file, the watchtower's data, and the UI's settings.

Restoring a Lightning node's channel database is dangerous — a stale copy claims a channel state the network has moved past — so this package does not restore one. What comes back is the node's identity and enough to recover funds, not a resumable node.

**What a restore therefore does, automatically:**

1. The emergency-recovery file is copied aside before anything runs. Upstream's own plugin rewrites that file to describe the _current_ channel set, so the restored copy is the last record able to reconstruct the pre-backup channels, and the copy is never touched again.
2. `emergencyrecover` runs, and a permanently-failing health check appears saying what that means: **all channels will be force-closed**, funds swept on-chain, and the node should be drained and reinstalled afterwards rather than kept.
3. Ten thousand wallet addresses are pre-generated. A restored database restarts the address counter at zero, and the node only recognises addresses within a fixed window past the highest known-used index — so without this, a rescan silently misses outputs beyond the first gap. The window this widens applies to every later rescan too.
4. The [Rescan Blockchain](#tasks) task is raised, because until it runs the on-chain balance reads zero.

## Limitations and Differences

1. **A restore is a recovery, not a resumption.** Channels are force-closed by design; plan to sweep the funds and reinstall.
2. **The channel database is excluded from backups**, deliberately.
3. **CLNrest is served as plaintext by the node**, with TLS added at the edge for LAN and clearnet only.
4. **gRPC cannot be reached through a TLS-terminating path**, because the plugin authenticates clients with their own certificates.
5. **A custom external host is incompatible with Tor Only** and is dropped while both are set.
6. **The watchtower is not configurable.** Its ports, bind addresses, and subscription parameters are fixed.
7. **Plugins are those compiled into the image.** Adding another means changing the image, not dropping a file on the volume.
8. **No riscv64 build**, and on hardware without a native image the aarch64 build runs emulated.

---

## Quick Reference for AI Consumers

```yaml
package_id: c-lightning
image: ./Dockerfile # on elementsproject/lightningd; plus ghcr.io/elementsproject/cln-application
architectures:
  - x86_64
  - aarch64
subcontainers:
  - lightning-sub # lightningd, teosd, and every oneshot; the one to attach to
  - cln-application-sub # the web UI
volumes:
  main: /root/.lightning
file_models:
  - /root/.lightning/config
  - /root/.lightning/store.json
  - /root/.lightning/data/app/config.json
  - /root/.lightning/.teos/teos.toml
startos_managed_env_vars:
  - TOWERS_DATA_DIR # lightningd
  - BITCOIN_NETWORK # web UI
  - LIGHTNING_DATA_DIR # web UI
  - APP_PROTOCOL # web UI
  - APP_HOST # web UI
  - APP_PORT # web UI
  - APP_CONFIG_FILE # web UI
  - APP_LOG_FILE # web UI
  - LIGHTNING_VARS_FILE # web UI
  - LIGHTNING_WS_PORT # web UI
  - LIGHTNING_REST_PORT # web UI
  - LIGHTNING_REST_PROTOCOL # web UI
  - LIGHTNING_GRPC_PORT # web UI
dependencies:
  - bitcoind # required; mounted read-only at /mnt/bitcoin
interfaces:
  ui: { type: ui, port: 4500 }
  rpc: { type: api, port: 8080 }
  peer: { type: p2p, port: 9735 }
  grpc: { type: api, port: 2106 } # TLS passthrough, not terminated
  clnrest: { type: api, port: 3010 } # when enabled; URL carries the rune
  websocket: { type: api, port: 7272 } # when the Clams websocket is enabled
  watchtower: { type: api, port: 9814 } # when the watchtower server is enabled
actions:
  - config
  - plugins
  - experimental
  - watchtower
  - watchtower-info # hidden unless the server is enabled
  - watchtower-client-info # hidden unless clients are registered
  - createrune
  - revoke-runes
  - display-seed # hidden with no wallet; disabled on a pre-BIP-39 wallet
  - rescan-blockchain
  - reset-password
  - delete-gossip-store # only-stopped
  - node-info
tasks:
  - { action: rescan-blockchain, severity: important } # raised after a restore
health_checks:
  - lightningd # displayed "RPC Interface"
  - cln-application # displayed "Web Interface"
  - check-synced # displayed "Synced"
  - watchtower-server # when the watchtower server is enabled
  - custom-external-host # only while Tor Only conflicts with a custom host
  - restored # only after an emergency recovery
```
