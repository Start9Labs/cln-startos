# This Dockerfile is used by buildx to build ARM64, AMD64, and ARM32 Docker images from an AMD64 host.
# To speed up the build process, we are cross-compiling rather than relying on QEMU.
# There are four main stages:
# * downloader: Downloads specific binaries needed for core lightning for each architecture.
# * builder: Cross-compiles for each architecture.
# * builder-python: Builds Python dependencies for wss-proxy with QEMU.
# * final: Creates the runtime image.


ARG DEFAULT_TARGETPLATFORM="linux/amd64"
ARG BASE_DISTRO="debian:bookworm-slim"

# ui builder
FROM node:18-bullseye AS ui

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

FROM --platform=$BUILDPLATFORM ${BASE_DISTRO} AS base-downloader
RUN set -ex \
	&& apt-get update \
	&& apt-get install -qq --no-install-recommends ca-certificates dirmngr wget qemu-user-static binfmt-support

FROM base-downloader AS base-downloader-linux-amd64
ENV TARBALL_ARCH_FINAL=x86_64-linux-gnu

FROM base-downloader AS base-downloader-linux-arm64
ENV TARBALL_ARCH_FINAL=aarch64-linux-gnu

FROM base-downloader AS base-downloader-linux-arm
ENV TARBALL_ARCH_FINAL=arm-linux-gnueabihf

FROM base-downloader-${TARGETOS}-${TARGETARCH} AS downloader

RUN set -ex \
	&& apt-get update \
	&& apt-get install -qq --no-install-recommends ca-certificates dirmngr wget

WORKDIR /opt


ENV BITCOIN_VERSION=27.1
ENV BITCOIN_TARBALL bitcoin-${BITCOIN_VERSION}-${TARBALL_ARCH_FINAL}.tar.gz
ENV BITCOIN_URL https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/$BITCOIN_TARBALL
ENV BITCOIN_ASC_URL https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/SHA256SUMS

RUN mkdir /opt/bitcoin && cd /opt/bitcoin \
    && wget -qO $BITCOIN_TARBALL "$BITCOIN_URL" \
    && wget -qO bitcoin "$BITCOIN_ASC_URL" \
    && grep $BITCOIN_TARBALL bitcoin | tee SHA256SUMS \
    && sha256sum -c SHA256SUMS \
    && BD=bitcoin-$BITCOIN_VERSION/bin \
    && tar -xzvf $BITCOIN_TARBALL $BD/ --strip-components=1 \
    && rm $BITCOIN_TARBALL

FROM --platform=${DEFAULT_TARGETPLATFORM} ${BASE_DISTRO} AS base-builder
RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
        autoconf \
        automake \
        bison \
        build-essential \
        ca-certificates \
        curl \
        dirmngr \
        flex \
        gettext \
        git \
        gnupg \
        jq \
        libicu-dev \
        libtool \
        libffi-dev \
        pkg-config \
        libssl-dev \
        protobuf-compiler \
        python3 \
        python3-dev \
        python3-mako \
        python3-pip \
        python3-venv \
        python3-setuptools \
        libev-dev \
        libevent-dev \
        qemu-user-static \
        wget \
        unzip \
        tclsh

ENV PATH="/root/.local/bin:$PATH" \
    PYTHON_VERSION=3
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    poetry self add poetry-plugin-export
RUN mkdir -p /root/.venvs && \
    python3 -m venv /root/.venvs/cln && \
    . /root/.venvs/cln/bin/activate && \
    pip3 install --upgrade pip setuptools wheel

RUN wget -q https://zlib.net/fossils/zlib-1.2.13.tar.gz -O zlib.tar.gz && \
    wget -q https://www.sqlite.org/2019/sqlite-src-3290000.zip -O sqlite.zip && \
    wget -q https://ftp.postgresql.org/pub/source/v17.1/postgresql-17.1.tar.gz -O postgres.tar.gz

WORKDIR /opt/lightningd
COPY lightning/. /tmp/lightning-wrapper/lightning
COPY ./.git/modules/lightning /tmp/lightning-wrapper/lightning/.git/

