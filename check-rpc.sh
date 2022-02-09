#!/bin/bash

DURATION=$(</dev/stdin)
if (($DURATION <= 30000 )); then
    exit 60
else
    lightning-cli getinfo
    RES=$?
    if test "$RES" != 0; then
        echo "RPC interface is unreachable" >&2
        exit 1
    fi
fi
