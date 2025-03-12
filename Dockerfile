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

FROM debian:bullseye-slim AS downloader

RUN set -ex \
	&& apt-get update \
	&& apt-get install -qq --no-install-recommends ca-certificates dirmngr wget

WORKDIR /opt

# arm64 or amd64
ARG PLATFORM
# aarch64 or x86_64
ARG ARCH

ARG BITCOIN_VERSION
ENV BITCOIN_TARBALL=bitcoin-${BITCOIN_VERSION}-${ARCH}-linux-gnu.tar.gz
ENV BITCOIN_URL=https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/$BITCOIN_TARBALL
ENV BITCOIN_ASC_URL=https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/SHA256SUMS

RUN mkdir /opt/bitcoin && cd /opt/bitcoin \
    && wget -qO $BITCOIN_TARBALL "$BITCOIN_URL" \
    && wget -qO bitcoin "$BITCOIN_ASC_URL" \
    && grep $BITCOIN_TARBALL bitcoin | tee SHA256SUMS \
    && sha256sum -c SHA256SUMS \
    && BD=bitcoin-$BITCOIN_VERSION/bin \
    && tar -xzvf $BITCOIN_TARBALL $BD/bitcoin-cli --strip-components=1 \
    && rm $BITCOIN_TARBALL

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

# lightningd builder
FROM debian:bookworm-slim AS builder

ENV LIGHTNINGD_VERSION=master
ENV RUST_PROFILE=release
ENV PATH="/root/.cargo/bin:/root/.local/bin:$PATH"


ENV POSTGRES_CONFIG="--without-readline" \
    PG_CONFIG=/usr/local/pgsql/bin/pg_config

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

# CLN
RUN wget -q https://zlib.net/fossils/zlib-1.2.13.tar.gz \
    && tar xvf zlib-1.2.13.tar.gz \
    && cd zlib-1.2.13 \
    && ./configure \
    && make \
    && make install && cd .. && \
    rm zlib-1.2.13.tar.gz && \
    rm -rf zlib-1.2.13

RUN apt-get install -y --no-install-recommends unzip tclsh \
&& wget -q https://www.sqlite.org/2023/sqlite-src-3430100.zip \
&& unzip sqlite-src-3430100.zip \
&& cd sqlite-src-3430100 \
&& ./configure --enable-static --disable-readline --disable-threadsafe --disable-load-extension \
&& make \
&& make install && cd .. && rm sqlite-src-3430100.zip && rm -rf sqlite-src-3430100

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
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

WORKDIR /opt/lightningd
COPY lightning/. /tmp/lightning-wrapper/lightning
COPY ./.git/modules/lightning /tmp/lightning-wrapper/lightning/.git/

RUN git clone --recursive /tmp/lightning-wrapper/lightning . && \
    git checkout $(git --work-tree=/tmp/lightning-wrapper/lightning --git-dir=/tmp/lightning-wrapper/lightning/.git rev-parse HEAD)

ENV PYTHON_VERSION=3
RUN curl -sSL https://install.python-poetry.org | python3 -

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3

RUN pip3 install --upgrade pip setuptools wheel
RUN pip3 wheel cryptography
RUN pip3 install grpcio-tools


# Do not build python plugins (wss-proxy) here, python doesn't support cross compilation.
RUN sed -i '/^wss-proxy/d' pyproject.toml && \
    poetry lock && \
    poetry export -o requirements.txt --without-hashes
RUN mkdir -p /root/.venvs && \
    python3 -m venv /root/.venvs/cln && \
    . /root/.venvs/cln/bin/activate && \
    pip3 install -r requirements.txt && \
    pip3 cache purge

# Ensure that the desired grpcio-tools & protobuf versions are installed
# https://github.com/ElementsProject/lightning/pull/7376#issuecomment-2161102381
RUN poetry lock && poetry install && \
    poetry self add poetry-plugin-export

# Ensure that git differences are removed before making bineries, to avoid `-modded` suffix
# poetry.lock changed due to pyln-client, pyln-proto and pyln-testing version updates
# pyproject.toml was updated to exclude wss-proxy plugins in base-builder stage
RUN git reset --hard HEAD

RUN ./configure --prefix=/tmp/lightning_install --enable-static && make && poetry run make install

# Export the requirements for the plugins so we can install them in builder-python stage
WORKDIR /opt/lightningd/plugins/wss-proxy
RUN poetry export -o requirements.txt --without-hashes
WORKDIR /opt/lightningd
RUN echo 'RUSTUP_INSTALL_OPTS="${RUSTUP_INSTALL_OPTS}"' > /tmp/rustup_install_opts.txt

# We need to build python plugins on the target's arch because python doesn't support cross build
FROM debian:bookworm-slim AS builder-python
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

FROM node:18-bullseye-slim AS final

ENV LIGHTNINGD_DATA=/root/.lightning \
    LIGHTNINGD_RPC_PORT=9835 \
    LIGHTNINGD_PORT=9735 \
    LIGHTNINGD_NETWORK=bitcoin

# CLBOSS
COPY --from=clboss /usr/local/bin/clboss /usr/local/libexec/c-lightning/plugins/clboss

# Take libpq directly from builder.
RUN mkdir /var/libpq && mkdir -p /usr/local/pgsql/lib
RUN --mount=type=bind,from=builder,source=/var/libpq,target=/var/libpq,rw \
    cp -a /var/libpq/libpq.* /usr/local/pgsql/lib && \
    echo "/usr/local/pgsql/lib" > /etc/ld.so.conf.d/libpq.conf && \
    ldconfig

# lightningd
COPY --from=builder /tmp/lightning_install/ /usr/local/
COPY --from=builder /usr/local/lib/python3.11/dist-packages/ /usr/local/lib/python3.11/dist-packages/
COPY --from=builder-python /root/.venvs/cln/lib/python3.11/site-packages /usr/local/lib/python3.11/dist-packages/
COPY --from=downloader /opt/bitcoin/bin /usr/bin

RUN apt-get update && apt-get install -y --no-install-recommends \
    binutils \
    curl \
    dnsutils \
    socat \
    inotify-tools \
    iproute2 \
    jq \
    libcurl4-gnutls-dev \
    libev-dev \
    libsqlite3-dev \
    libunwind-dev \
    procps \
    python3 \
    python3-gdbm \
    python3-pip \
    libpq5 \
    wget \
    xxd \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir $LIGHTNINGD_DATA && \
    touch $LIGHTNINGD_DATA/config
VOLUME [ "/root/.lightning" ]

ARG PLATFORM

RUN wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_${PLATFORM} && chmod +x /usr/local/bin/yq

# PLUGINS
WORKDIR /usr/local/libexec/c-lightning/plugins
RUN pip3 install -U pip
RUN pip3 install wheel
RUN pip3 install -U pyln-proto pyln-bolt7

# c-lightning-REST
ADD ./c-lightning-REST /usr/local/libexec/c-lightning/plugins/c-lightning-REST
WORKDIR /usr/local/libexec/c-lightning/plugins/c-lightning-REST
RUN npm install --omit=dev

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
