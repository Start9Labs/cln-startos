import {setConfigMatcher} from './models/setConfig.ts'

setConfigMatcher.unsafeCast({
    "alias": null,
    "color": "9f17bd",
    "bitcoind": {
        "type": "internal-proxy",
        "user": "c-lightning",
        "password": "3Z9cxQ5kMyz7ppUyXeDpcG"
    },
    "rpc": {
        "enabled": true,
        "user": "lightning",
        "password": "wNzPeWoF27pSCvofXpQ1Bd"
    },
    "advanced": {
        "tor-only": false,
        "fee-base": 1000,
        "fee-rate": 1,
        "min-capacity": 10000,
        "ignore-fee-limits": false,
        "funding-confirms": 3,
        "cltv-delta": 40,
        "wumbo-channels": false,
        "experimental": {
            "dual-fund": false,
            "onion-messages": false,
            "offers": false,
            "shutdown-wrong-funding": false
        },
        "plugins": {
            "http": true,
            "rebalance": false,
            "summary": false,
            "rest": true
        }
    },
    "peer-tor-address": "w26whrdrfiu4gogv4dhzlfoxddn24utiggio7bry4xzkzwnqzdyweeyd.onion",
    "rpc-tor-address": "j3wicxib442eri353x2fu4bgdwsbxnovtveiebcql2hlw236ayby3uad.onion"
})