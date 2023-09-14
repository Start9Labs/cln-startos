#!/bin/sh

set -e

json_output="$(lightning-cli commando-rune)"
RUNE="$(echo "$json_output" | jq -r '.rune')"

action_result="    {
    \"version\": \"0\",
    \"message\": \"Successfully Added Rune\",
    \"value\": \"$RUNE\",
    \"copyable\": true,
    \"qr\": true
}"

echo $action_result