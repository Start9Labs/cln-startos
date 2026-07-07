# TODO

- Once **0.4.0 is out of beta**, delete the gRPC cert-reset block from the `up`
  migration in `startos/versions/current.ts`. It only clears the stale
  `c-lightning.startos` certs written by the beta-era `setupCerts` init
  (0.4.0-beta `25.12.1:x … 26.6:0`); by GA no install still carries them.
