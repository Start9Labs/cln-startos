#!/bin/bash

b_type=$(yq e '.bitcoind.type' /root/.lightning/start9/config.yaml)
b_host="bitcoind.embassy"
b_username=$(yq e '.bitcoind.user' /root/.lightning/start9/config.yaml)
b_password=$(yq e '.bitcoind.password' /root/.lightning/start9/config.yaml)
c_username=$(yq e '.rpc.user' /root/.lightning/start9/config.yaml)
c_password=$(yq e '.rpc.password' /root/.lightning/start9/config.yaml)
b_gbc_result=$(bitcoin-cli -rpcconnect=$b_host -rpcuser=$b_username -rpcpassword=$b_password getblockcount)
error_code=$?
if [ $error_code -ne 0 ]; then
    echo $b_gbc_result >&2
    exit $error_code
fi

c_gi_result=$(lightning-cli getinfo)
error_code=$?
if [ $error_code -ne 0 ]; then
    exit 60
fi

warning_lightningd_sync=$(echo "$c_gi_result" | yq e '.warning_lightningd_sync' -)
if [ "$warning_lightningd_sync" = "null" ]; then
    exit 0
else
    # blockheight=$(echo "$c_gi_result" | yq e '.blockheight' -)
    blockheight=$(lightning-cli getlog debug | yq '.log[] | select (.log == "Adding block*")' - | tail -n1 | yq '.log' | cut -d " " -f 3 | tr -d ':')
    echo "Catching up to blocks from bitcoind. This may take several hours. Progress: $blockheight of $b_gbc_result blocks" >&2
    exit 61
fi
