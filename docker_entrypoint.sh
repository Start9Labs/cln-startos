#!/bin/sh

set -ea

_term() {
  echo "Caught SIGTERM signal!"
  kill -TERM "$lightningd_child" 2>/dev/null
  kill -TERM "$teosd_child" 2>/dev/null
  kill -TERM "$wtclient_child" 2>/dev/null
  kill -TERM "$wtserver_child" 2>/dev/null
}

_chld() {
  echo "Caught SIGCHLD signal!"
  kill -TERM "$lightningd_child" 2>/dev/null
  kill -TERM "$teosd_child" 2>/dev/null
  kill -TERM "$wtclient_child" 2>/dev/null
  kill -TERM "$wtserver_child" 2>/dev/null
}

export EMBASSY_IP=$(ip -4 route list match 0/0 | awk '{print $3}')
export PEER_TOR_ADDRESS=$(yq e '.peer-tor-address' /root/.lightning/start9/config.yaml)
export RPC_TOR_ADDRESS=$(yq e '.rpc-tor-address' /root/.lightning/start9/config.yaml)
export REST_TOR_ADDRESS=$(yq e '.rest-tor-address' /root/.lightning/start9/config.yaml)
export WATCHTOWER_TOR_ADDRESS=$(yq e '.watchtower-tor-address' /root/.lightning/start9/config.yaml)
export TOWERS_DATA_DIR=/root/.lightning/.watchtower
mkdir -p $TOWERS_DATA_DIR

CLBOSS_ENABLED_VALUE=$(yq e '.advanced.plugins.clboss.enabled' /root/.lightning/start9/config.yaml)
if [ $CLBOSS_ENABLED_VALUE = "enabled" ]; then
  if yq -e '.advanced.plugins.clboss.min-onchain' /root/.lightning/start9/config.yaml > /dev/null 2>&1; then
    MIN_ONCHAIN_VALUE=$(yq e '.advanced.plugins.clboss.min-onchain' /root/.lightning/start9/config.yaml)
    MIN_ONCHAIN=" --clboss-min-onchain=$MIN_ONCHAIN_VALUE"
  else
    MIN_ONCHAIN=""
  fi

  if yq -e '.advanced.plugins.clboss.auto-close' /root/.lightning/start9/config.yaml > /dev/null 2>&1; then
    AUTO_CLOSE_VALUE=$(yq e '.advanced.plugins.clboss.auto-close' /root/.lightning/start9/config.yaml)
    AUTO_CLOSE=" --clboss-auto-close=$AUTO_CLOSE_VALUE"
  else
    AUTO_CLOSE=""
  fi

  ZEROBASEFEE_VALUE=$(yq e '.advanced.plugins.clboss.zerobasefee' /root/.lightning/start9/config.yaml)
  if [ $ZEROBASEFEE_VALUE = "default" ]; then
      ZEROBASEFEE=""
  else
      ZEROBASEFEE=" --clboss-zerobasefee=$ZEROBASEFEE_VALUE"
  fi

  if yq -e '.advanced.plugins.clboss.min-channel' /root/.lightning/start9/config.yaml > /dev/null 2>&1; then
    MIN_CHANNEL_VALUE=$(yq e '.advanced.plugins.clboss.min-channel' /root/.lightning/start9/config.yaml)
    MIN_CHANNEL=" --clboss-min-channel=$MIN_CHANNEL_VALUE"
  else
    MIN_CHANNEL=""
  fi

  if yq -e '.advanced.plugins.clboss.max-channel' /root/.lightning/start9/config.yaml > /dev/null 2>&1; then
    MAX_CHANNEL_VALUE=$(yq e '.advanced.plugins.clboss.max-channel' /root/.lightning/start9/config.yaml)
    MAX_CHANNEL=" --clboss-max-channel=$MAX_CHANNEL_VALUE"
  else
    MAX_CHANNEL=""
  fi
fi

mkdir -p /root/.lightning/shared
mkdir -p /root/.lightning/public

echo $PEER_TOR_ADDRESS > /root/.lightning/start9/peerTorAddress
echo $RPC_TOR_ADDRESS > /root/.lightning/start9/rpcTorAddress
echo $REST_TOR_ADDRESS > /root/.lightning/start9/restTorAddress
echo $WATCHTOWER_TOR_ADDRESS > /root/.lightning/start9/watchtowerTorAddress

sh /root/.lightning/start9/waitForStart.sh
sed "s/proxy={proxy}/proxy=${EMBASSY_IP}:9050/" /root/.lightning/config.main > /root/.lightning/config

echo "Cleaning old lightning rpc"
if [ -e /root/.lightning/bitcoin/lightning-rpc ]; then
    rm /root/.lightning/bitcoin/lightning-rpc
