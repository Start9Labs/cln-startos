#!/bin/sh

set -e

cat > input.json
BLOCKHEIGHT_OR_DEPTH=$(jq -r '.["blockheight-or-depth"]' input.json)
rm input.json
echo "$BLOCKHEIGHT_OR_DEPTH" > /root/.lightning/rescan.txt

if [ $BLOCKHEIGHT_OR_DEPTH -lt 0 ]; then
    BLOCKHEIGHT=$(( -BLOCKHEIGHT_OR_DEPTH ))
    SCAN_MESSAGE="from blockheight $BLOCKHEIGHT"
else
    SCAN_MESSAGE="$BLOCKHEIGHT_OR_DEPTH blocks from the tip"
fi

action_result_running="    {
    \"version\": \"0\",
    \"message\": \"Core Lightning restarting and rescanning $SCAN_MESSAGE\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"
action_result_stopped="    {
    \"version\": \"0\",
    \"message\": \"On the next service start Core Lightning will rescan $SCAN_MESSAGE\",
    \"value\": null,
    \"copyable\": false,
    \"qr\": false
}"

lightning-cli getinfo >/dev/null 2>/dev/null && EXIT_CODE=$? || EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    lightning-cli stop >/dev/null 2>/dev/null || echo $action_result_running
else
    echo $action_result_stopped
fi
