FROM node:22-bookworm AS ui

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev
    
WORKDIR /app

COPY ui/apps/backend ./apps/backend
COPY ui/apps/frontend ./apps/frontend
COPY ui/package.json ./
COPY ui/package-lock.json ./

RUN npm install
RUN npm run build
RUN npm prune --omit=dev

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
    make -j"$(getconf _NPROCESSORS_ONLN 2>/dev/null || getconf NPROCESSORS_ONLN 2>/dev/null || echo 1)" && \
    make install && \
    strip /usr/local/bin/clboss

# rust builder
FROM base AS builder-rust
ARG ARCH
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
    qemu-user-static unzip tclsh && \
    rm -rf /var/lib/apt/lists/* && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    rustup toolchain install stable --component rustfmt --allow-downgrade && \
    curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOBUF_VERSION}/protobuf-all-${PROTOBUF_VERSION}.tar.gz && \
    tar -xzf protobuf-all-${PROTOBUF_VERSION}.tar.gz && \
    cp -r protobuf-${PROTOBUF_VERSION}/src/google /usr/local/include/ && \
    rm -rf protobuf*

# Build both rust projects
COPY ./plugins/sling /tmp/sling
COPY ./rust-teos /tmp/rust-teos
WORKDIR /tmp/sling
RUN cargo build --release
WORKDIR /tmp/rust-teos
RUN cargo install --locked --path teos && \
    cargo install --locked --path watchtower-plugin
# Grab yq
ARG PLATFORM
RUN curl -sL -o /tmp/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_${PLATFORM} && chmod +x /tmp/yq

# Final stage
FROM elementsproject/lightningd:v25.09.3 AS final

ENV LIGHTNINGD_DATA=/root/.lightning
ENV LIGHTNINGD_RPC_PORT=9835
ENV LIGHTNINGD_PORT=9735
ENV LIGHTNINGD_NETWORK=bitcoin
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libev-dev libcurl4-gnutls-dev libsqlite3-dev libunwind-dev iproute2 procps curl nodejs npm && \
    rm -rf /var/lib/apt/lists/*

VOLUME [ "/root/.lightning" ]

COPY --from=ui /app/ /app/
COPY --from=builder-rust /tmp/yq /usr/local/bin/
COPY --from=clboss /usr/local/bin/clboss /usr/local/libexec/c-lightning/plugins/
COPY --from=builder-rust /root/.cargo/bin/teos* /usr/local/bin/
COPY --from=builder-rust /root/.cargo/bin/watchtower-client /usr/local/libexec/c-lightning/plugins/
COPY --from=builder-rust /tmp/sling/target/release/sling /usr/local/libexec/c-lightning/plugins/
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/sling

# other scripts
ADD ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
ADD ./check-rpc.sh /usr/local/bin/check-rpc.sh
ADD ./check-web-ui.sh /usr/local/bin/check-web-ui.sh
ADD ./check-synced.sh /usr/local/bin/check-synced.sh
ADD ./actions/*.sh /usr/local/bin/
RUN chmod a+x /usr/local/bin/*.sh

WORKDIR /app
