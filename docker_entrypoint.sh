#!/bin/sh

export EMBASSY_IP=$(ip -4 route list match 0/0 | awk '{print $3}')
export PEER_TOR_ADDRESS=$(yq e '.peer-tor-address' /root/.lightning/start9/config.yaml)
export RPC_TOR_ADDRESS=$(yq e '.rpc-tor-address' /root/.lightning/start9/config.yaml)

mkdir -p /root/.lightning/shared
configurator
lightningd &

while ! [ -f /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/access.macaroon ];
do
    echo "#"
    sleep 1
done
cat /root/.lightning/public/access.macaroon | base64  > /root/.lightning/start9/access.macaroon.base64
cat /root/.lightning/public/access.macaroon | base64 | xxd  > /root/.lightning/start9/access.macaroon.hex

sleep 1
mkdir /root/.lightning/public
lightning-cli getinfo > /root/.lightning/start9/lightningGetInfo
echo $PEER_TOR_ADDRESS > /root/.lightning/start9/peerTorAddress


wait -n
