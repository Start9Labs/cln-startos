#!/bin/sh

	nodehost=$(lightning-cli getinfo | jq -r '. as $r | .address[0] | "\($r.id)@\(.address):\(.port)"')
	token=$(lightning-cli commando-rune "$@" | jq -r '.rune | @uri')
	LN_LINK="lnlink:$nodehost?token=$token"

  action_result="    {
    \"version\": \"0\",
    \"message\": \"Scan the below LNLink QR code with a compatible wallet\",
    \"value\": \"$LN_LINK\",
    \"copyable\": true,
    \"qr\": true
}"

echo $action_result