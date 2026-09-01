# Updating the upstream version

Core Lightning is built from a custom `Dockerfile` (the `lightning` image) that unpacks upstream's signed release tarball onto a `debian:bookworm-slim` base, plus a sidecar `ui` image pulled by tag. Several upstream components feed into the build, and a bump usually touches more than one.

## Determining the upstream version

For each independent upstream source below: a link to its canonical repo, one command to fetch the latest available version, and where the current pin lives in this repo.

### lightningd

- Upstream: [ElementsProject/lightning](https://github.com/ElementsProject/lightning).
- **Take lightningd from the release tarballs, not the `elementsproject/lightningd` Docker image.** For v26.06.7 upstream published images built from the wrong tree that omitted the release's security fixes while still reporting the new version on startup. The tarballs are signed; the images are not.
- Latest release tag:
  ```sh
  gh release view -R ElementsProject/lightning --json tagName -q .tagName
  ```
- Get the checksums and verify the manifest signature before trusting either:
  ```sh
  gh release download <tag> -R ElementsProject/lightning -p 'SHA256SUMS-*'
  gpg --verify SHA256SUMS-<tag>.asc SHA256SUMS-<tag>
  ```
  Maintainer fingerprints are listed on the release page.
- Current pin: `CLN_VERSION` plus the per-arch `CLN_SHA256_*` args in the `lightningd-dist` stage of `Dockerfile`.

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
- The newest release, `v0.2.0`, is from 2023 and the pin sits well past it on `master`, so move the pin along `master` and check any candidate is a descendant of the current one:
  ```sh
  git -C rust-teos ls-remote origin HEAD
  git -C rust-teos merge-base --is-ancestor HEAD <candidate> && echo "safe to advance"
  ```
- Current pin: commit checked out in the `rust-teos/` git submodule. Inspect with `git -C rust-teos describe --tags --always` — the `-N-g<sha>` suffix is how far ahead of the last release it is.

### Sling

- Upstream: [daywalker90/sling](https://github.com/daywalker90/sling) (consumed as a prebuilt release binary).
- Latest release tag:
  ```sh
  gh release view -R daywalker90/sling --json tagName -q .tagName
  ```
- Current pin: `ARG SLING_VERSION=v<version>` in the `sling` stage of `Dockerfile`.

## Applying the bump

### lightningd

- Update `CLN_VERSION` and both `CLN_SHA256_*` args in the `lightningd-dist` stage of `Dockerfile`, taking the hashes from the GPG-verified `SHA256SUMS` for the `Ubuntu-22.04` tarballs. That build's glibc runs on the bookworm final stage, which is what every other binary in the image is compiled against — check that still holds if you move to a different tarball.

### CLN Application (Web UI)

- Bump the `dockerTag` for the `ui` image in `startos/manifest/index.ts` to `ghcr.io/elementsproject/cln-application:<new version>`.

### CLBOSS

- `cd clboss && git fetch --tags && git checkout <new ref> && cd .. && git add clboss`.

### TEOS

- `cd rust-teos && git fetch --tags && git checkout <new ref> && cd .. && git add rust-teos`.

### Sling

- Update the `SLING_VERSION` ARG in `Dockerfile` to the new release tag (including the leading `v`).
