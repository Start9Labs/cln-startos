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
  kill -TERM "$ui_child" 2>/dev/null
}

export EMBASSY_IP=$(ip -4 route list match 0/0 | awk '{print $3}')
export PEER_TOR_ADDRESS=$(yq e '.peer-tor-address' /root/.lightning/start9/config.yaml)
export RPC_TOR_ADDRESS=$(yq e '.rpc-tor-address' /root/.lightning/start9/config.yaml)
export UI_TOR_ADDRESS=$(yq e '.web-ui-tor-address' /root/.lightning/start9/config.yaml)
export UI_LAN_ADDRESS=$(echo "$UI_TOR_ADDRESS" | sed 's/\.onion/\.local/')
export REST_TOR_ADDRESS=$(yq e '.rest-tor-address' /root/.lightning/start9/config.yaml)
export CLN_REST_TOR_ADDRESS=$(yq e '.clnrest-tor-address' /root/.lightning/start9/config.yaml)
export CLAMS_WEBSOCKET_TOR_ADDRESS=$(yq e '.clams-websocket-tor-address' /root/.lightning/start9/config.yaml)
export WATCHTOWER_TOR_ADDRESS=$(yq e '.watchtower-tor-address' /root/.lightning/start9/config.yaml)
export TOWERS_DATA_DIR=/root/.lightning/.watchtower
export REST_LAN_ADDRESS=$(echo "$REST_TOR_ADDRESS" | sed 's/\.onion/\.local/')

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

if [ -e /root/.lightning/rescan.txt ]; then
  RESCAN=" --rescan=$(cat /root/.lightning/rescan.txt)"
  echo $RESCAN
  rm /root/.lightning/rescan.txt
fi

mkdir -p /root/.lightning/shared
mkdir -p /root/.lightning/public

echo $PEER_TOR_ADDRESS > /root/.lightning/start9/peerTorAddress
echo $RPC_TOR_ADDRESS > /root/.lightning/start9/rpcTorAddress
echo $REST_TOR_ADDRESS > /root/.lightning/start9/restTorAddress
echo $CLN_REST_TOR_ADDRESS > /root/.lightning/start9/clnRestTorAddress
echo $CLAMS_WEBSOCKET_TOR_ADDRESS > /root/.lightning/start9/clamsRemoteWebsocketTorAddress
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
lightningd --database-upgrade=true$MIN_ONCHAIN$AUTO_CLOSE$ZEROBASEFEE$MIN_CHANNEL$MAX_CHANNEL$RESCAN &
lightningd_child=$!

if [ -e /root/.lightning/start9/restore.yaml ]; then
  echo "Detected backup restore. Attempting to recover channels using emergency.recover..."
  lightning-cli emergencyrecover
  rm /root/.lightning/start9/restore.yaml
fi

if [ "$(yq ".watchtowers.wt-server" /root/.lightning/start9/config.yaml)" = "true" ]; then
  echo "Starting teosd"
  teosd --datadir=/root/.lightning/.teos &
  teosd_child=$!
fi

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

if [ "$(yq ".watchtowers.wt-client.enabled" /root/.lightning/start9/config.yaml)" = "enabled" ]; then
  lightning-cli listtowers > /root/.lightning/start9/wtClientInfo
  cat /root/.lightning/start9/wtClientInfo | jq -r 'to_entries[] | .key + "@" + (.value.net_addr | split("://")[1])' > /root/.lightning/start9/wt_old
  cat /root/.lightning/start9/config.yaml | yq '.watchtowers.wt-client.add-watchtowers | .[]' > /root/.lightning/start9/wt_new
  echo "Abandoning old watchtowers"
  grep -Fxvf /root/.lightning/start9/wt_new /root/.lightning/start9/wt_old | cut -f1 -d "@" | xargs -I{} lightning-cli abandontower {} 2>&1 || true
  echo "Registering new watchtowers"
  grep -Fxvf /root/.lightning/start9/wt_old /root/.lightning/start9/wt_new | xargs -I{} lightning-cli registertower {} 2>&1 || true

  while true; do lightning-cli listtowers > /root/.lightning/start9/wtClientInfo || echo 'Failed to fetch towers from client endpoint.'; sleep 60; done &
  wtclient_child=$!
fi

if [ "$(yq ".watchtowers.wt-server" /root/.lightning/start9/config.yaml)" = "true" ]; then
  while true; do teos-cli --datadir=/root/.lightning/.teos gettowerinfo > /root/.lightning/start9/teosTowerInfo 2>/dev/null || echo 'Failed to fetch tower properties, tower still starting.'; sleep 30; done &
  wtserver_child=$!
fi

# User Interface
export APP_CORE_LIGHTNING_DAEMON_IP="0.0.0.0"
export LIGHTNING_REST_IP="localhost"
export APP_CORE_LIGHTNING_IP="0.0.0.0"
export APP_CONFIG_DIR="/root/.lightning/data/app"
export APP_CORE_LIGHTNING_REST_PORT=3001
export APP_CORE_LIGHTNING_REST_CERT_DIR="/usr/local/libexec/c-lightning/plugins/c-lightning-REST/certs"
export DEVICE_DOMAIN_NAME=$UI_LAN_ADDRESS
export LOCAL_HOST=$REST_LAN_ADDRESS
export APP_CORE_LIGHTNING_COMMANDO_ENV_DIR="/root/.lightning"
export APP_CORE_LIGHTNING_REST_HIDDEN_SERVICE=$UI_TOR_ADDRESS
export APP_CORE_LIGHTNING_WEBSOCKET_PORT=4269
export COMMANDO_CONFIG="/root/.lightning/.commando-env"
export APP_CORE_LIGHTNING_PORT=4500
export APP_MODE=production
export APP_PROTOCOL="http"
export CORE_LIGHTNING_PATH="/root/.lightning"
export APP_BITCOIN_NETWORK="bitcoin"
export APP_CORE_LIGHTNING_DAEMON_GRPC_PORT=2106

