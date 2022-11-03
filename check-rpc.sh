#!/bin/bash

lightning-cli getinfo &>/dev/null
exit_code=$?
if test "$exit_code" != 0; then
    echo "RPC interface is unreachable" >&2
    exit 1
fi
