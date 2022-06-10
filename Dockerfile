# FROM debian:bullseye-slim as bitcoin-core

# LABEL maintainer.0="João Fonseca (@joaopaulofonseca)" \
#   maintainer.1="Pedro Branco (@pedrobranco)" \
#   maintainer.2="Rui Marinho (@ruimarinho)"

# RUN useradd -r bitcoin \
#   && apt-get update -y \
#   && apt-get install -y curl gnupg gosu \
#   && apt-get clean \
#   && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# ARG TARGETPLATFORM
# ENV BITCOIN_VERSION=23.0
# ENV BITCOIN_DATA=/home/bitcoin/.bitcoin
# ENV PATH=/opt/bitcoin-${BITCOIN_VERSION}/bin:$PATH

# RUN set -ex \
#   && if [ "${TARGETPLATFORM}" = "linux/amd64" ]; then export TARGETPLATFORM=x86_64-linux-gnu; fi \
#   && if [ "${TARGETPLATFORM}" = "linux/arm64" ]; then export TARGETPLATFORM=aarch64-linux-gnu; fi \
#   && if [ "${TARGETPLATFORM}" = "linux/arm/v7" ]; then export TARGETPLATFORM=arm-linux-gnueabihf; fi \
#   && for key in \
#     152812300785C96444D3334D17565732E08E5E41 \
#     0AD83877C1F0CD1EE9BD660AD7CC770B81FD22A8 \
#     590B7292695AFFA5B672CBB2E13FC145CD3F4304 \
#     28F5900B1BB5D1A4B6B6D1A9ED357015286A333D \
#     637DB1E23370F84AFF88CCE03152347D07DA627C \
#     CFB16E21C950F67FA95E558F2EEB9F5CC09526C1 \
#     F4FC70F07310028424EFC20A8E4256593F177720 \
#     D1DBF2C4B96F2DEBF4C16654410108112E7EA81F \
#     287AE4CA1187C68C08B49CB2D11BD4F33F1DB499 \
#     F9A8737BF4FF5C89C903DF31DD78544CF91B1514 \
#     9DEAE0DC7063249FB05474681E4AED62986CD25D \
#     E463A93F5F3117EEDE6C7316BD02942421F4889F \
#     9D3CC86A72F8494342EA5FD10A41BDC3F4FAFF1C \
#     4DAF18FE948E7A965B30F9457E296D555E7F63A7 \
#     28E72909F1717FE9607754F8A7BEB2621678D37D \
#     74E2DEF5D77260B98BC19438099BAD163C70FBFA \
#   ; do \
#       gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" || \
#       gpg --batch --keyserver keys.openpgp.org --recv-keys "$key" || \
#       gpg --batch --keyserver pgp.mit.edu --recv-keys "$key" || \
#       gpg --batch --keyserver keyserver.pgp.com --recv-keys "$key" || \
#       gpg --batch --keyserver ha.pool.sks-keyservers.net --recv-keys "$key" || \
#       gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" ; \
#     done \
#   && curl -SL https://raw.githubusercontent.com/Kvaciral/kvaciral/main/kvaciral.asc | gpg --import \
#   && curl -SLO https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/bitcoin-${BITCOIN_VERSION}-${TARGETPLATFORM}.tar.gz \
#   && curl -SLO https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/SHA256SUMS \
#   && curl -SLO https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/SHA256SUMS.asc \
#   && gpg --verify SHA256SUMS.asc SHA256SUMS \
#   && grep " bitcoin-${BITCOIN_VERSION}-${TARGETPLATFORM}.tar.gz" SHA256SUMS | sha256sum -c - \
#   && tar -xzf *.tar.gz -C /opt \
#   && rm *.tar.gz *.asc \
#   && rm -rf /opt/bitcoin-${BITCOIN_VERSION}/bin/bitcoin-qt

# Builder

# This dockerfile is meant to compile a core-lightning x64 image
# It is using multi stage build:
# * downloader: Download litecoin/bitcoin and qemu binaries needed for core-lightning
# * builder: Compile core-lightning dependencies, then core-lightning itself with static linking
# * final: Copy the binaries required at runtime
# The resulting image uploaded to dockerhub will only contain what is needed for runtime.
# From the root of the repository, run "docker build -t yourimage:yourtag ."
FROM debian:bullseye-slim as downloader

RUN set -ex \
	&& apt-get update \
	&& apt-get install -qq --no-install-recommends ca-certificates dirmngr wget

WORKDIR /opt

RUN wget -qO /opt/tini "https://github.com/krallin/tini/releases/download/v0.18.0/tini" \
    && echo "12d20136605531b09a2c2dac02ccee85e1b874eb322ef6baf7561cd93f93c855 /opt/tini" | sha256sum -c - \
    && chmod +x /opt/tini

ARG BITCOIN_VERSION=22.0
ENV BITCOIN_TARBALL bitcoin-${BITCOIN_VERSION}-aarch64-linux-gnu.tar.gz
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

# ENV LITECOIN_VERSION 0.16.3
# ENV LITECOIN_PGP_KEY FE3348877809386C
# ENV LITECOIN_URL https://download.litecoin.org/litecoin-${LITECOIN_VERSION}/linux/litecoin-${LITECOIN_VERSION}-aarch64-linux-gnu.tar.gz
# ENV LITECOIN_ASC_URL https://download.litecoin.org/litecoin-${LITECOIN_VERSION}/linux/litecoin-${LITECOIN_VERSION}-linux-signatures.asc
# ENV LITECOIN_SHA256 686d99d1746528648c2c54a1363d046436fd172beadaceea80bdc93043805994