EXISTING_PUBKEY=""
GETINFO_RESPONSE=""
LIGHTNINGD_PATH=$APP_CORE_LIGHTNING_COMMANDO_ENV_DIR"/"
LIGHTNING_RPC="/root/.lightning/bitcoin/lightning-rpc"
ENV_FILE_PATH="$LIGHTNINGD_PATH"".commando-env"

UI_PASSWORD=$(yq e '.ui-password' /root/.lightning/start9/config.yaml)
UI_PASSWORD_HASH=$(echo -n "$UI_PASSWORD" | sha256sum | awk '{print $1}')
UI_CONFIG='{
  "unit": "SATS",
  "fiatUnit": "USD",
  "appMode": "DARK",
  "isLoading": false,
  "error": null,
  "singleSignOn": false,
  "password": "'"$UI_PASSWORD_HASH"'"
  }'

if [ -e /root/.lightning/data/app/config.json ]; then
  echo "config.json already exists."
else
  mkdir -p /root/.lightning/data/app
  touch /root/.lightning/data/app/config.json
  echo "$UI_CONFIG" > /root/.lightning/data/app/config.json
  echo "UI Password hash saved to config.json"
fi

SAVED_UI_PW_HASH=$(cat /root/.lightning/data/app/config.json | jq -r '.password')
if [ -e /root/.lightning/data/app/config.json ] && [ "$UI_PASSWORD_HASH" !=  "$SAVED_UI_PW_HASH" ]; then
  jq ".password = \"$UI_PASSWORD_HASH\"" /root/.lightning/data/app/config.json > /tmp/config.tmp && mv /tmp/config.tmp /root/.lightning/data/app/config.json
  echo "updated password hash saved to config.json"
fi

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
  cat <<EOF | jq -c
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "commando-rune",
  "params": [null, [["$1"]]]
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
  RUNE_FILE=$1
  RUNE_COMMENT=$2
  COUNTER=0
  RUNE=""
  while { [ "$RUNE" = "" ] || [ "$RUNE" = "null" ]; } && [ $COUNTER -lt 10 ]; do
    # Send 'commando-rune' request
    echo "Generating rune attempt: $COUNTER"
    COUNTER=$((COUNTER+1))

    RUNE_RESPONSE=$( (echo $(commando_rune_request "$RUNE_COMMENT"); sleep 2) | socat - UNIX-CONNECT:"$LIGHTNING_RPC")

    RUNE=$(echo "$RUNE_RESPONSE" | jq -r '.result.rune')
    UNIQUE_ID=$(echo "$RUNE_RESPONSE" | jq -r '.result.unique_id')

    if [ "$RUNE" != "" ] && [ "$RUNE" != "null" ]; then
      # Save rune in env file
      echo "LIGHTNING_RUNE=\"$RUNE\"" >> "$RUNE_FILE"
      LAST_FOUR=$(echo "$RUNE" | rev | cut -c 1-4 | rev)
      echo "Rune ending with ${LAST_FOUR} saved to env file"
    fi

    if [ "$UNIQUE_ID" != "" ] &&  [ "$UNIQUE_ID" != "null" ]; then
      DATASTORE_RESPONSE=$( (echo "$(commando_datastore_request)"; sleep 1) | socat - UNIX-CONNECT:"$LIGHTNING_RPC") > /dev/null
    fi
  done
  if [ $COUNTER -eq 10 ] && [ "$RUNE" = "" ]; then
    echo "Error: Unable to generate rune: \"$RUNE_COMMENT\"!"
  fi
}

if [ "$(yq ".advanced.plugins.clnrest" /root/.lightning/start9/config.yaml)" = "true" ] && ! [ -e /root/.lightning/public/clnrest_rune ] ; then
  CLNREST_RUNE_PATH="/root/.lightning/public/clnrest_rune"
  generate_new_rune $CLNREST_RUNE_PATH "For CLNRest#"
fi

# Read existing pubkey
if [ -f "$COMMANDO_CONFIG" ]; then
  EXISTING_PUBKEY=$(head -n1 "$COMMANDO_CONFIG")
  EXISTING_RUNE=$(sed -n "2p" "$COMMANDO_CONFIG")
  LAST_FOUR=$(echo "$EXISTING_RUNE" | rev | cut -c 2-5 | rev)
  echo "Found existing Pubkey in commando config: $EXISTING_PUBKEY"
  echo "Found existing Rune ending with: ${LAST_FOUR} in commando config"
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
  generate_new_rune $COMMANDO_CONFIG "For Application#"
else
  echo "Pubkey matches with existing pubkey."
fi

npm run start &
ui_child=$!

echo "All configuration Done"

trap _term TERM
trap _chld CHLD

wait $lightningd_child $teosd_child $wtclient_child $wtserver_child $ui_child
