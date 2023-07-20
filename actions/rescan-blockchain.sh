#!/bin/sh

set -e

cat > input.json
BLOCKHEIGHT_OR_DEPTH=$(jq -r '.["blockheight-or-depth"]')
kill $(pidof lightningd)
echo -e "\nrescan=$BLOCKHEIGHT_OR_DEPTH" >> /root/.lightning/config
lightningd >> /tmp/cln.rescan.log &

sed -i '\nrescan='$BLOCKHEIGHT_OR_DEPTH'/d' /root/.lightning/config