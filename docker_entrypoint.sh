#!/bin/sh

export EMBASSY_IP=$(ip -4 route list match 0/0 | awk '{print $3}')
export PEER_TOR_ADDRESS=$(yq e '.peer-tor-address' /root/.lightning/start9/config.yaml)
export RPC_TOR_ADDRESS=$(yq e '.rpc-tor-address' /root/.lightning/start9/config.yaml)


mkdir -p /root/.lightning/shared
configurator
exec tini lightningd
