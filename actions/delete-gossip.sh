#!/bin/sh

set -e

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"gossip_store has been deleted. Core Lightning is restarting\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"
action_result_stopped="    {
    \"version\": \"0\",
    \"message\": \"On the next service start Core Lightning will rebuild gossip_store from peers\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

lightning-cli getinfo >/dev/null 2>/dev/null && EXIT_CODE=$? || EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    lightning-cli stop >/dev/null 2>/dev/null || sudo rm /embassy-data/package-data/volumes/c-lightning/data/main/bitcoin/gossip_store && echo $action_result_running
else
    sudo rm /embassy-data/package-data/volumes/c-lightning/data/main/bitcoin/gossip_store
    echo $action_result_stopped
fi