RUN git clone --recursive /tmp/lightning-wrapper/lightning . && \
    git checkout $(git --work-tree=/tmp/lightning-wrapper/lightning --git-dir=/tmp/lightning-wrapper/lightning/.git rev-parse HEAD)

# Do not build python plugins (wss-proxy) here, python doesn't support cross compilation.
RUN sed -i '/^wss-proxy/d' pyproject.toml && \
    poetry lock && \
    poetry export -o requirements.txt --without-hashes
RUN mkdir -p /root/.venvs && \
    python3 -m venv /root/.venvs/cln && \
    . /root/.venvs/cln/bin/activate && \
    pip3 install -r requirements.txt && \
    pip3 cache purge
WORKDIR /

FROM base-builder AS base-builder-linux-amd64

ENV POSTGRES_CONFIG="--without-readline" \
    PG_CONFIG=/usr/local/pgsql/bin/pg_config

FROM base-builder AS base-builder-linux-arm64
ENV target_host=aarch64-linux-gnu \
    target_host_rust=aarch64-unknown-linux-gnu \
    target_host_qemu=qemu-aarch64-static

RUN apt-get install -qq -y --no-install-recommends \
        libc6-arm64-cross \
        gcc-${target_host} \
        g++-${target_host}

ENV AR=${target_host}-ar \
    AS=${target_host}-as \
    CC=${target_host}-gcc \
    CXX=${target_host}-g++ \
    LD=${target_host}-ld \
    STRIP=${target_host}-strip \
    QEMU_LD_PREFIX=/usr/${target_host} \
    HOST=${target_host} \
    TARGET=${target_host_rust} \
    RUSTUP_INSTALL_OPTS="--target ${target_host_rust} --default-host ${target_host_rust}" \
    PKG_CONFIG_PATH="/usr/${target_host}/lib/pkgconfig"

ENV ZLIB_CONFIG="--prefix=${QEMU_LD_PREFIX}" \
    SQLITE_CONFIG="--host=${target_host} --prefix=${QEMU_LD_PREFIX}" \
    POSTGRES_CONFIG="--without-readline --prefix=${QEMU_LD_PREFIX}" \
    PG_CONFIG="${QEMU_LD_PREFIX}/bin/pg_config"

FROM base-builder AS base-builder-linux-arm

ENV target_host=arm-linux-gnueabihf \
    target_host_rust=armv7-unknown-linux-gnueabihf \
    target_host_qemu=qemu-arm-static

RUN apt-get install -qq -y --no-install-recommends \
        libc6-armhf-cross \
        gcc-${target_host} \
        g++-${target_host}

ENV AR=${target_host}-ar \
    AS=${target_host}-as \
    CC=${target_host}-gcc \
    CXX=${target_host}-g++ \
    LD=${target_host}-ld \
    STRIP=${target_host}-strip \
    QEMU_LD_PREFIX=/usr/${target_host} \
    HOST=${target_host} \
    TARGET=${target_host_rust} \
    RUSTUP_INSTALL_OPTS="--target ${target_host_rust} --default-host ${target_host_rust}" \
    PKG_CONFIG_PATH="/usr/${target_host}/lib/pkgconfig"

ENV ZLIB_CONFIG="--prefix=${QEMU_LD_PREFIX}" \
    SQLITE_CONFIG="--host=${target_host} --prefix=${QEMU_LD_PREFIX}" \
    POSTGRES_CONFIG="--without-readline --prefix=${QEMU_LD_PREFIX}" \
    PG_CONFIG="${QEMU_LD_PREFIX}/bin/pg_config"

FROM base-builder-${TARGETOS}-${TARGETARCH} AS builder

ENV LIGHTNINGD_VERSION=master

RUN mkdir zlib && tar xvf zlib.tar.gz -C zlib --strip-components=1 \
    && cd zlib \
    && ./configure ${ZLIB_CONFIG} \
    && make \
    && make install && cd .. && \
    rm zlib.tar.gz && \
    rm -rf zlib

