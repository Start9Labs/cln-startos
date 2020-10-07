# Build stage for compiled artifacts
FROM alpine:3.12

RUN apk update

ADD ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
RUN chmod a+x /usr/local/bin/docker_entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker_entrypoint.sh"]
