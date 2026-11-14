const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const ts = require('typescript')
const filename = path.resolve('startos/live/actions.ts')
const mod = new Module(filename, module)
mod.filename = filename
mod.paths = module.paths
const mocks = {
  './localController': {}, '../sdk': { sdk: {} },
  '../utils': { rootDir: '/root/.lightning', mainMounts: {} },
}
mod.require = name => name in mocks ? mocks[name] : require(name)
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename)
async function main() {
  const calls = []
  await assert.rejects(mod.exports.executeRequest({ action: 'setup', confirmed: true }, async argv => {
    calls.push(argv)
    return { exitCode: 1, stdout: 'Stock engine recovery validation pending' }
  }), /Stock engine recovery validation pending/)
  assert.equal(calls.length, 1, 'unapproved engine must not reach setup or create authority')
  assert.equal(calls[0][2], '/usr/local/libexec/swap-compatibility.py')
  console.log('PASS: compatibility refusal precedes all coordinator setup operations')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