RUN unzip sqlite.zip \
    && cd sqlite-* \
    && ./configure --enable-static --disable-readline --disable-threadsafe --disable-load-extension ${SQLITE_CONFIG} \
    && make \
    && make install && cd .. && rm sqlite.zip && rm -rf sqlite-*

RUN mkdir postgres && tar xvf postgres.tar.gz -C postgres --strip-components=1 \
    && cd postgres \
    && ./configure ${POSTGRES_CONFIG} \
    && cd src/include \
    && make install \
    && cd ../interfaces/libpq \
    && make install \
    && cd ../../bin/pg_config \
    && make install \
    && cd ../../../../ && \
    rm postgres.tar.gz && \
    rm -rf postgres && \
    ldconfig "$(${PG_CONFIG} --libdir)"

# Save libpq to a specific location to copy it into the final image.
RUN mkdir /var/libpq && cp -a "$(${PG_CONFIG} --libdir)"/libpq.* /var/libpq

ENV RUST_PROFILE=release \
    PATH="/root/.cargo/bin:/root/.local/bin:$PATH"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y ${RUSTUP_INSTALL_OPTS}
RUN rustup toolchain install stable --component rustfmt --allow-downgrade
RUN rustup toolchain install beta

# sling
ADD ./plugins/sling /tmp/rust-sling
WORKDIR /tmp/rust-sling
RUN cargo build --release

# build rust-teos
COPY ./rust-teos /tmp/rust-teos
WORKDIR /tmp/rust-teos
RUN cargo install --locked --path teos
RUN cargo install --locked --path watchtower-plugin

COPY --from=downloader /usr/bin/${target_host_qemu} /usr/bin/${target_host_qemu}
WORKDIR /opt/lightningd

# If cross-compiling, need to tell it to cargo.
RUN ( ! [ -n "${target_host}" ] ) || \
    (mkdir -p .cargo && echo "[target.${target_host_rust}]\nlinker = \"${target_host}-gcc\"" > .cargo/config)

# Weird errors with cargo for cln-grpc on arm7 https://github.com/ElementsProject/lightning/issues/6596
RUN ( ! [ "${target_host}" = "arm-linux-gnueabihf" ] ) || \
    (sed -i '/documentation = "https:\/\/docs.rs\/cln-grpc"/a include = ["**\/*.*"]' cln-grpc/Cargo.toml)

# Ensure that the desired grpcio-tools & protobuf versions are installed
# https://github.com/ElementsProject/lightning/pull/7376#issuecomment-2161102381
RUN poetry lock && poetry install && \
    poetry self add poetry-plugin-export

# Ensure that git differences are removed before making bineries, to avoid `-modded` suffix
# poetry.lock changed due to pyln-client, pyln-proto and pyln-testing version updates
# pyproject.toml was updated to exclude wss-proxy plugins in base-builder stage
RUN git reset --hard HEAD

RUN ./configure --prefix=/tmp/lightning_install --enable-static && poetry run make install

# Export the requirements for the plugins so we can install them in builder-python stage
WORKDIR /opt/lightningd/plugins/wss-proxy
RUN poetry lock && poetry export -o requirements.txt --without-hashes
WORKDIR /opt/lightningd
RUN echo 'RUSTUP_INSTALL_OPTS="${RUSTUP_INSTALL_OPTS}"' > /tmp/rustup_install_opts.txt

# We need to build python plugins on the target's arch because python doesn't support cross build
FROM ${BASE_DISTRO} AS builder-python
RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
        git \
        curl \
        libtool \
        pkg-config \
        autoconf \
        automake \
        build-essential \
        libffi-dev \
        libssl-dev \
        python3 \
        python3-dev \
        python3-pip \
        python3-venv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHON_VERSION=3
RUN mkdir -p /root/.venvs && \
    python3 -m venv /root/.venvs/cln && \
    . /root/.venvs/cln/bin/activate && \
    pip3 install --upgrade pip setuptools wheel

