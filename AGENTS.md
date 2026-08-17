# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `c-lightning`, not `cln`.** Dependents, `effects` calls, and `start-cli` all take `c-lightning`; several sibling packages import from `cln-startos/startos/utils` for its ports.
- **Nothing loads a CLN plugin from the volume at runtime.** `plugins/`, `clboss/` and `rust-teos/` are compiled into the image by the `Dockerfile`, so a plugin change is an image rebuild.
- **`rescan` and `restore` in `store.json` must not be cleared where they are read.** A session where `lightningd` never starts must not consume the request — that is how a rescan asked for during a crash loop used to disappear. The `consume-flags` oneshot clears them only once the node answers RPC, and `main`'s store watch treats a clear-to-`undefined` as equal so that write does not restart the service. Keep both halves if you add another one-shot flag.
- **`TOWERS_DATA_DIR` is set for a reason.** watchtower-client defaults its database to `$HOME/.watchtower`, which is not on the persistent volume, and the failure is silent: the client re-keys and forgets every registered tower on each container rebuild.
- **`clnrest-protocol` is forced to `http` deliberately** — upstream defaults it to https. Tor already encrypts and its clients cannot validate a StartOS certificate; LAN and clearnet get TLS from the edge listener instead.
- **`abandontowers` requires `watchtower-client`, never the conditional `watchtower-server`.** Requiring a daemon that may be absent breaks the chain when the server is disabled, since `Daemons.build` enforces requires-ordering.
