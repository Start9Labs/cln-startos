import { matches } from "../deps.ts";

const { literal, shape, number, string, some, boolean } = matches;
export const setConfigMatcher = shape(
  {
    "peer-tor-address": string,
    "rpc-tor-address": string,
    alias: string.optional(),
    color: string,
    bitcoind: some(
      shape({
        type: literal("internal"),
        user: string,
        password: string,
      }),
      shape({
        type: literal("internal-proxy"),
        user: string,
        password: string,
      }),
      shape({
        type: literal("external"),
        "connection-settings": some(
          shape({
            type: literal("manual"),
            address: string,
            user: string,
            password: string,
          }),
          shape({
            type: literal("quick-connect"),
            "quick-connect-url": string,
          })
        ),
      })
    ),
    rpc: shape({
      enabled: boolean,
      user: string,
      password: string,
    }),
    advanced: shape({
      "tor-only": boolean,
      "fee-base": number,
      "fee-rate": number,
      "min-capacity": number,
      "ignore-fee-limits": boolean,
      "funding-confirms": number,
      "cltv-delta": number,
      "wumbo-channels": boolean,
      experimental: shape({
        "dual-fund": boolean,
        "onion-messages": boolean,
        offers: boolean,
        "shutdown-wrong-funding": boolean,
      }),
      plugins: shape({
        http: boolean,
        rebalance: boolean,
        summary: boolean,
        rest: boolean,
      }),
    }),
  },
  ["alias"]
);
export type SetConfig = typeof setConfigMatcher._TYPE;
