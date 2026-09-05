# Shared base with common dependencies
FROM debian:bookworm-slim AS base
RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
    build-essential \
    git \
    pkg-config \
    curl && \
    rm -rf /var/lib/apt/lists/*

# clboss builder
FROM base AS clboss
RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
    autoconf-archive \
    automake \
    libcurl4-gnutls-dev \
    libev-dev \
    libsqlite3-dev \
    libtool \
    libunwind-dev && \
    rm -rf /var/lib/apt/lists/*

COPY clboss/. /tmp/clboss
WORKDIR /tmp/clboss
RUN autoreconf -i && \
    ./configure && \
    ./generate_commit_hash.sh && \
    make -j$(nproc) && \
    make install && \
    strip /usr/local/bin/clboss

# sling - download prebuilt binary
FROM base AS sling
ARG TARGETARCH
ARG SLING_VERSION=v4.3.1
RUN apt-get update -qq && apt-get install -qq -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/* && \
    if [ "$TARGETARCH" = "amd64" ]; then SLING_ARCH=x86_64; else SLING_ARCH=aarch64; fi && \
    curl -fSL "https://github.com/daywalker90/sling/releases/download/${SLING_VERSION}/sling-${SLING_VERSION}-${SLING_ARCH}-linux-gnu.tar.gz" \
    | tar xz -C /usr/local/bin/

# rust-teos builder
FROM base AS builder-rust
ENV RUST_PROFILE=release \
    PATH="/root/.cargo/bin:/root/.local/bin:$PATH" \
    PROTOBUF_VERSION=21.12 \
    PROTOC=/usr/bin/protoc \
    PROTOC_INCLUDE=/usr/local/include

RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
    autoconf automake ca-certificates dirmngr gettext \
    gnupg jq libpq-dev libtool libffi-dev libssl-dev \
    protobuf-compiler libev-dev libevent-dev \
    qemu-user-static wget unzip tclsh && \
    rm -rf /var/lib/apt/lists/* && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    rustup toolchain install stable --component rustfmt --allow-downgrade && \
    curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOBUF_VERSION}/protobuf-all-${PROTOBUF_VERSION}.tar.gz && \
    tar -xzf protobuf-all-${PROTOBUF_VERSION}.tar.gz && \
    cp -r protobuf-${PROTOBUF_VERSION}/src/google /usr/local/include/ && \
    rm -rf protobuf*

COPY ./rust-teos /tmp/rust-teos
WORKDIR /tmp/rust-teos
RUN cargo install --locked --path teos && \
    cargo install --locked --path watchtower-plugin

# lightningd, from the signed release tarballs rather than the published image.
#
# The v26.06.7 images upstream published were built by CI from the wrong tree and
# do not contain the release's security fixes, though they report v26.06.7 on
# startup. The tarballs are the release. These hashes come from
# SHA256SUMS-v26.06.7, GPG-verified against maintainer key
# 4E4A142F8BD3C38A56B362ED578CAC08472545C5.
FROM base AS lightningd-dist
ARG TARGETARCH
ARG CLN_VERSION=v26.06.7
ARG CLN_SHA256_AMD64=53ddf124fe7058b6a2fc059d104976cc54ba5be21dc55b295cd82d01cabeb39c
ARG CLN_SHA256_ARM64=a6e89d49468dac83122d6b795796b7f2ebb55eab6181b419f1cf9a73aeae3965
RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends ca-certificates xz-utils && \
    rm -rf /var/lib/apt/lists/*
# Ubuntu 22.04 build: its glibc 2.35 runs on bookworm's 2.36, so the runtime
# stays the distro every other binary here is compiled against.
RUN set -eu; \
    case "$TARGETARCH" in \
      amd64) SHA="$CLN_SHA256_AMD64" ;; \
      arm64) SHA="$CLN_SHA256_ARM64" ;; \
      *) echo "unsupported TARGETARCH: $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    TARBALL="clightning-${CLN_VERSION}-Ubuntu-22.04-${TARGETARCH}.tar.xz"; \
    curl -fsSLO "https://github.com/ElementsProject/lightning/releases/download/${CLN_VERSION}/${TARBALL}"; \
    echo "${SHA}  ${TARBALL}" | sha256sum -c -; \
    mkdir -p /dist/usr/local; \
    tar -xf "$TARBALL" -C /dist/usr/local --strip-components=2

# bitcoin-cli, which CLN's own plugin-bcli and our check-synced health check
# both exec. The upstream lightningd image bundled it (v27.1.0); a slim base
# does not, and a missing one kills lightningd at startup with
# "The Bitcoin backend died". Checksums are from bitcoincore.org's SHA256SUMS.
FROM base AS bitcoin-cli
ARG TARGETARCH
ARG BITCOIN_VERSION=31.1
ARG BITCOIN_SHA256_AMD64=b80d9c3e04da78fb6f0569685673418cf686fadba9042d926d13fb87ff503f9e
ARG BITCOIN_SHA256_ARM64=dcf1873f2208ba4f962f3398d47e154c39c0084be8f4553e05c940d0ace3d004
RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*
RUN set -eu; \
    case "$TARGETARCH" in \
      amd64) SHA="$BITCOIN_SHA256_AMD64"; ARCH=x86_64 ;; \
      arm64) SHA="$BITCOIN_SHA256_ARM64"; ARCH=aarch64 ;; \
      *) echo "unsupported TARGETARCH: $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    TARBALL="bitcoin-${BITCOIN_VERSION}-${ARCH}-linux-gnu.tar.gz"; \
    curl -fsSLO "https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/${TARBALL}"; \
    echo "${SHA}  ${TARBALL}" | sha256sum -c -; \
    tar -xf "$TARBALL" "bitcoin-${BITCOIN_VERSION}/bin/bitcoin-cli"; \
    install -m 755 "bitcoin-${BITCOIN_VERSION}/bin/bitcoin-cli" /usr/bin/bitcoin-cli

# Final stage - simplified
#
# `ca-certificates` is load-bearing: the slim base carries no CA store, and none
# of the -dev packages below pull one in. Without it watchtower-client cannot
# build an HTTPS client, so no tower ever registers (see README.md).
#
# `libpq5` and `libsodium23` are lightningd's own runtime deps, previously
# supplied by the upstream image.
FROM debian:bookworm-slim AS final
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates libev-dev libcurl4-gnutls-dev libsqlite3-dev libunwind-dev \
    libpq5 libsodium23 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=bitcoin-cli /usr/bin/bitcoin-cli /usr/bin/bitcoin-cli
COPY --from=lightningd-dist /dist/usr/local /usr/local
COPY --from=clboss /usr/local/bin/clboss /usr/local/libexec/c-lightning/plugins/
COPY --from=builder-rust /root/.cargo/bin/teos* /usr/local/bin/
COPY --from=builder-rust /root/.cargo/bin/watchtower-client /usr/local/libexec/c-lightning/plugins/
COPY --from=sling /usr/local/bin/sling /usr/local/libexec/c-lightning/plugins/
