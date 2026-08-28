# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **Package id is `c-lightning`, not `cln`.** Dependents, `effects` calls, and `start-cli` all take `c-lightning`; several sibling packages import from `cln-startos/startos/utils` for its ports.
- **Nothing loads a CLN plugin from the volume at runtime.** The `Dockerfile` compiles `clboss/` and `rust-teos/` into the image and installs `sling` from an upstream release binary, so changing any of the three means rebuilding the image.
- **`rescan` and `restore` in `store.json` must not be cleared where they are read.** A session where `lightningd` never starts must not consume the request — that is how a rescan asked for during a crash loop used to disappear. The `consume-flags` oneshot clears them only once the node answers RPC, and `main`'s store watch treats a clear-to-`undefined` as equal so that write does not restart the service. Keep both halves if you add another one-shot flag.
- **`TOWERS_DATA_DIR` is set for a reason.** watchtower-client defaults its database to `$HOME/.watchtower`, which is not on the persistent volume, and the failure is silent: the client re-keys and forgets every registered tower on each container rebuild.
- **`clnrest-protocol` is forced to `http` deliberately** — upstream defaults it to https. Tor already encrypts and its clients cannot validate a StartOS certificate; LAN and clearnet get TLS from the edge listener instead.
- **`abandontowers` requires `watchtower-client`, never the conditional `watchtower-server`.** Requiring a daemon that may be absent breaks the chain when the server is disabled, since `Daemons.build` enforces requires-ordering.
- **Watch a credential file that gates an interface export with a null-tolerant `eq`.** Revoke Runes deletes `.commando-env` before the replacement rune is minted; reacting to that gap de-exports CLNrest, and anything watching that interface — `nutshell` reads its `addressInfo.suffix` for the rune — sees it vanish and restarts.
- **Check the `rust-teos` and `clboss` gitlinks before every commit.** A tree-wide `git add -A`/`git commit -a` made while a submodule working directory sits on an older commit rewrites its pin as one silent line, and the image compiles both from the pin. The `26.6.6:14` branch lost the TEOS pin twice this way while its release notes still advertised the bump — `git diff --cached rust-teos clboss` is the check.