fi

# echo "Checking cert"
echo "Fetching system cert for REST interface"
# if ! [ -e /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/key.pem ] || ! [ -e /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/certificate.pem ]; then
  # echo "Cert missing, copying cert into c-lightning-REST dir"
while ! [ -e /mnt/cert/rest.key.pem ]; do
  echo "Waiting for system cert key file..."
  sleep 1
done
mkdir -p /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs
cp /mnt/cert/rest.key.pem /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/key.pem
while ! [ -e /mnt/cert/rest.cert.pem ]; do
  echo "Waiting for system cert..."
  sleep 1
done
cp /mnt/cert/rest.cert.pem /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/certificate.pem
# fi

# use macaroon if exists
if [ -e /root/.lightning/public/access.macaroon ] && [ -e /root/.lightning/public/rootKey.key ]; then
  cp /root/.lightning/public/access.macaroon /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/access.macaroon
  cp /root/.lightning/public/rootKey.key /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/rootKey.key
else
  echo "Macaroon not found, generating new one"
fi

echo "Starting lightningd"
lightningd --database-upgrade=true$MIN_ONCHAIN$AUTO_CLOSE$ZEROBASEFEE$MIN_CHANNEL$MAX_CHANNEL &
lightningd_child=$!

if [ "$(yq ".watchtowers.wt-server" /root/.lightning/start9/config.yaml)" = "true" ]; then
  echo "Starting teosd"
  teosd --datadir=/root/.lightning/.teos &
  teosd_child=$!
fi

while ! [ -e /root/.lightning/bitcoin/lightning-rpc ]; do
    echo "Waiting for lightning rpc to start..."
    sleep 1
    if ! ps -p $lightningd_child > /dev/null; then
        echo "lightningd has stopped, exiting container"
        exit 1
    fi
done

echo "Cleaning link to lightning rpc"
if [ -e /root/.lightning/shared/lightning-rpc ]; then
    rm /root/.lightning/shared/lightning-rpc
fi
ln /root/.lightning/bitcoin/lightning-rpc /root/.lightning/shared/lightning-rpc


if ! [ -e /root/.lightning/public/access.macaroon ] || ! [ -e /root/.lightning/public/rootKey.key ] ; then
  while ! [ -e /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/access.macaroon ] || ! [ -e /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/rootKey.key ];
  do
      echo "Waiting for macaroon..."
      sleep 1
      if ! ps -p $lightningd_child > /dev/null; then
          echo "lightningd has stopped, exiting container"
          exit 1
      fi
  done
  cp /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/access.macaroon /root/.lightning/public/access.macaroon
  cp /usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs/rootKey.key /root/.lightning/public/rootKey.key
fi

cat /root/.lightning/public/access.macaroon | basenc --base64url -w0  > /root/.lightning/start9/access.macaroon.base64
cat /root/.lightning/public/access.macaroon | basenc --base16 -w0  > /root/.lightning/start9/access.macaroon.hex

lightning-cli getinfo > /root/.lightning/start9/lightningGetInfo

if [ "$(yq ".watchtowers.wt-client" /root/.lightning/start9/config.yaml)" = "true" ]; then
  lightning-cli listtowers > .lightning/start9/wtClientInfo
  cat .lightning/start9/wtClientInfo | jq -r 'to_entries[] | .key + "@" + (.value.net_addr | split("://")[1])' > .lightning/start9/wt_old
  cat .lightning/start9/config.yaml | yq '.watchtowers.add-watchtowers | .[]' > .lightning/start9/wt_new
  echo "Abandoning old watchtowers"
  grep -Fxvf .lightning/start9/wt_new .lightning/start9/wt_old | cut -f1 -d "@" | xargs -I{} lightning-cli abandontower {} 2>&1 || true
  echo "Regsistering new watchtowers"
  grep -Fxvf .lightning/start9/wt_old .lightning/start9/wt_new | xargs -I{} lightning-cli registertower {} 2>&1 || true

  while true; do lightning-cli listtowers > .lightning/start9/wtClientInfo || echo 'Failed to fetch towers from client endpoint.'; sleep 60; done &
  wtclient_child=$!
fi

if [ "$(yq ".watchtowers.wt-server" /root/.lightning/start9/config.yaml)" = "true" ]; then
  while true; do teos-cli --datadir=/root/.lightning/.teos gettowerinfo > /root/.lightning/start9/teosTowerInfo 2>/dev/null || echo 'Failed to fetch tower properties, tower still starting.'; sleep 30; done &
  wtserver_child=$!
fi

echo "All configuration Done"

trap _term TERM
trap _chld CHLD

wait $lightningd_child $teosd_child $wtclient_child $wtserver_child
