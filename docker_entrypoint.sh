#!/bin/sh

set -ea

_term() {
  echo "Caught SIGTERM signal!"
  kill -TERM "$lightningd_child" 2>/dev/null
  kill -TERM "$ui_child" 2>/dev/null
}

export EMBASSY_IP=$(ip -4 route list match 0/0 | awk '{print $3}')
export PEER_TOR_ADDRESS=$(yq e '.peer-tor-address' /root/.lightning/start9/config.yaml)
export RPC_TOR_ADDRESS=$(yq e '.rpc-tor-address' /root/.lightning/start9/config.yaml)
export REST_TOR_ADDRESS=$(yq e '.rest-tor-address' /root/.lightning/start9/config.yaml)
export SPARKO_TOR_ADDRESS=$(yq e '.sparko-tor-address' /root/.lightning/start9/config.yaml)
export REST_LAN_ADDRESS=$(echo "$REST_TOR_ADDRESS" | sed 's/\.onion/\.local/')

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
echo $SPARKO_TOR_ADDRESS > /root/.lightning/start9/sparkoTorAddress


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

echo "Starting lightning"
lightningd --database-upgrade=true$MIN_ONCHAIN$AUTO_CLOSE$ZEROBASEFEE$MIN_CHANNEL$MAX_CHANNEL &
lightningd_child=$!

while ! [ -e /root/.lightning/bitcoin/lightning-rpc ]; do
    echo "Waiting for lightning rpc to start..."
    sleep 30
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

# User Interface
export APP_CORE_LIGHTNING_DAEMON_IP="localhost"
export LIGHTNING_REST_IP="localhost"
export APP_CORE_LIGHTNING_IP="0.0.0.0"
export APP_CONFIG_DIR="$/root/.lightning/data/app"
export APP_CORE_LIGHTNING_REST_PORT=3001
export APP_CORE_LIGHTNING_REST_CERT_DIR="/usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs"
export DEVICE_DOMAIN_NAME=$RPC_LAN_ADDRESS
export LOCAL_HOST=$REST_LAN_ADDRESS
export APP_CORE_LIGHTNING_COMMANDO_ENV_DIR="/root/.lightning"
export APP_CORE_LIGHTNING_REST_HIDDEN_SERVICE=$REST_TOR_ADDRESS
export APP_CORE_LIGHTNING_WEBSOCKET_PORT=4269
export COMMANDO_CONFIG="/root/.lightning/.commando-env"
export APP_CORE_LIGHTNING_PORT=4500
export APP_MODE=production

EXISTING_PUBKEY=""
GETINFO_RESPONSE=""
LIGHTNINGD_PATH=$APP_CORE_LIGHTNING_COMMANDO_ENV_DIR"/"
LIGHTNING_RPC="/root/.lightning/bitcoin/lightning-rpc"
ENV_FILE_PATH="$LIGHTNINGD_PATH"".commando-env"

echo "$LIGHTNING_RPC"

getinfo_request() {
  cat <<EOF
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getinfo",
  "params": []
}
EOF
}

commando_rune_request() {
  cat <<EOF
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "commando-rune",
  "params": [null, [["For Application#"]]]
}
EOF
}

commando_datastore_request() {
  cat <<EOF
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "datastore",
  "params": [["commando", "runes", "$UNIQUE_ID"], "$RUNE"]
}
EOF
}

generate_new_rune() {
  COUNTER=0
  RUNE=""
  while { [ "$RUNE" = "" ] || [ "$RUNE" = "null" ]; } && [ $COUNTER -lt 10 ]; do
    # Send 'commando-rune' request
    echo "Generating rune attempt: $COUNTER"
    COUNTER=$((COUNTER+1))

    RUNE_RESPONSE=$( (echo "$(commando_rune_request)"; sleep 2) | socat - UNIX-CONNECT:"$LIGHTNING_RPC")

    RUNE=$(echo "$RUNE_RESPONSE" | jq -r '.result.rune')
    UNIQUE_ID=$(echo "$RUNE_RESPONSE" | jq -r '.result.unique_id')
    echo "RUNE_RESPONSE"
    echo "$RUNE_RESPONSE"
    echo "RUNE"
    echo "$RUNE"

    if [ "$RUNE" != "" ] && [ "$RUNE" != "null" ]; then
      # Save rune in env file
      echo "LIGHTNING_RUNE=\"$RUNE\"" >> "$COMMANDO_CONFIG"
    fi

    if [ "$UNIQUE_ID" != "" ] &&  [ "$UNIQUE_ID" != "null" ]; then
      # This will fail for v>23.05
      DATASTORE_RESPONSE=$( (echo "$(commando_datastore_request)"; sleep 1) | socat - UNIX-CONNECT:"$LIGHTNING_RPC") > /dev/null
    fi
  done
  if [ $COUNTER -eq 10 ] && [ "$RUNE" = "" ]; then
    echo "Error: Unable to generate rune for application authentication!"
  fi
}

# Read existing pubkey
if [ -f "$COMMANDO_CONFIG" ]; then
  EXISTING_PUBKEY=$(head -n1 "$COMMANDO_CONFIG")
  EXISTING_RUNE=$(sed -n "2p" "$COMMANDO_CONFIG")
  echo "EXISTING_PUBKEY"
  echo "$EXISTING_PUBKEY"
  echo "EXISTING_RUNE"
  echo "$EXISTING_RUNE"
fi

# Getinfo from CLN
until [ "$GETINFO_RESPONSE" != "" ]
do
  echo "Waiting for lightningd"
  # Send 'getinfo' request
  GETINFO_RESPONSE=$( (echo "$(getinfo_request)"; sleep 1) | socat - UNIX-CONNECT:"$LIGHTNING_RPC")
  echo "$GETINFO_RESPONSE"
done
# Write 'id' from the response as pubkey
LIGHTNING_PUBKEY="$(jq -n "$GETINFO_RESPONSE" | jq -r '.result.id')"
echo "$LIGHTNING_PUBKEY"

# Compare existing pubkey with current
if [ "$EXISTING_PUBKEY" != "LIGHTNING_PUBKEY=\"$LIGHTNING_PUBKEY\"" ] ||
  [ "$EXISTING_RUNE" = "" ] || 
  [ "$EXISTING_RUNE" = "LIGHTNING_RUNE=\"\"" ] ||
  [ "$EXISTING_RUNE" = "LIGHTNING_RUNE=\"null\"" ]; then
  # Pubkey changed or missing rune; rewrite new data on the file.
  echo "Pubkey mismatched or missing rune; Rewriting the data."
  cat /dev/null > "$COMMANDO_CONFIG"
  echo "LIGHTNING_PUBKEY=\"$LIGHTNING_PUBKEY\"" >> "$COMMANDO_CONFIG"
  generate_new_rune
else
  echo "Pubkey matches with existing pubkey."
fi

npm run start &
ui_child=$!

echo "All configuration Done"

trap _term TERM

wait $lightningd_child $ui_child
