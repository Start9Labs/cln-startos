import { compat, matches, types as T } from "../deps.ts";

export const migration: T.ExpectedExports.migration = compat.migrations
  .fromMapping(
    {
      // 0.10.2.1: initial version
      // 0.11.1: no migration needed
      "0.11.1.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.shape({ clboss: matches.unknown }, [
                    "clboss",
                  ]),
                }),
              }).test(config)
            ) {
              config.advanced.plugins.clboss = false;
            }
            return config;
          },
          true,
          { version: "0.11.1.1", type: "up" },
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.shape({ clboss: matches.unknown }),
                }),
              }).test(config)
            ) {
              delete config.advanced.plugins.clboss;
            }
            return config;
          },
          false,
          { version: "0.11.1.1", type: "down" },
        ),
      },
      "0.11.2": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.shape({ clboss: matches.unknown }),
                }),
              }).test(config)
            ) {
              if (config.advanced.plugins.clboss === true) {
                config.advanced.plugins.clboss = {
                  enabled: "enabled",
                  "min-onchain": null,
                  "auto-close": false,
                  zerobasefee: "default",
                  "min-channel": null,
                  "max-channel": null,
                };
              } else {
                config.advanced.plugins.clboss = { enabled: "disabled" };
              }
            }
            return config;
          },
          true,
          { version: "0.11.2", type: "up" },
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.shape({ clboss: matches.any }),
                }),
              }).test(config)
            ) {
              config.advanced.plugins.clboss =
                config.advanced.plugins.clboss.enabled === "enabled";
            }
            return config;
          },
          true,
          { version: "0.11.2", type: "down" },
        ),
      },
      "22.11.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (
              matches.shape({
                advanced: matches.shape({
                  experimental: matches.shape({ "dual-fund": matches.unknown }),
                }),
              }).test(config)
            ) {
              if (config.advanced.experimental["dual-fund"] === true) {
                config.advanced.experimental["dual-fund"] = {
                  enabled: "enabled",
                  strategy: {
                    mode: "incognito",
                    policy: { "policy": "fixed" },
                  },
                  other: {},
                };
              } else {
                config.advanced.experimental["dual-fund"] = {
                  enabled: "disabled",
                };
              }
            }
            return config;
          },
          true,
          { version: "22.11.1", type: "up" },
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (
              matches.shape({
                advanced: matches.shape({
                  experimental: matches.shape({ "dual-fund": matches.any }),
                }),
              }).test(config)
            ) {
              config.advanced.experimental["dual-fund"] =
                config.advanced.experimental["dual-fund"].enabled === "enabled";
            }
            return config;
          },
          true,
          { version: "22.11.1", type: "down" },
        ),
      },
      "23.2.0": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.any,
                }),
              }).test(config)
            ) {
              config.advanced.plugins.reckless = false;
              config.advanced.plugins.sauron = false;
              config.advanced.plugins.circular = false;
              config.advanced.plugins.sparko = false;
              config.advanced.plugins.noise = false;
              config.advanced.plugins.nostrify = false;
            }
            return config;
          },
          true,
          { version: "23.2.0", type: "up" },
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.any,
                }),
              }).test(config)
            ) {
              delete config.advanced.plugins.reckless;
              delete config.advanced.plugins.sauron;
              delete config.advanced.plugins.circular;
              delete config.advanced.plugins.sparko;
              delete config.advanced.plugins.noise;
              delete config.advanced.plugins.nostrify;
            }
            return config;
          },
          true,
          { version: "23.2.0", type: "down" },
        ),
      },
    },
    "23.2.0",
  );
