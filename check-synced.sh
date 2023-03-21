#!/bin/bash

b_type=$(yq e '.bitcoind.type' /root/.lightning/start9/config.yaml)
if [ "$b_type" = "none" ]; then
    b_host=$(yq e '.bitcoind.url' /root/.lightning/start9/config.yaml)
    if [[ "$b_host" == *".onion"* ]]; then
        socks5_proxy="-x socks5h://embassy:9050 "
    else
        socks5_proxy=""
    fi
    b_tip_height_result=$(curl -sS $socks5_proxy$b_host/blocks/tip/height)
    error_code=$?
    if [ $error_code -ne 0 ]; then
        echo $b_tip_height_result >&2
        exit $error_code
    fi
else
    if [ "$b_type" = "internal" ]; then
        b_host="bitcoind.embassy"
        b_username=$(yq e '.bitcoind.user' /root/.lightning/start9/config.yaml)
        b_password=$(yq e '.bitcoind.password' /root/.lightning/start9/config.yaml)
    elif [ "$b_type" = "internal-proxy" ]; then
        b_host="btc-rpc-proxy.embassy"
        b_username=$(yq e '.bitcoind.user' /root/.lightning/start9/config.yaml)
        b_password=$(yq e '.bitcoind.password' /root/.lightning/start9/config.yaml)
    else
        echo "Invalid Bitcoin Core configuration" >&2
        exit 1
    fi
    c_username=$(yq e '.rpc.user' /root/.lightning/start9/config.yaml)
    c_password=$(yq e '.rpc.password' /root/.lightning/start9/config.yaml)
    b_tip_height_result=$(bitcoin-cli -rpcconnect=$b_host -rpcuser=$b_username -rpcpassword=$b_password getblockcount)
    error_code=$?
    if [ $error_code -ne 0 ]; then
        echo $b_tip_height_result >&2
        exit $error_code
    fi
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
    echo "Catching up to blocks from bitcoind. This may take several hours. Progress: $blockheight of $b_tip_height_result blocks" >&2
    exit 61
fi
