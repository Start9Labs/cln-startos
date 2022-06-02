FROM alpine:3.12 as bitcoin-core

RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/alpine.global.ssl.fastly.net/g' /etc/apk/repositories
RUN apk --no-cache add autoconf
RUN apk --no-cache add automake
RUN apk --no-cache add boost-dev
RUN apk --no-cache add build-base
RUN apk --no-cache add chrpath
RUN apk --no-cache add file
RUN apk --no-cache add gnupg
RUN apk --no-cache add libevent-dev
RUN apk --no-cache add libressl
RUN apk --no-cache add libtool
RUN apk --no-cache add linux-headers
RUN apk --no-cache add zeromq-dev
RUN set -ex \
    && for key in \
    90C8019E36C2E964 \
    ; do \
    gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" || \
    gpg --batch --keyserver pgp.mit.edu --recv-keys "$key" || \
    gpg --batch --keyserver keyserver.pgp.com --recv-keys "$key" || \
    gpg --batch --keyserver ha.pool.sks-keyservers.net --recv-keys "$key" || \
    gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" ; \
    done

ARG BITCOIN_VERSION
RUN test -n "$BITCOIN_VERSION"

ENV BITCOIN_PREFIX=/opt/bitcoin-${BITCOIN_VERSION}

RUN wget https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/SHA256SUMS.asc
RUN wget https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/bitcoin-${BITCOIN_VERSION}.tar.gz
RUN gpg --verify SHA256SUMS.asc
RUN grep " bitcoin-${BITCOIN_VERSION}.tar.gz\$" SHA256SUMS.asc | sha256sum -c -
RUN tar -xzf *.tar.gz

WORKDIR /bitcoin-${BITCOIN_VERSION}

RUN sed -i '/AC_PREREQ/a\AR_FLAGS=cr' src/univalue/configure.ac
RUN sed -i '/AX_PROG_CC_FOR_BUILD/a\AR_FLAGS=cr' src/secp256k1/configure.ac
RUN sed -i s:sys/fcntl.h:fcntl.h: src/compat.h
RUN ./autogen.sh
RUN ./configure LDFLAGS=-L`ls -d /opt/db*`/lib/ CPPFLAGS=-I`ls -d /opt/db*`/include/ \
    --prefix=${BITCOIN_PREFIX} \
    --mandir=/usr/share/man \
    --disable-tests \
    --disable-bench \
    --disable-ccache \
    --with-gui=no \
    --disable-wallet \
    --enable-util-cli
RUN make -j$(($(nproc) - 1))
RUN strip ./src/bitcoin-cli

# Builder
FROM alpine:3.12 as builder

RUN apk add ca-certificates alpine-sdk autoconf automake git libtool gmp-dev \
    sqlite-dev python2 python3 py3-pip py3-mako net-tools zlib-dev libsodium gettext jq
RUN pip3 install mrkd mistune==0.8.4

ADD ./.gitmodules /root/.gitmodules
ADD ./.git /root/.git
ADD ./lightning /root/lightning
WORKDIR /root/lightning

RUN rm -rf cli/test/*.c
RUN ./configure
RUN make -j$(($(nproc) - 1))
RUN make install



# Runner
FROM arm64v8/node:12-alpine3.12 as runner

RUN apk update
RUN apk add bash tini
RUN apk add sqlite-dev build-base linux-headers ca-certificates gcc gmp libffi-dev libgcc libevent libstdc++ boost-filesystem=1.72.0-r6 python3 python3-dev py3-pip nodejs
RUN apk add --update openssl && \
    rm -rf /var/cache/apk/*

ARG BITCOIN_VERSION
RUN test -n "$BITCOIN_VERSION"

RUN wget https://github.com/mikefarah/yq/releases/download/v4.12.2/yq_linux_arm.tar.gz -O - |\
    tar xz && mv yq_linux_arm /usr/bin/yq

COPY --from=builder /usr/local /usr/local
COPY --from=bitcoin-core /bitcoin-${BITCOIN_VERSION}/src/bitcoin-cli /usr/local/bin

# PLUGINS
RUN pip install --upgrade pip
RUN pip install wheel
RUN mkdir -p /usr/local/libexec/c-lightning/plugins

# rebalance
ADD ./plugins/rebalance /usr/local/libexec/c-lightning/plugins/rebalance
RUN pip3 install -r /usr/local/libexec/c-lightning/plugins/rebalance/requirements.txt
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/rebalance/rebalance.py

# summary
ADD ./plugins/summary /usr/local/libexec/c-lightning/plugins/summary
RUN pip3 install -r /usr/local/libexec/c-lightning/plugins/summary/requirements.txt
RUN chmod a+x /usr/local/libexec/c-lightning/plugins/summary/summary.py

# c-lightning-REST
ADD ./c-lightning-REST /usr/local/libexec/c-lightning/plugins/c-lightning-REST
WORKDIR /usr/local/libexec/c-lightning/plugins/c-lightning-REST
RUN npm install --only=production

# c-lightning-http-plugin
ADD ./c-lightning-http-plugin/target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin /usr/local/libexec/c-lightning/plugins/c-lightning-http-plugin

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
