# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `c-lightning`** (the manifest id in `startos/manifest/index.ts` — not `cln`, which is only the repo shorthand); dependents and `effects` calls must reference `c-lightning`. Host ids `peer` and `watchtower` (with interface ids `peer` and `watchtower`) are exported from `startos/interfaces.ts` — sibling lightning packages import them, so treat them as a small API: renaming one means updating the dependents in the same change.
- **bitcoind is reached over the LXC bridge**, resolved by `bitcoindRpcBridge` in `startos/utils.ts` (the doctrine-v3 `bridgeAddress` helper) from bitcoin-core's exported `rpcHostId`/`rpcPort` (imported from `bitcoin-core-startos/startos/utils`). The config file model deliberately types `bitcoin-rpcconnect`/`bitcoin-rpcport` loosely (`z.string()`/`z.number()` with legacy catches) because the address is dynamic.
- **Daemons requires-ordering gotcha:** `watchtower-server` (teosd) is added conditionally — unconditional entries must never `require` it (client-side oneshots require `watchtower-client` instead). SDK 2.0's `Daemons.build()` enforces this at runtime, not compile time.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach c-lightning -n lightning-sub -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — here `lightning-sub` for lightningd, `cln-application-sub` for the UI) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
