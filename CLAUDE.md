## How the upstream version is pulled
- Image `lightning` is `dockerBuild` from root
- Has submodules: `plugins/`, `clboss/`, `rust-teos/` — may need updating with upstream
- Sidecar `ui` image: dockerTag `ghcr.io/elementsproject/cln-application:<version>`
