import { compat, matches, types as T } from "../deps.ts";

export const migration: T.ExpectedExports.migration =
  compat.migrations.fromMapping(
    {
      // 0.10.2.1: initial version
      // 0.11.1: no migration needed
      "0.11.1.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (
              matches
                .shape({
                  advanced: matches.shape({
                    plugins: matches.shape({ clboss: matches.unknown }, [
                      "clboss",
                    ]),
                  }),
                })
                .test(config)
            ) {
              config.advanced.plugins.clboss = false;
            }
            return config;
          },
          true,
          { version: "0.11.1.1", type: "up" }
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (
              matches
                .shape({
                  advanced: matches.shape({
                    plugins: matches.shape({ clboss: matches.unknown }),
                  }),
                })
                .test(config)
            ) {
              delete config.advanced.plugins.clboss;
            }
            return config;
          },
          false,
          { version: "0.11.1.1", type: "down" }
        ),
      },
      "0.11.2": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (
              matches
                .shape({
                  advanced: matches.shape({
                    plugins: matches.shape({ clboss: matches.unknown }),
                  }),
                })
                .test(config)
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
          { version: "0.11.2", type: "up" }
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (
              matches
                .shape({
                  advanced: matches.shape({
                    plugins: matches.shape({ clboss: matches.any }),
                  }),
                })
                .test(config)
            ) {
              config.advanced.plugins.clboss =
                config.advanced.plugins.clboss.enabled === "enabled";
            }
            return config;
          },
          true,
          { version: "0.11.2", type: "down" }
        ),
      },
      "22.11.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (
              matches
                .shape({
                  advanced: matches.shape({
                    experimental: matches.shape({
                      "dual-fund": matches.unknown,
                    }),
                  }),
                })
                .test(config)
            ) {
              if (config.advanced.experimental["dual-fund"] === true) {
                config.advanced.experimental["dual-fund"] = {
                  enabled: "enabled",
                  strategy: {
                    mode: "incognito",
                    policy: { policy: "fixed" },
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
          { version: "22.11.1", type: "up" }
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (
              matches
                .shape({
                  advanced: matches.shape({
                    experimental: matches.shape({ "dual-fund": matches.any }),
                  }),
                })
                .test(config)
            ) {
              config.advanced.experimental["dual-fund"] =
                config.advanced.experimental["dual-fund"].enabled === "enabled";
            }
            return config;
          },
          true,
          { version: "22.11.1", type: "down" }
        ),
      },
      "23.02.2": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          true,
          { version: "23.02.2", type: "up" }
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "23.02.2.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          false,
          { version: "23.02.2.1", type: "up" }
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "23.02.2.2": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          false,
          { version: "23.02.2.2", type: "up" }
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "23.02.2.4": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          false,
          { version: "23.02.2.4", type: "up"},
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "23.02.2.7": {
        up: compat.migrations.updateConfig(
            (config) => {
              config["ui-password"] = generateRandomString(22);
              if (
                matches.shape({
                  advanced: matches.shape({
                    plugins: matches.shape({http: matches.any}
                    )
                  })
                }).test(config)
              ) {
                delete config.advanced.plugins.http
              }
              if (
                matches.shape({
                  advanced: matches.shape({
                    plugins: matches.any
                  })
                }).test(config)
              ) {
                config.advanced.plugins['sparko'] = {
                  enabled: true,
                  user: "sparko",
                  password: generateRandomString(22),
                }
              }
              config.watchtowers = {
                "wt-server": false,
                "wt-client": {
                  enabled: "disabled",
                  "add-watchtowers": []
                }
              }
            return config;
          },
          true,
          { version: "23.02.2.7", type: "up" },
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "23.08.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          true,
          { version: "23.08.1", type: "up"},
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "23.11": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          true,
          { version: "23.11", type: "up"},
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "23.11.2.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          false,
          { version: "23.11.2.1", type: "up"},
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (
              matches.shape({
                advanced: matches.shape({
                  plugins: matches.shape({clnrest: matches.any})
                })
              }).test(config)
            ) {
              delete config.advanced.plugins.clnrest;
            }
            if (
              matches.shape({
                autoclean: matches.any
              }).test(config)
            ) {
              delete config.autoclean;
            }
            return config;
          },
          true,
          { version: "23.11.2.1", type: "down" }
        ),
      },
      "24.02.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (matches.shape({
              advanced: matches.shape({experimental: matches.any})
            }).test(config)) {
              config.advanced.experimental.splicing = false;
            }
            if (matches.shape({
              advanced: matches.shape({plugins: matches.any})
            }).test(config)) {
              config.advanced.plugins.sling = false
            }
            return config;
          },
          true,
          { version: "24.02.1", type: "up"},
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "24.02.2.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (matches.shape({
              advanced: matches.any
            }).test(config)) {
              config.advanced["clams-remote-websocket"] = false;
            }
            return config;
          },
          true,
          { version: "24.02.2.1", type: "up"},
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (matches.shape({
              advanced: matches.shape({"clams-remote-websocket": matches.any})
            }).test(config)) {
              delete config.advanced["clams-remote-websocket"];
            }
            return config;
          },
          true,
          { version: "24.02.2.1", type: "down" }
        )
      },
      "24.11.0": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (matches.shape({
              advanced: matches.any
            }).test(config)) {
              config.advanced.experimental["xpay-handle-pay"] = false;
            }
            return config;
          },
          true,
          { version: "24.11.0", type: "up"},
        ),
        down: compat.migrations.updateConfig(
          (config) => {
            if (matches.shape({
              advanced: matches.shape({
                experimental: matches.shape({
                  "xpay-handle-pay": matches.any
                })
              })
            }).test(config)) {
              delete config.advanced.experimental["xpay-handle-pay"];
            }
            return config;
          },
          true,
          { version: "24.11.0", type: "down" }
        )
      },
      "24.11.1.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          true,
          { version: "24.11.1.1", type: "up"},
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "25.02.0": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (matches.shape({
              'rest-tor-address': matches.any,
              advanced: matches.shape({
                plugins: matches.shape({
                  rest: matches.any
                })
              })
            }).test(config)) {
              delete config['rest-tor-address']
              delete config.advanced.plugins.rest
            }
            return config;
          },
          true,
          { version: "25.02.0", type: "up"},
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "25.02.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          true,
          { version: "25.02.1", type: "up"},
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "25.02.2": {
        up: compat.migrations.updateConfig(
          (config) => {
            return config;
          },
          true,
          { version: "25.02.2", type: "up"},
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
      "25.05.0": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (matches.shape({
              advanced: matches.shape({experimental: matches.any})
            }).test(config)) {
              config.advanced.experimental.splicing = false;
            }
            return config;
          },
          true,
          { version: "25.05.0", type: "up"},
        ),
        down: () => {
          throw new Error("Cannot downgrade");
        },
      },
    },
    "25.05.0",
  );

function generateRandomString(length: number) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }

  return randomString;
}