# Copy rustup_install_opts.txt file from builder
COPY --from=builder /tmp/rustup_install_opts.txt /tmp/rustup_install_opts.txt
# Setup ENV $RUSTUP_INSTALL_OPTS for this stage
RUN export $(cat /tmp/rustup_install_opts.txt)
ENV PATH="/root/.cargo/bin:/root/.venvs/cln/bin:$PATH"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y ${RUSTUP_INSTALL_OPTS}

WORKDIR /opt/lightningd/plugins/wss-proxy
COPY --from=builder /opt/lightningd/plugins/wss-proxy/requirements.txt .
RUN pip3 install -r requirements.txt
RUN pip3 cache purge

WORKDIR /opt/lightningd

FROM ${BASE_DISTRO} AS final

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      tini \
      socat \
      inotify-tools \
      jq \
      python3 \
      python3-pip \
      binutils \
      curl \
      dnsutils \
      iproute2 \
      libcurl4-gnutls-dev \
      libev-dev \
      libsqlite3-dev \
      libunwind-dev \
      procps \
      libpq5 \
      wget \
      xxd && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV LIGHTNINGD_DATA=/root/.lightning \
    LIGHTNINGD_RPC_PORT=9835 \
    LIGHTNINGD_PORT=9735 \
    LIGHTNINGD_NETWORK=bitcoin

# Install npm for UI
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install -y nodejs
RUN npm install -g npm@9.8.1

# CLBOSS
COPY --from=clboss /usr/local/bin/clboss /usr/local/libexec/c-lightning/plugins/clboss

RUN mkdir $LIGHTNINGD_DATA && \
    touch $LIGHTNINGD_DATA/config
VOLUME [ "/root/.lightning" ]

# Take libpq directly from builder.
RUN mkdir /var/libpq && mkdir -p /usr/local/pgsql/lib
RUN --mount=type=bind,from=builder,source=/var/libpq,target=/var/libpq,rw \
    cp -a /var/libpq/libpq.* /usr/local/pgsql/lib && \
    echo "/usr/local/pgsql/lib" > /etc/ld.so.conf.d/libpq.conf && \
    ldconfig

COPY --from=builder /tmp/lightning_install/ /usr/local/
COPY --from=builder-python /root/.venvs/cln/lib/python3.11/site-packages /usr/local/lib/python3.11/dist-packages/
COPY --from=downloader /opt/bitcoin/bin /usr/bin

ARG PLATFORM

RUN wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_${PLATFORM} && chmod +x /usr/local/bin/yq

# aarch64 or x86_64
ARG ARCH

# teos (server) & watchtower-client
COPY --from=builder /root/.cargo/bin/teosd /usr/local/bin/teosd
COPY --from=builder /root/.cargo/bin/teos-cli /usr/local/bin/teos-cli
COPY --from=builder /root/.cargo/bin/watchtower-client /usr/local/libexec/c-lightning/plugins/watchtower-client

# sling
COPY --from=builder /tmp/rust-sling/target/release /usr/local/libexec/c-lightning/plugins/sling
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/sling

# other scripts
ADD ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
RUN chmod a+x /usr/local/bin/docker_entrypoint.sh
ADD ./check-rpc.sh /usr/local/bin/check-rpc.sh
RUN chmod a+x /usr/local/bin/check-rpc.sh
ADD ./check-web-ui.sh /usr/local/bin/check-web-ui.sh
RUN chmod a+x /usr/local/bin/check-web-ui.sh
ADD ./check-synced.sh /usr/local/bin/check-synced.sh
RUN chmod a+x /usr/local/bin/check-synced.sh
ADD ./actions/*.sh /usr/local/bin/
RUN chmod a+x /usr/local/bin/*.sh

# UI
COPY --from=ui /app/apps/frontend/build /app/apps/frontend/build
COPY --from=ui /app/apps/frontend/public /app/apps/frontend/public
COPY --from=ui /app/apps/frontend/package.json /app/apps/frontend/package.json
COPY --from=ui /app/apps/backend/dist /app/apps/backend/dist
COPY --from=ui /app/apps/backend/package.json /app/apps/backend/package.json
COPY --from=ui /app/package.json /app/package.json
COPY --from=ui /app/node_modules /app/node_modules

WORKDIR /app
