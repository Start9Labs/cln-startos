# Carried patches

Deltas applied to the `rust-teos` submodule at build time, in filename order, by the
`patch -p1 --forward --fuzz=0` step in the [Dockerfile](../Dockerfile). A patch whose context a
submodule bump changed, or that the new pin already contains, fails the build. Retire it then;
never loosen the flags.

## 0001 — don't panic on duplicate appointment receipts

**Retire when:** the `rust-teos` pin contains
[talaia-labs/rust-teos#283](https://github.com/talaia-labs/rust-teos/pull/283) (issue
[#282](https://github.com/talaia-labs/rust-teos/issues/282)), or an equivalent fix. Delete this
file's section and the patch together.

A tower can return a second receipt for an appointment it already accepted. `watchtower-client`
then fails its plain `INSERT` on the `(locator, tower_id)` key and unwraps the error while holding
the client mutex, which poisons it, so the plugin stops sending appointments until `lightningd`
restarts. The patch upserts the receipt in place and logs instead of panicking.