# # install litecoin binaries
# RUN mkdir /opt/litecoin && cd /opt/litecoin \
#     && wget -qO litecoin.tar.gz "$LITECOIN_URL" \
#     && echo "$LITECOIN_SHA256  litecoin.tar.gz" | sha256sum -c - \
#     && BD=litecoin-$LITECOIN_VERSION/bin \
#     && tar -xzvf litecoin.tar.gz $BD/litecoin-cli --strip-components=1 --exclude=*-qt \
#     && rm litecoin.tar.gz

FROM debian:bullseye-slim as builder

ENV LIGHTNINGD_VERSION=master
RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
        autoconf \
        autoconf-archive \
        automake \
        build-essential \
        ca-certificates \
        curl \
        dirmngr \
        gettext \
        git \
        gnupg \
        libcurl4-gnutls-dev \
        libev-dev \
        libpq-dev \
        libsqlite3-dev \
        libtool \
        libffi-dev \
        pkg-config \
        python3 \
        python3-dev \
        python3-mako \
        python3-pip \
        python3-venv \
        python3-setuptools \
        wget

# CLBOSS
COPY clboss/. /tmp/clboss
WORKDIR /tmp/clboss
RUN autoreconf -i
RUN ./configure
RUN make
RUN make install

# CLN
RUN wget -q https://zlib.net/zlib-1.2.12.tar.gz \
&& tar xvf zlib-1.2.12.tar.gz \
&& cd zlib-1.2.12 \
&& ./configure \
&& make \
&& make install && cd .. && rm zlib-1.2.12.tar.gz && rm -rf zlib-1.2.12

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

ENV RUST_PROFILE=release
ENV PATH=$PATH:/root/.cargo/bin/
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN rustup toolchain install stable --component rustfmt --allow-downgrade

WORKDIR /opt/lightningd
COPY lightning/. /tmp/lightning
RUN git clone --recursive /tmp/lightning . && \
    git checkout $(git --work-tree=/tmp/lightning --git-dir=/tmp/lightning/.git rev-parse HEAD)
ARG DEVELOPER=0
ENV PYTHON_VERSION=3
RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/install-poetry.py | python3 - \
    && pip3 install -U pip \
    && pip3 install -U wheel \
    && /root/.local/bin/poetry config virtualenvs.create false \
    && /root/.local/bin/poetry install

RUN ./configure --prefix=/tmp/lightning_install --enable-static && make -j7 DEVELOPER=${DEVELOPER} && make install

FROM node:12-bullseye-slim as final

COPY --from=downloader /opt/tini /usr/bin/tini
RUN apt-get update && apt-get install -y --no-install-recommends \
    dnsutils \
    socat \
    inotify-tools \
    iproute2 \
    libcurl4-gnutls-dev \
    libev-dev \
    libsqlite3-dev \
    python3 \
    python3-pip \
    libpq5 \
    wget \
    xxd \
    && rm -rf /var/lib/apt/lists/*

ENV LIGHTNINGD_DATA=/root/.lightning
ENV LIGHTNINGD_RPC_PORT=9835
ENV LIGHTNINGD_PORT=9735
ENV LIGHTNINGD_NETWORK=bitcoin

RUN mkdir $LIGHTNINGD_DATA && \
    touch $LIGHTNINGD_DATA/config
VOLUME [ "/root/.lightning" ]
COPY --from=builder /tmp/lightning_install/ /usr/local/
COPY --from=downloader /opt/bitcoin/bin /usr/bin
# COPY --from=downloader /opt/litecoin/bin /usr/bin
# COPY lightning/tools/docker-entrypoint.sh entrypoint.sh

# EXPOSE 9735 9835
# ENTRYPOINT  [ "/usr/bin/tini", "-g", "--", "./entrypoint.sh" ]


# FROM alpine:3.12 as builder

# RUN apk add ca-certificates alpine-sdk autoconf automake git libtool gmp-dev \
#     sqlite-dev python2 python3 py3-pip py3-mako net-tools zlib-dev libsodium gettext jq
# RUN pip3 install mrkd mistune==0.8.4

# ADD ./.gitmodules /root/.gitmodules
# ADD ./.git /root/.git
# ADD ./lightning /root/lightning
# WORKDIR /root/lightning

# RUN rm -rf cli/test/*.c
# RUN ./configure
# RUN make -j$(($(nproc) - 1))
# RUN make install



# # Runner
# FROM arm64v8/node:12-alpine3.12 as runner

# RUN apk update
# RUN apk add bash tini
# RUN apk add sqlite-dev build-base linux-headers ca-certificates gcc gmp libffi-dev libgcc libevent libstdc++ boost-filesystem=1.72.0-r6 python3 python3-dev py3-pip nodejs
# RUN apk add --update openssl && \
#     rm -rf /var/cache/apk/*

# ARG BITCOIN_VERSION
# RUN test -n "$BITCOIN_VERSION"

RUN wget https://github.com/mikefarah/yq/releases/download/v4.12.2/yq_linux_arm.tar.gz -O - |\
    tar xz && mv yq_linux_arm /usr/bin/yq

# COPY --from=builder /usr/local /usr/local
# COPY --from=bitcoin-core /opt/bitcoin-${BITCOIN_VERSION}/bin/bitcoin-qt /usr/local/bin

# PLUGINS
# RUN mkdir -p /usr/local/libexec/c-lightning/plugins
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

# c-lightning-REST
ADD ./c-lightning-REST /usr/local/libexec/c-lightning/plugins/c-lightning-REST
WORKDIR /usr/local/libexec/c-lightning/plugins/c-lightning-REST
RUN npm install --only=production

# c-lightning-http-plugin
ADD ./c-lightning-http-plugin/target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin /usr/local/libexec/c-lightning/plugins/c-lightning-http-plugin

# CLBOSS
COPY --from=builder /usr/local/bin/clboss /usr/local/libexec/c-lightning/plugins/clboss

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
