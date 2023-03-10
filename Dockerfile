FROM debian:bullseye-slim as downloader

RUN set -ex \
	&& apt-get update \
	&& apt-get install -qq --no-install-recommends ca-certificates dirmngr wget

WORKDIR /opt

RUN wget -qO /opt/tini "https://github.com/krallin/tini/releases/download/v0.18.0/tini" \
    && echo "12d20136605531b09a2c2dac02ccee85e1b874eb322ef6baf7561cd93f93c855 /opt/tini" | sha256sum -c - \
    && chmod +x /opt/tini

# arm64 or amd64
ARG PLATFORM
# aarch64 or x86_64
ARG ARCH

ARG BITCOIN_VERSION=22.0
ENV BITCOIN_TARBALL bitcoin-${BITCOIN_VERSION}-${ARCH}-linux-gnu.tar.gz
ENV BITCOIN_URL https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/$BITCOIN_TARBALL
ENV BITCOIN_ASC_URL https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/SHA256SUMS

RUN mkdir /opt/bitcoin && cd /opt/bitcoin \
    && wget -qO $BITCOIN_TARBALL "$BITCOIN_URL" \
    && wget -qO bitcoin "$BITCOIN_ASC_URL" \
    && grep $BITCOIN_TARBALL bitcoin | tee SHA256SUMS \
    && sha256sum -c SHA256SUMS \
    && BD=bitcoin-$BITCOIN_VERSION/bin \
    && tar -xzvf $BITCOIN_TARBALL $BD/bitcoin-cli --strip-components=1 \
    && rm $BITCOIN_TARBALL

# clboss builder
FROM debian:bullseye-slim as clboss

RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
        # autoconf \
        autoconf-archive \
        automake \
        build-essential \
        git \
        libcurl4-gnutls-dev \
        libev-dev \
        libsqlite3-dev \
        libtool \
        pkg-config

COPY clboss/. /tmp/clboss
WORKDIR /tmp/clboss
RUN autoreconf -i
RUN ./configure
RUN make
RUN make install
RUN strip /usr/local/bin/clboss

# lightningd builder
FROM debian:bullseye-slim as builder

ENV LIGHTNINGD_VERSION=v0.12.0
ENV RUST_PROFILE=release
ENV PATH=$PATH:/root/.cargo/bin/
ARG DEVELOPER=1
ENV PYTHON_VERSION=3


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
        libpq-dev \
        libssl-dev \
        libtool \
        libffi-dev \
        pkg-config \
        protobuf-compiler \
        python3 \
        python3-dev \
        python3-mako \
        python3-pip \
        python3-venv \
        python3-setuptools \
        wget

# CLN
RUN wget -q https://zlib.net/zlib-1.2.13.tar.gz \
&& tar xvf zlib-1.2.13.tar.gz \
&& cd zlib-1.2.13 \
&& ./configure \
&& make \
&& make install && cd .. && rm zlib-1.2.13.tar.gz && rm -rf zlib-1.2.13

RUN apt-get install -y --no-install-recommends unzip tclsh \
&& wget -q https://www.sqlite.org/2019/sqlite-src-3290000.zip \
&& unzip sqlite-src-3290000.zip \
&& cd sqlite-src-3290000 \
&& ./configure --enable-static --disable-readline --disable-threadsafe --disable-load-extension \
&& make \
&& make install && cd .. && rm sqlite-src-3290000.zip && rm -rf sqlite-src-3290000

RUN wget -q https://gmplib.org/download/gmp/gmp-6.1.2.tar.xz \
&& tar xvf gmp-6.1.2.tar.xz \
&& cd gmp-6.1.2 \
&& ./configure --disable-assembly \
&& make \
&& make install && cd .. && rm gmp-6.1.2.tar.xz && rm -rf gmp-6.1.2

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN rustup toolchain install stable --component rustfmt --allow-downgrade
RUN rustup toolchain install beta

# build http plugin
COPY c-lightning-http-plugin/. /tmp/lightning-wrapper/c-lightning-http-plugin
WORKDIR /tmp/lightning-wrapper/c-lightning-http-plugin
RUN cargo update && cargo +beta build --release

# build coffee plugin
COPY coffee /tmp/lightning-wrapper/coffee
WORKDIR /tmp/lightning-wrapper/coffee
RUN cargo update && cargo build --release

# build nostril
COPY nostril /tmp/lightning-wrapper/nostril
WORKDIR /tmp/lightning-wrapper/nostril
RUN make install

WORKDIR /opt/lightningd
COPY ./.git /tmp/lightning-wrapper/.git
COPY lightning/. /tmp/lightning-wrapper/lightning

RUN git clone --recursive /tmp/lightning-wrapper/lightning . && \
    git checkout $(git --work-tree=/tmp/lightning-wrapper/lightning --git-dir=/tmp/lightning-wrapper/lightning/.git rev-parse HEAD)

RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/install-poetry.py | python3 - \
    && pip3 install -U pip \
    && pip3 install -U wheel \
    && /root/.local/bin/poetry install

RUN pip3 install mako mistune==0.8.4 mrkd

