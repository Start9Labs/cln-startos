import { matches, types as T } from "../deps.ts";

const { shape, string } = matches;

const matchOldBitcoindConfig = shape({
  rpc: shape({
    advanced: shape({
      serialversion: matches.any
    }),
  }),
  advanced: shape({
    pruning: shape({
      mode: string,
    }),
  }),
})

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
      if (matchOldBitcoindConfig.test(configInput)) {
        effects.info('bitcoin core config <=24.0.1')
        if (configInput.advanced.pruning.mode !== "disabled"){
          const error = 'Pruning must be disabled to use CLN with <= 24.0.1 of Bitcoin Core. To use CLN with a pruned node, update Bitcoin Core to >= 25.0.0~2.'
          effects.error(`throwing error: ${error}`);
          return {
            error
          }
        }
        effects.info('node is not pruned')
        return { result: null }
      }
      return { result: null };
    },
    // deno-lint-ignore require-await
    async autoConfigure(effects, configInput) {
      effects.info("autoconfigure bitcoind");
      return { result: configInput };
    },
  },
};
