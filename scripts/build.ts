import * as esbuild from "https://deno.land/x/esbuild@v0.17.10/mod.js";
await esbuild.build({
  bundle: true,
  outfile: "./scripts/embassy.js",
  entryPoints: ["./scripts/embassy.ts"],
  format: "esm",
  target: "es2020",
});
esbuild.stop();
