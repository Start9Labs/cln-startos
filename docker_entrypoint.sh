#!/bin/sh

export EMBASSY_IP=$(ip -4 route list match 0/0 | awk '{print $3}')
export PEER_TOR_ADDRESS=$(yq e '.peer-tor-address' /root/.lightning/start9/config.yaml)
export RPC_TOR_ADDRESS=$(yq e '.rpc-tor-address' /root/.lightning/start9/config.yaml)

mkdir -p /root/.lightning/shared
configurator
lightningd &

# TODO Wait for application to get started

while ! [ -f /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/access.macaroon ];
do
    echo "#"
    sleep 1
done
cp /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/access.macaroon /root/.lightning/public/access.macaroon
cat /root/.lightning/public/access.macaroon | base64  > /root/.lightning/start9/access.macaroon.base64
cat /root/.lightning/public/access.macaroon | base64 | xxd  > /root/.lightning/start9/access.macaroon.hex

sed "s/proxy={proxy}/proxy=${EMBASSY_IP}:9050/" /root/.lightning/start9/config.main > /root/.lightning/start9/config

mkdir /root/.lightning/public
lightning-cli getinfo > /root/.lightning/start9/lightningGetInfo
echo $PEER_TOR_ADDRESS > /root/.lightning/start9/peerTorAddress


wait -n
