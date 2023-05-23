#!/bin/bash

DURATION=$(</dev/stdin)
if (($DURATION <= 60000)); then
    exit 60
else
    if ! curl --silent --fail c-lightning.embassy:4500 &>/dev/null; then
        echo "Web interface is unreachable" >&2
        exit 1
    fi
fi
