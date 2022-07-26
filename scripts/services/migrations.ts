import { compat, matches, types as T } from "../deps.ts";

export const migration: T.ExpectedExports.migration = compat.migrations
  .fromMapping(
    {
      // 0.10.2.1: initial version
      // 0.11.1: no migration needed
      "0.11.1.1": {
        up: compat.migrations.updateConfig(
          (config, effects) => {
            effects.error(`BLUJ Up 0.11.1.1 ${JSON.stringify(config)}`)
            if (
              matches.shape({
                advanced: matches.shape({ plugins: matches.any }),
              }).test(config)
            ) {
              config.advanced.plugins.clboss = false;
            }
            return config;
          },
          false, // want to kick user to needs config so they see the new clboss config option
          { version: "0.11.1.1", type: "up" },
        ),
        down: compat.migrations.updateConfig(
          (config, effects) => {
            effects.error(`BLUJ Down 0.11.1.1 ${JSON.stringify(config)}`)
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.shape({ clboss: matches.any }),
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
          (config, effects) => {
            effects.error(`BLUJ Up 0.11.2 ${JSON.stringify(config)}`)
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.shape({ clboss: matches.any }),
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
          (config, effects) => {
            effects.error(`BLUJ down 0.11.2 ${JSON.stringify(config)}`)
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.shape({ clboss: matches.any }),
                }),
              }).test(config)
            ) {
              delete config.advanced.plugins.clboss;
            }
            return config;
          },
          false,
          { version: "0.11.2", type: "down" },
        ),
      },
    },
    "0.11.2",
  );
