import { matches, types as T } from "../deps.ts";

const { shape, string } = matches;

const matchBitcoindConfig = shape({
  advanced: shape({
    pruning: shape({
      mode: string,
    }),
  }),
});

export const dependencies: T.ExpectedExports.dependencies = {
  bitcoind: {
    // deno-lint-ignore require-await
    async check(effects, configInput) {
      effects.info("check bitcoind");
      return { result: null };
    },
    // deno-lint-ignore require-await
    async autoConfigure(effects, configInput) {
      effects.info("autoconfigure bitcoind");
      const config = matchBitcoindConfig.unsafeCast(configInput);
      return { result: config };
    },
  },
};
