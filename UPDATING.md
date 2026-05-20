# Updating the upstream version

Core Lightning is built from a custom `Dockerfile` (the `lightning` image) layered on top of the official `elementsproject/lightningd` image, plus a sidecar `ui` image pulled by tag. Several upstream components feed into the build, and a bump usually touches more than one.

## Determining the upstream version

For each independent upstream source below: a link to its canonical repo, one command to fetch the latest available version, and where the current pin lives in this repo.

### lightningd

- Upstream: [ElementsProject/lightning](https://github.com/ElementsProject/lightning) (published as the [`elementsproject/lightningd`](https://hub.docker.com/r/elementsproject/lightningd) Docker image).
- Latest release tag (source of truth for the image tag):
  ```sh
  gh release view -R ElementsProject/lightning --json tagName -q .tagName
  ```
- Cross-check that the matching Docker tag has been published:
  ```sh
  curl -fsSL "https://hub.docker.com/v2/repositories/elementsproject/lightningd/tags?page_size=20&ordering=last_updated" | jq -r '.results[].name'
  ```
- Current pin: `FROM elementsproject/lightningd:v<version>` in `Dockerfile`.

### CLN Application (Web UI)

- Upstream: [ElementsProject/cln-application](https://github.com/ElementsProject/cln-application) (published as the `ghcr.io/elementsproject/cln-application` image).
- Latest release tag:
  ```sh
  gh release view -R ElementsProject/cln-application --json tagName -q .tagName
  ```
- Cross-check published GHCR tags:
  ```sh
  gh api /users/elementsproject/packages/container/cln-application/versions \
    --jq '.[].metadata.container.tags[]' | sort -u | head -20
  ```
- Current pin: `images.ui.source.dockerTag` in `startos/manifest/index.ts` (`ghcr.io/elementsproject/cln-application:<version>`).

### CLBOSS

- Upstream: [ZmnSCPxj/clboss](https://github.com/ZmnSCPxj/clboss).
- Latest release tag:
  ```sh
  gh release view -R ZmnSCPxj/clboss --json tagName -q .tagName
  ```
- If no GitHub release is published for the bump, fall back to tags:
  ```sh
  gh api repos/ZmnSCPxj/clboss/tags --jq '.[0].name'
  ```
- Current pin: commit checked out in the `clboss/` git submodule. Inspect with `git -C clboss describe --tags --always`.

### TEOS (watchtower)

- Upstream: [talaia-labs/rust-teos](https://github.com/talaia-labs/rust-teos).
- Latest release tag:
  ```sh
  gh release view -R talaia-labs/rust-teos --json tagName -q .tagName
  ```
- Fallback to tags if no release is cut:
  ```sh
  gh api repos/talaia-labs/rust-teos/tags --jq '.[0].name'
  ```
- Current pin: commit checked out in the `rust-teos/` git submodule. Inspect with `git -C rust-teos describe --tags --always`.

### Plugins meta-submodule

- Upstream: [lightningd/plugins](https://github.com/lightningd/plugins). This repo has no release/tag concept — it tracks `master`.
- Latest upstream `master` commit:
  ```sh
  git -C plugins ls-remote origin HEAD
  ```
- Current pin: commit checked out in the `plugins/` git submodule. Inspect with `git -C plugins rev-parse HEAD`.

### Sling

- Upstream: [daywalker90/sling](https://github.com/daywalker90/sling) (consumed as a prebuilt release binary).
- Latest release tag:
  ```sh
  gh release view -R daywalker90/sling --json tagName -q .tagName
  ```
- Current pin: `ARG SLING_VERSION=v<version>` in the `sling` stage of `Dockerfile`.

## Applying the bump

### lightningd

- Update the `FROM elementsproject/lightningd:v<version>` tag in `Dockerfile`.

### CLN Application (Web UI)

- Bump the `dockerTag` for the `ui` image in `startos/manifest/index.ts` to `ghcr.io/elementsproject/cln-application:<new version>`.

### CLBOSS

- `cd clboss && git fetch --tags && git checkout <new ref> && cd .. && git add clboss`.

### TEOS

- `cd rust-teos && git fetch --tags && git checkout <new ref> && cd .. && git add rust-teos`.

### Plugins

- `cd plugins && git fetch && git checkout <new ref> && cd .. && git add plugins`. Use the upstream `master` HEAD commit unless you have a specific reason to pin elsewhere.

### Sling

- Update the `SLING_VERSION` ARG in `Dockerfile` to the new release tag (including the leading `v`).
