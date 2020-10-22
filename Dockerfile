FROM alpine:3.12 as builder

ADD . /root/c-lightning
WORKDIR /root/c-lightning/lightning
RUN apk add ca-certificates alpine-sdk autoconf automake git libtool \
    gmp-dev sqlite-dev python2 python3 py3-mako net-tools zlib-dev libsodium gettext
RUN ./configure
RUN make
RUN make install
WORKDIR /root
RUN mkdir dist
RUN mv /usr/local/bin dist/bins
RUN mv /usr/local/libexec/c-lightning/plugins dist/plugins
RUN mv /usr/local/libexec/c-lightning dist/libexec

FROM alpine:3.12 as runner

RUN apk update
RUN apk add tini
RUN apk add sqlite-dev gmp libgcc

RUN mkdir -p /usr/local/libexec/c-lightning/plugins
COPY --from=builder /root/dist/bins/* /usr/local/bin
COPY --from=builder /root/dist/plugins/* /usr/local/libexec/c-lightning/plugins
COPY --from=builder /root/dist/libexec/* /usr/local/libexec/c-lightning
ADD ./c-lightning-http-plugin/target/armv7-unknown-linux-musleabihf/release/c-lightning-http-plugin /usr/local/libexec/c-lightning/plugins/c-lightning-http-plugin
ADD ./configurator/target/armv7-unknown-linux-musleabihf/release/configurator /usr/local/bin/configurator
ADD ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
RUN chmod a+x /usr/local/bin/docker_entrypoint.sh

WORKDIR /root

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker_entrypoint.sh"]
