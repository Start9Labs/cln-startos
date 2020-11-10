#!/bin/sh

export HOST_IP=$(ip -4 route list match 0/0 | awk '{print $3}')

configurator
ls -d /root/.lightning/shared/*/lightning-rpc | xargs rm
ls -d /root/.lightning/shared/* | xargs ln /root/.lightning/bitcoin/lightning-rpc
exec tini lightningd
