# clboss builder
FROM debian:bookworm-slim AS clboss

RUN apt-get update -qq && \
  apt-get install -qq -y --no-install-recommends \
  autoconf-archive \
  automake \
  build-essential \
  git \
  libcurl4-gnutls-dev \
  libev-dev \
  libsqlite3-dev \
  libtool \
  pkg-config \
  libunwind-dev

COPY clboss/. /tmp/clboss
WORKDIR /tmp/clboss
RUN autoreconf -i
RUN ./configure
RUN ./generate_commit_hash.sh
RUN make
RUN make install
RUN strip /usr/local/bin/clboss

# plugins builder
FROM debian:bookworm-slim AS builder-rust

ARG ARCH

ENV RUST_PROFILE=release
ENV PATH="/root/.cargo/bin:/root/.local/bin:$PATH"

RUN apt-get update -qq && \
  apt-get install -qq -y --no-install-recommends \
  autoconf \
  automake \
  build-essential \
  ca-certificates \
  curl \
  dirmngr \
  gettext \
  git \
  gnupg \
  jq \
  libpq-dev \
  libtool \
  libffi-dev \
  pkg-config \
  libssl-dev \
  protobuf-compiler \
  libev-dev \
  libevent-dev \
  qemu-user-static \
  wget \
  unzip \
  tclsh

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN rustup toolchain install stable --component rustfmt --allow-downgrade

# sling
ADD ./plugins/sling /tmp/rust-sling
WORKDIR /tmp/rust-sling
RUN cargo build --release

# build rust-teos
ENV PROTOBUF_VERSION=21.12
RUN curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOBUF_VERSION}/protobuf-all-${PROTOBUF_VERSION}.tar.gz && \
    tar -xzf protobuf-all-${PROTOBUF_VERSION}.tar.gz && \
    cp -r protobuf-${PROTOBUF_VERSION}/src/google /usr/local/include/ && \
    rm -rf protobuf*

ENV PROTOC=/usr/bin/protoc
ENV PROTOC_INCLUDE=/usr/local/include
ENV PATH=$PATH:/usr/bin
COPY ./rust-teos /tmp/rust-teos
WORKDIR /tmp/rust-teos
RUN cargo install --locked --path teos
RUN cargo install --locked --path watchtower-plugin

FROM elementsproject/lightningd AS final

# CLBOSS
COPY --from=clboss /usr/local/bin/clboss /usr/local/libexec/c-lightning/plugins/clboss

RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  pkg-config \
  libev-dev \
  libcurl4-gnutls-dev \
  libsqlite3-dev \
  libunwind-dev

# teos (server) & watchtower-client
COPY --from=builder-rust /root/.cargo/bin/teosd /usr/local/bin/teosd
COPY --from=builder-rust /root/.cargo/bin/teos-cli /usr/local/bin/teos-cli
COPY --from=builder-rust /root/.cargo/bin/watchtower-client /usr/local/libexec/c-lightning/plugins/watchtower-client

# sling
COPY --from=builder-rust /tmp/rust-sling/target/release/sling /usr/local/libexec/c-lightning/plugins/sling
