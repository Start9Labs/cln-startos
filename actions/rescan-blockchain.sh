#!/bin/sh

set -e

cat > input.json
BLOCKHEIGHT_OR_DEPTH=$(jq -r '.["blockheight-or-depth"]' input.json)
rm input.json
echo "$BLOCKHEIGHT_OR_DEPTH" > /root/.lightning/rescan.txt

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Core Lightning restarting and scanning blocks from the specified blockheight or depth\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"
action_result_stopped="    {
    \"version\": \"0\",
    \"message\": \"Core Lightning will rescan blocks from the specified blockheight or depth next time the service is started\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

lightning-cli stop >/dev/null 2>/dev/null && echo $action_result_running || echo $action_result_stopped