import { compat, matches, types as T, util } from "../deps.ts";
import { SetConfig, setConfigMatcher } from "./getConfig.ts";
import { Alias, getAlias } from "./getAlias.ts";

const { string, boolean, shape, arrayOf } = matches;

type Check = {
  currentError(config: T.Config): string | void;
};
const matchWTtEnabledConfig = shape({
  watchtowers: shape({
    "wt-server": boolean,
    "wt-client": shape({
      "enabled": string,
      "add-watchtowers": arrayOf(string),
    })
  }),
});
const configRules: Array<Check> = [
  {
    currentError(config) {
      if (matchWTtEnabledConfig.test(config)) {
        for (const outerIndex in config.watchtowers["wt-client"]["add-watchtowers"]) {
          const outerTowerUri = config.watchtowers["wt-client"]["add-watchtowers"][outerIndex];
          for (const innerIndex in config.watchtowers["wt-client"]["add-watchtowers"]) {
            const innerTowerUri =
              config.watchtowers["wt-client"]["add-watchtowers"][innerIndex];
            if (outerIndex != innerIndex) {
              if (
                outerTowerUri.split("@")[0] == innerTowerUri.split("@")[0]
              ) {
                return `Cannot add multiple watchtowers with the same pubkey`;
              }
            }
          }
        }
      }
    },
  },
];

function checkConfigRules(config: T.Config): T.KnownError | void {
  for (const checker of configRules) {
    const error = checker.currentError(config);
    if (error) {
      return { error: error };
    }
  }
}

async function createWaitForService(effects: T.Effects, config: SetConfig) {
  const {
    bitcoin_rpc_host,
    bitcoin_rpc_pass,
    bitcoin_rpc_port,
    bitcoin_rpc_user,
  } = userInformation(config);
  await effects.writeFile({
    path: "start9/waitForStart.sh",
    toWrite: `
#!/bin/sh
echo "Starting Wait for Bitcoin Start"
while true; do
  bitcoin-cli -rpcconnect=${bitcoin_rpc_host} -rpcport=${bitcoin_rpc_port} -rpcuser=${bitcoin_rpc_user} -rpcpassword=${bitcoin_rpc_pass} getblockchaininfo > /dev/null
  if [ $? -eq 0 ] 
  then 
    break
  else 
    echo "Waiting for Bitcoin to start..."
    sleep 1
  fi
done    
    `,
    volumeId: "main",
  });
}

function userInformation(config: SetConfig) {
  return {
    bitcoin_rpc_user: config["bitcoin-user"],
    bitcoin_rpc_pass: config["bitcoin-password"],
    bitcoin_rpc_host: "bitcoind.embassy",
    bitcoin_rpc_port: 8332,
  };
}

function getDualFundStrategyConfig(
  strategy: (SetConfig["advanced"]["experimental"]["dual-fund"] & {
    enabled: "enabled";
  })["strategy"]
) {
  if (strategy.mode === "incognito") {
    return {
      policy: strategy.policy.policy ? strategy.policy.policy : "match",
      policy_mod:
        "policy-mod" in strategy.policy ? strategy.policy["policy-mod"] : "100",
      leases_only: false,

      fuzz_percent: strategy["fuzz-percent"],
      fund_probability: strategy["fund-probability"],

      lease_fee_base_sat: null,
      lease_fee_basis: null,
      funding_weight: null,
      channel_fee_max_base_msat: null,
      channel_fee_max_proportional_thousandths: null,
    };
  } else {
    const configReturn = {
      policy: "match",
      policy_mod: "100",
      leases_only: true,

      lease_fee_base_sat: strategy["lease-fee-base-sat"],
      lease_fee_basis: strategy["lease-fee-basis"],
      funding_weight: strategy["funding-weight"],
      channel_fee_max_base_msat: strategy["channel-fee-max-base-msat"],
      channel_fee_max_proportional_thousandths:
        strategy["channel-fee-max-proportional-thousandths"],

      fuzz_percent: null,
      fund_probability: null,
    };
    if (
      configReturn.lease_fee_base_sat == null &&
      configReturn.lease_fee_basis == null &&
      configReturn.funding_weight == null &&
      configReturn.channel_fee_max_base_msat == null &&
      configReturn.channel_fee_max_proportional_thousandths == null
    ) {
      configReturn.lease_fee_basis = 65;
    }
    return configReturn;
  }
}

