#!/bin/sh

export EMBASSY_IP=$(ip -4 route list match 0/0 | awk '{print $3}')
export PEER_TOR_ADDRESS=$(yq e '.peer-tor-address' /root/.lightning/start9/config.yaml)
export RPC_TOR_ADDRESS=$(yq e '.rpc-tor-address' /root/.lightning/start9/config.yaml)


mkdir -p /root/.lightning/shared
mkdir /root/.lightning/public

echo $PEER_TOR_ADDRESS > /root/.lightning/start9/peerTorAddress


sh /root/.lightning/start9/waitForStart.sh
sed "s/proxy={proxy}/proxy=${EMBASSY_IP}:9050/" /root/.lightning/config.main > /root/.lightning/config

echo "Cleaning old lightning rpc"
if [ -e /root/.lightning/bitcoin/lightning-rpc ]; then
    rm /root/.lightning/bitcoin/lightning-rpc
fi

echo "Starting lightning"
lightningd &

while ! [ -e /root/.lightning/bitcoin/lightning-rpc ]; do
    echo "Waiting for lightning rpc to start..."
    sleep 1
done

echo "Cleaning link to lightning rpc"
if [ -e /root/.lightning/shared/lightning-rpc ]; then
    rm /root/.lightning/shared/lightning-rpc
fi
ln /root/.lightning/bitcoin/lightning-rpc /root/.lightning/shared/lightning-rpc


while ! [ -e /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/access.macaroon ];
do
    echo "Waiting for macaroon..."
    sleep 1
done
cp /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/access.macaroon /root/.lightning/public/access.macaroon
cat /root/.lightning/public/access.macaroon | base64  > /root/.lightning/start9/access.macaroon.base64
cat /root/.lightning/public/access.macaroon | base64 | xxd  > /root/.lightning/start9/access.macaroon.hex

lightning-cli getinfo > /root/.lightning/start9/lightningGetInfo

echo "All configuration Done"


wait -n
