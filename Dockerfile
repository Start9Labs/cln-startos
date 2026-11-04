ARG CLN_VERSION=v26.06.10

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

# Rust toolchain, shared by rust-teos and the lightningd source build
FROM base AS rust-base
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
    curl -fsSLO --retry 3 https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOBUF_VERSION}/protobuf-all-${PROTOBUF_VERSION}.tar.gz && \
    tar -xzf protobuf-all-${PROTOBUF_VERSION}.tar.gz && \
    cp -r protobuf-${PROTOBUF_VERSION}/src/google /usr/local/include/ && \
    rm -rf protobuf*

# rust-teos builder
FROM rust-base AS builder-rust
COPY ./rust-teos /tmp/rust-teos
WORKDIR /tmp/rust-teos
RUN cargo install --locked --path teos && \
    cargo install --locked --path watchtower-plugin

# lightningd from the signed release tarballs. These hashes come from
# SHA256SUMS-v26.06.10 and -arm64, GPG-verified against maintainer key
# 4E4A142F8BD3C38A56B362ED578CAC08472545C5.
FROM base AS lightningd-tarball
ARG TARGETARCH
ARG CLN_VERSION
ARG CLN_SHA256_AMD64=e1e0a7e89b55060e2470d8568ba535a3124d6823c628def548cadeef4279c491
ARG CLN_SHA256_ARM64=3b45ff376a50d111fe3dfa84d46823ae2109721be4a7fa4e174b5d603117f557
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

# lightningd built from the release's source zip, for an arch upstream
# published no tarball for. The hash is from the same signed SHA256SUMS.
FROM rust-base AS lightningd-source
ARG CLN_VERSION
ARG CLN_SRC_SHA256=4914561e6d108dacca0183d7e6b3b1c224c580597ddcbb397299ef5b0fcc3230
RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
    libsodium-dev libsqlite3-dev zlib1g-dev python3-mako lowdown unzip && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /tmp
RUN set -eu; \
    ZIP="clightning-${CLN_VERSION}.zip"; \
    curl -fsSLO --retry 3 "https://github.com/ElementsProject/lightning/releases/download/${CLN_VERSION}/${ZIP}"; \
    echo "${CLN_SRC_SHA256}  ${ZIP}" | sha256sum -c -; \
    unzip -q "$ZIP"; \
    cd "clightning-${CLN_VERSION}"; \
    ./configure --prefix=/usr/local --disable-valgrind; \
    make -j"$(nproc)" install-program DESTDIR=/dist RUST_PROFILE=release VERSION="${CLN_VERSION}"

FROM lightningd-tarball AS lightningd-dist-amd64
FROM lightningd-tarball AS lightningd-dist-arm64
FROM lightningd-dist-${TARGETARCH} AS lightningd-dist

# bitcoin-cli, which CLN's own plugin-bcli and our check-synced health check
# both exec; without it lightningd dies at startup with "The Bitcoin backend
# died". Checksums are from bitcoincore.org's SHA256SUMS.
FROM base AS bitcoin-cli
ARG TARGETARCH
ARG BITCOIN_VERSION=32.1
ARG BITCOIN_SHA256_AMD64=61545c17c3120fb7412f896d248b11993af04ec8817aad3649c55b2afb044963
ARG BITCOIN_SHA256_ARM64=7ed37c7373eb6aa3e3f72842596a1afeba1b223717033cade9842b25773e1922
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
# `libpq5` and `libsodium23` are lightningd's own runtime deps.
FROM debian:bookworm-slim AS final
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates libev-dev libcurl4-gnutls-dev libsqlite3-dev libunwind-dev \
    libpq5 libsodium23 wireguard-tools iptables iproute2 procps && \
    rm -rf /var/lib/apt/lists/*

COPY --from=bitcoin-cli /usr/bin/bitcoin-cli /usr/bin/bitcoin-cli
COPY --from=lightningd-dist /dist/usr/local /usr/local
COPY --from=clboss /usr/local/bin/clboss /usr/local/libexec/c-lightning/plugins/
COPY --from=builder-rust /root/.cargo/bin/teos* /usr/local/bin/
COPY --from=builder-rust /root/.cargo/bin/watchtower-client /usr/local/libexec/c-lightning/plugins/
COPY --from=sling /usr/local/bin/sling /usr/local/libexec/c-lightning/plugins/