RUN ./configure --prefix=/tmp/lightning_install --enable-static --enable-experimental-features && make -j7 DEVELOPER=${DEVELOPER} && make install

FROM node:16-bullseye-slim as final

ENV LIGHTNINGD_DATA=/root/.lightning
ENV LIGHTNINGD_RPC_PORT=9835
ENV LIGHTNINGD_PORT=9735
ENV LIGHTNINGD_NETWORK=bitcoin

COPY --from=downloader /opt/tini /usr/bin/tini

# CLBOSS
COPY --from=clboss /usr/local/bin/clboss /usr/local/libexec/c-lightning/plugins/clboss

RUN apt-get update && apt-get install -y --no-install-recommends \
    dnsutils \
    socat \
    inotify-tools \
    iproute2 \
    libcurl4-gnutls-dev \
    libev-dev \
    libsqlite3-dev \
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
COPY --from=builder /tmp/lightning_install/ /usr/local/
COPY --from=downloader /opt/bitcoin/bin /usr/bin

ARG PLATFORM
ARG ARCH

RUN wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_${PLATFORM} && chmod +x /usr/local/bin/yq
RUN wget -qO /usr/local/bin/websocat https://github.com/vi/websocat/releases/download/v1.11.0/websocat.${ARCH}-unknown-linux-musl && chmod +x /usr/local/bin/websocat
# RUN wget https://github.com/mikefarah/yq/releases/download/v4.26.1/yq_linux_arm.tar.gz -O - |\
#     tar xz && mv yq_linux_arm /usr/bin/yq

# PLUGINS
WORKDIR /usr/local/libexec/c-lightning/plugins
RUN pip install -U pip
RUN pip install wheel
RUN pip install -U pyln-proto pyln-bolt7

# rebalance
ADD ./plugins/rebalance /usr/local/libexec/c-lightning/plugins/rebalance
RUN pip install -r /usr/local/libexec/c-lightning/plugins/rebalance/requirements.txt
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/rebalance/rebalance.py

# summary
ADD ./plugins/summary /usr/local/libexec/c-lightning/plugins/summary
RUN pip install -r /usr/local/libexec/c-lightning/plugins/summary/requirements.txt
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/summary/summary.py

# reckless
ADD ./reckless /usr/local/libexec/c-lightning/plugins/reckless
RUN pip install -r /usr/local/libexec/c-lightning/plugins/reckless/requirements.txt
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/reckless/reckless.py

# coffee
COPY --from=builder /tmp/lightning-wrapper/coffee/target/release/coffee_cmd /usr/local/bin/coffee_cmd

# sauron
ADD ./plugins/sauron /usr/local/libexec/c-lightning/plugins/sauron
RUN pip install -r /usr/local/libexec/c-lightning/plugins/sauron/requirements.txt
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/sauron/sauron.py

# # circular
RUN wget https://github.com/giovannizotta/circular/releases/download/v1.1.1/circular-v1.1.1-linux-${PLATFORM}.tar.gz -O - |\
    tar xz --directory=/usr/local/libexec/c-lightning/plugins/ && chmod +x /usr/local/libexec/c-lightning/plugins/circular

# sparko
RUN wget -qO /usr/local/libexec/c-lightning/plugins/sparko https://github.com/fiatjaf/sparko/releases/download/v2.9/sparko_linux_${PLATFORM} && chmod +x /usr/local/libexec/c-lightning/plugins/sparko

# noise
ADD ./plugins/noise /usr/local/libexec/c-lightning/plugins/noise
# RUN pip install -r /usr/local/libexec/c-lightning/plugins/noise/requirements.txt
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/noise/noise.py

# nostrify
ADD ./plugins/nostrify /usr/local/libexec/c-lightning/plugins/nostrify
RUN pip install -r /usr/local/libexec/c-lightning/plugins/nostrify/requirements.txt
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/nostrify/nostrify.py
COPY --from=builder /usr/local/bin/nostril* /usr/local/bin/
RUN chmod a+x /usr/local/bin/nostril*

# c-lightning-REST
ADD ./c-lightning-REST /usr/local/libexec/c-lightning/plugins/c-lightning-REST
WORKDIR /usr/local/libexec/c-lightning/plugins/c-lightning-REST
RUN npm install --omit=dev

# aarch64 or x86_64
ARG ARCH

# c-lightning-http-plugin
COPY --from=builder /tmp/lightning-wrapper/c-lightning-http-plugin/target/release/c-lightning-http-plugin /usr/local/libexec/c-lightning/plugins/c-lightning-http-plugin

# other scripts
ADD ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
RUN chmod a+x /usr/local/bin/docker_entrypoint.sh
ADD ./check-rpc.sh /usr/local/bin/check-rpc.sh
RUN chmod a+x /usr/local/bin/check-rpc.sh
ADD ./check-synced.sh /usr/local/bin/check-synced.sh
RUN chmod a+x /usr/local/bin/check-synced.sh

WORKDIR /root

EXPOSE 9735 8080

ENTRYPOINT ["/usr/local/bin/docker_entrypoint.sh"]
