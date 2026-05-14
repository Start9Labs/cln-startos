# Contributing

This repo packages [Core Lightning](https://github.com/ElementsProject/lightning) for StartOS.

## Documentation — keep it in sync

- **`README.md`** — what this package is and how it's built (image, volumes, interfaces). For developers and AI assistants.
- **`instructions.md`** — the user-facing instructions packed into the `.s9pk` and shown on the **Instructions** tab in StartOS, for the person running the service.
- **`CONTRIBUTING.md`** — this file.
- **`CLAUDE.md`** — operating rules for AI developers working in this repo.

**Any code change that warrants it must update `README.md` and `instructions.md` in the same change** — a new or renamed action, an added or removed volume / port / interface / dependency, a changed default, a new limitation, any altered user-visible behavior. Don't defer: a package that ships with a stale README or stale instructions is not done, even if the code is perfect. Content rules live in the packaging guide: [Writing READMEs](https://docs.start9.com/packaging/writing-readmes.html) and [Writing Service Instructions](https://docs.start9.com/packaging/writing-instructions.html).

## Building

See the [StartOS Packaging Guide](https://docs.start9.com/packaging/) for environment setup, then:

```bash
npm ci    # install dependencies
make      # build the universal .s9pk
```

## Updating the upstream version

Core Lightning is built from a custom `Dockerfile` (the `lightning` image) layered on top of the official `elementsproject/lightningd` image, plus a sidecar `ui` image pulled by tag. Several upstream components feed into the build, and a bump usually touches more than one.

### lightningd

1. Update the `FROM elementsproject/lightningd:v<version>` tag in `Dockerfile`.
2. Bump `version` in the file under `startos/versions/`, renaming it to the new version string. A new version file is only needed when the bump carries an `up`/`down` migration, or when you want the old release notes preserved in git history — see [Versions](https://docs.start9.com/packaging/versions.html).
3. Update `releaseNotes` to summarize what changed for the user.

### CLN Application (Web UI)

Bump the `dockerTag` for the `ui` image in `startos/manifest/index.ts` to `ghcr.io/elementsproject/cln-application:<new version>`.

### Bundled plugins

- **CLBOSS** lives at the `clboss/` git submodule. To bump it: `cd clboss && git fetch && git checkout <ref> && cd .. && git add clboss`.
- **TEOS** (watchtower server + client plugin) lives at the `rust-teos/` git submodule. Bump the same way.
- The miscellaneous **`plugins/`** submodule pins the set of upstream plugin sources used elsewhere in the build; bump it the same way when one of those plugins needs an update.
- **Sling** is downloaded as a prebuilt binary inside the Dockerfile. Update the `SLING_VERSION` ARG in `Dockerfile` to bump it.

### After bumping

1. Rebuild (`make`), sideload the `.s9pk`, and confirm it starts.
2. Review `README.md` and `instructions.md` for anything the bump changed.

## How to contribute

1. Fork the repository and create a branch from `master`.
2. Make your changes — including the doc updates above.
3. Open a pull request to `master`.
