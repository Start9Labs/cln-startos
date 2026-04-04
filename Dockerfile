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
ARG SLING_VERSION=v3.0.3
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

# Final stage - simplified
FROM elementsproject/lightningd:v25.12.1 AS final
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libev-dev libcurl4-gnutls-dev libsqlite3-dev libunwind-dev && \
    rm -rf /var/lib/apt/lists/*

COPY --from=clboss /usr/local/bin/clboss /usr/local/libexec/c-lightning/plugins/
COPY --from=builder-rust /root/.cargo/bin/teos* /usr/local/bin/
COPY --from=builder-rust /root/.cargo/bin/watchtower-client /usr/local/libexec/c-lightning/plugins/
COPY --from=sling /usr/local/bin/sling /usr/local/libexec/c-lightning/plugins/