function getDualFundConfig(config: SetConfig) {
  const dualFundConfigInput = config.advanced.experimental["dual-fund"];
  if (dualFundConfigInput.enabled === "enabled") {
    const strategyConfig = getDualFundStrategyConfig(
      dualFundConfigInput.strategy
    );

    // merchant
    const leaseFeeBaseMsat = strategyConfig.lease_fee_base_sat
      ? `lease-fee-base-sat=${strategyConfig.lease_fee_base_sat}`
      : "";
    const leaseFeeBasis = strategyConfig.lease_fee_basis
      ? `lease-fee-basis=${strategyConfig.lease_fee_basis}`
      : "";
    const fundingWeight = strategyConfig.funding_weight
      ? `lease-funding-weight=${strategyConfig.funding_weight}`
      : "";
    const channelFeeMaxBaseMsat = strategyConfig.channel_fee_max_base_msat
      ? `channel-fee-max-base-msat=${strategyConfig.channel_fee_max_base_msat}`
      : "";
    const channelFeeMaxProportionalThousandths =
      strategyConfig.channel_fee_max_proportional_thousandths
        ? `channel-fee-max-proportional-thousandths=${strategyConfig.channel_fee_max_proportional_thousandths}`
        : "";

    // incognito
    const fuzzPercent = strategyConfig.fuzz_percent
      ? `funder-fuzz-percent=${strategyConfig.fuzz_percent}`
      : "";
    const fundProbability = strategyConfig.fund_probability
      ? `funder-fund-probability=${strategyConfig.fund_probability}`
      : "";

    // both
    const policyMod = strategyConfig.policy_mod
      ? `funder-policy-mod=${strategyConfig.policy_mod}`
      : "";
    const minTheirFundingMsat = dualFundConfigInput.other[
      "min-their-funding-msat"
    ]
      ? `funder-min-their-funding=${dualFundConfigInput.other["min-their-funding-msat"]}`
      : "";
    const maxTheirFundingMsat = dualFundConfigInput.other[
      "max-their-funding-msat"
    ]
      ? `funder-max-their-funding=${dualFundConfigInput.other["max-their-funding-msat"]}`
      : "";
    const perChannelMinMsat = dualFundConfigInput.other["per-channel-min-msat"]
      ? `funder-per-channel-min=${dualFundConfigInput.other["per-channel-min-msat"]}`
      : "";
    const perChannelMaxMsat = dualFundConfigInput.other["per-channel-max-msat"]
      ? `funder-per-channel-max=${dualFundConfigInput.other["per-channel-max-msat"]}`
      : "";
    const reserveTankMsat = dualFundConfigInput.other["reserve-tank-msat"]
      ? `funder-reserve-tank=${dualFundConfigInput.other["reserve-tank-msat"]}`
      : "";

    return `
experimental-dual-fund
funder-lease-requests-only=${strategyConfig.leases_only}
funder-policy=${strategyConfig.policy}
${policyMod}

${leaseFeeBaseMsat}
${leaseFeeBasis}
${fundingWeight}
${channelFeeMaxBaseMsat}
${channelFeeMaxProportionalThousandths}

${fuzzPercent}
${fundProbability}

${minTheirFundingMsat}
${maxTheirFundingMsat}
${perChannelMinMsat}
${perChannelMaxMsat}
${reserveTankMsat}
`;
  } else {
    return "";
  }
}

function getTeosConfig(config: SetConfig) {
  const {
    bitcoin_rpc_host,
    bitcoin_rpc_pass,
    bitcoin_rpc_port,
    bitcoin_rpc_user,
  } = userInformation(config);
  return `
# API
api_bind = "0.0.0.0"
api_port = 9814
#tor_control_port = 9051
#onion_hidden_service_port = 9814
tor_support = false

# RPC
rpc_bind = "127.0.0.1"
rpc_port = 8814

# bitcoind
btc_network = "mainnet"
btc_rpc_user = "${bitcoin_rpc_user}"
btc_rpc_password = "${bitcoin_rpc_pass}"
btc_rpc_connect = "${bitcoin_rpc_host}"
btc_rpc_port = ${bitcoin_rpc_port}

# Flags
debug = false
deps_debug = false
overwrite_key = false

# General
subscription_slots = 10000
subscription_duration = 4320
expiry_delta = 6
min_to_self_delay = 20
polling_delta = 60

# Internal API
internal_api_bind = "127.0.0.1"
internal_api_port = 50051
`;
}

