import { compat, types as T } from "../deps.ts";
import { SetConfig, setConfigMatcher } from "./getConfig.ts";
import { Alias, getAlias } from "./getAlias.ts";

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
  const enableRebalancePlugin = config.advanced.plugins.rebalance
    ? "plugin=/usr/local/libexec/c-lightning/plugins/rebalance/rebalance.py"
    : "";
  const enableSummaryPlugin = config.advanced.plugins.summary
    ? "plugin=/usr/local/libexec/c-lightning/plugins/summary/summary.py"
    : "";
  // const sparkoPassword = config.advanced.plugins.sparko.password;
  // const enableSparkoPlugin = config.advanced.plugins.sparko.enabled
  //   ? `plugin=/usr/local/libexec/c-lightning/plugins/sparko\nsparko-host=0.0.0.0\nsparko-port=9737\nsparko-login=sparko:${sparkoPassword}`
  //   : "";
  const enableRestPlugin = config.advanced.plugins.rest
    ? "plugin=/usr/local/libexec/c-lightning/plugins/c-lightning-REST/clrest.js\nrest-port=3001\nrest-protocol=https\n"
    : "";
  const enableClbossPlugin =
    config.advanced.plugins.clboss.enabled === "enabled"
      ? "plugin=/usr/local/libexec/c-lightning/plugins/clboss"
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
experimental-websocket-port=4269
${enableRebalancePlugin}
${enableSummaryPlugin}
${enableRestPlugin}
${enableClbossPlugin}`;
}

export const setConfig: T.ExpectedExports.setConfig = async (
  effects: T.Effects,
  input: T.Config
) => {
  const config = setConfigMatcher.unsafeCast(input);
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

  await createWaitForService(effects, config);
  return await compat.setConfig(effects, input);
};