function configMaker(alias: Alias, config: SetConfig) {
  const {
    bitcoin_rpc_host,
    bitcoin_rpc_pass,
    bitcoin_rpc_port,
    bitcoin_rpc_user,
  } = userInformation(config);
  const enableWumbo = config.advanced["wumbo-channels"] ? "large-channels" : "";
  const minHtlcMsat =
    config.advanced["htlc-minimum-msat"] !== null
      ? `htlc-minimum-msat=${config.advanced["htlc-minimum-msat"]}`
      : "";
  const maxHtlcMsat =
    config.advanced["htlc-maximum-msat"] !== null
      ? `htlc-maximum-msat=${config.advanced["htlc-maximum-msat"]}`
      : "";
  const enableExperimentalDualFund = getDualFundConfig(config);
  const enableExperimentalShutdownWrongFunding = config.advanced.experimental[
    "shutdown-wrong-funding"
  ]
    ? "experimental-shutdown-wrong-funding"
    : "";
  const enableSlingPlugin = config.advanced.plugins.sling
    ? "plugin=//usr/local/libexec/c-lightning/plugins/sling/sling"
    : "";
  const enableRestPlugin = config.advanced.plugins.rest
    ? "plugin=/usr/local/libexec/c-lightning/plugins/c-lightning-REST/clrest.js\nrest-port=3001\nrest-protocol=https\n"
    : "";
  const enableCLNRestPlugin = config.advanced.plugins.clnrest
    ? "clnrest-port=3010\nclnrest-host=0.0.0.0\n"
    : "";
  const enableClamsRemoteWebsocket = config.advanced["clams-remote-websocket"]
    ? "bind-addr=ws::7272\n"
    : "";
  const enableClbossPlugin =
    config.advanced.plugins.clboss.enabled === "enabled"
      ? "plugin=/usr/local/libexec/c-lightning/plugins/clboss"
      : "";
  const enableWatchtowerClientPlugin = config.watchtowers["wt-client"].enabled === "enabled"
    ? "plugin=/usr/local/libexec/c-lightning/plugins/watchtower-client"
    : "";
  const enableSplicing = config.advanced.experimental.splicing
    ? "experimental-splicing"
    : "";

  return `
network=bitcoin
bitcoin-rpcuser=${bitcoin_rpc_user}
bitcoin-rpcpassword=${bitcoin_rpc_pass}
bitcoin-rpcconnect=${bitcoin_rpc_host}
bitcoin-rpcport=${bitcoin_rpc_port}

bind-addr=0.0.0.0:9735
announce-addr=${config["peer-tor-address"]}:9735
proxy={proxy}
always-use-proxy=${config.advanced["tor-only"]}

alias=${alias}
rgb=${config.color}

fee-base=${config.advanced["fee-base"]}
fee-per-satoshi=${config.advanced["fee-rate"]}
min-capacity-sat=${config.advanced["min-capacity"]}
ignore-fee-limits=${config.advanced["ignore-fee-limits"]}
funding-confirms=${config.advanced["funding-confirms"]}
cltv-delta=${config.advanced["cltv-delta"]}
${minHtlcMsat}
${maxHtlcMsat}
${enableWumbo}
${enableExperimentalDualFund}
experimental-onion-messages
experimental-offers
${enableExperimentalShutdownWrongFunding}
bind-addr=ws::4269
grpc-port=2106
${enableClamsRemoteWebsocket}
${enableSlingPlugin}
${enableRestPlugin}
${enableCLNRestPlugin}
${enableClbossPlugin}
${enableWatchtowerClientPlugin}
${enableSplicing}

autoclean-cycle=${config.autoclean["autoclean-cycle"]}
autoclean-succeededforwards-age=${config.autoclean["autoclean-succeededforwards-age"]}
autoclean-failedforwards-age=${config.autoclean["autoclean-failedforwards-age"]}
autoclean-succeededpays-age=${config.autoclean["autoclean-succeededpays-age"]}
autoclean-failedpays-age=${config.autoclean["autoclean-failedpays-age"]}
autoclean-paidinvoices-age=${config.autoclean["autoclean-paidinvoices-age"]}
autoclean-expiredinvoices-age=${config.autoclean["autoclean-expiredinvoices-age"]}
`;
}
const validURI = /^([a-fA-F0-9]{66}@)([^:]+?)(:\d{1,5})?$/m;
export const setConfig: T.ExpectedExports.setConfig = async (
  effects: T.Effects,
  input: T.Config
) => {
  let config = setConfigMatcher.unsafeCast(input);
  try {
    if (config.watchtowers["wt-client"].enabled == "enabled") {
      const _watchTowers = config
        .watchtowers["wt-client"]["add-watchtowers"]
        .map((x) => {
          const matched = x.match(validURI);
          if (matched === null) {
            throw `Invalid watchtower URI: ${x} doesn't match the form pubkey@host:port`;
          }
          if (matched[3] == null) {
            return `${matched[1]}${matched[2]}:9814`;
          }
          return x;
        });
      config = {
        ...config,
        watchtowers: {
          ...config.watchtowers,
        },
      };
    }
  } catch (e) {
    return util.error(e);
  }

  const error = checkConfigRules(config);
  if (error) return error;
  const alias = await getAlias(effects, config);

  await effects.createDir({
    path: "start9",
    volumeId: "main",
  });

  await effects.writeFile({
    path: "config.main",
    toWrite: configMaker(alias, config),
    volumeId: "main",
  });

  await effects.createDir({
    path: ".teos",
    volumeId: "main",
  });

  await effects.writeFile({
    path: ".teos/teos.toml",
    toWrite: getTeosConfig(config),
    volumeId: "main",
  });

  await createWaitForService(effects, config);
  return await compat.setConfig(effects, config);
};
