import { localControllerAction, syncLocalController } from './localController'
import { T } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'

export const profile = 'btc-cln-v1'
export const directory = rootDir + '/bitcoin'
export const adminCommand = [
  '/usr/local/libexec/swap-node/package_admin.py',
  '--mainnet',
  '--network-directory',
  directory,
  '--profile',
  profile,
]
export type Call = (
  effects: T.Effects,
  request: Record<string, unknown>,
) => Promise<any>
const refuse = () =>
  new Error(
    'Coordinator request refused or reply unavailable. Inspect grant status and preserve its records. Private details withheld.',
  )
const hex = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{64}$/.test(v)
export async function executeRequest(
  request: Record<string, unknown>,
  exec: (argv: string[], options?: { input: string }) => Promise<any>,
) {
  const compatibility = await exec([
    'python3',
    '-I',
    '/usr/local/libexec/swap-compatibility.py',
  ])
  if (compatibility.exitCode !== 0)
    throw new Error(
      String(compatibility.stdout).trim() ||
        'Swap compatibility check failed; no authority was created.',
    )
  const run = async (argv: string[], options?: { input: string }) => {
    try {
      return await exec(argv, options)
    } catch {
      throw refuse()
    }
  }
  if (request.action === 'local-trust') {
    if (
      !['enable', 'maintain', 'disable'].includes(String(request.operation)) ||
      Object.keys(request).sort().join() !== 'action,operation'
    )
      throw refuse()
    const r = await run([
      'python3',
      '-I',
      '/usr/local/libexec/local-controller-trust.py',
      '--network-directory',
      directory,
      '--profile',
      profile,
      String(request.operation),
    ])
    if (r.exitCode !== 0) throw refuse()
    try {
      return JSON.parse(String(r.stdout))
    } catch {
      throw refuse()
    }
  }
  if (request.action === 'credential') {
    if (
      !hex(request.grant_id) ||
      request.confirmed !== true ||
      Object.keys(request).sort().join() !== 'action,confirmed,grant_id'
    )
      throw refuse()
    const cli = [
      '/usr/local/bin/lightning-cli',
      '--lightning-dir=' + rootDir,
      '--network=bitcoin',
      '--json',
      '--notifications=none',
      '-k',
    ]
    const ask = async (method: string, args: string[]) => {
      const r = await run([...cli, method, ...args])
      if (r.exitCode !== 0) throw refuse()
      try {
        return JSON.parse(String(r.stdout))
      } catch {
        throw refuse()
      }
    }
    const credential = await ask('swap-customer-credential', [
      'grant_id=' + request.grant_id,
      'confirmed=true',
    ])
    const info = await ask('swap-customer-call', [
      'grant_id=' + request.grant_id,
      'operation=info',
      'body={}',
    ])
    if (
      typeof credential?.rune !== 'string' ||
      !/^[A-Za-z0-9_=-]{32,8192}$/.test(credential.rune) ||
      info?.regtest_only !== false ||
      info?.grant?.chain?.profile !== profile ||
      info?.grant?.chain?.environment !== 'mainnet'
    )
      throw refuse()
    return { credential: { grant: info.grant, rune: credential.rune } }
  }
  if (request.action === 'setup') {
    if (
      request.confirmed !== true ||
      Object.keys(request).sort().join() !== 'action,confirmed'
    )
      throw refuse()
    const r = await run(
      [
        '/usr/local/libexec/swap-node/package_node.py',
        '--mainnet',
        '--root',
        rootDir,
        '--profile',
        profile,
        'prepare',
      ],
      { input: JSON.stringify({ confirmed: true }) },
    )
    if (r.exitCode !== 0) throw refuse()
    try {
      return JSON.parse(String(r.stdout))
    } catch {
      throw refuse()
    }
  }
  const r = await run(adminCommand, { input: JSON.stringify(request) })
  if (r.exitCode !== 0) throw refuse()
  try {
    return JSON.parse(String(r.stdout))
  } catch {
    throw refuse()
  }
}
export const rawInvoke: Call = async (effects, request) =>
  sdk.SubContainer.withTemp(
    effects,
    { imageId: 'lightning' },
    mainMounts,
    'migrated-grant-action',
    (sub) =>
      executeRequest(request, (argv, options) => sub.exec(argv, options)),
  )
export const invoke: Call = async (effects, request) => {
  const result = await rawInvoke(effects, request)
  if (['confirm', 'pause', 'credential'].includes(String(request.action)))
    await syncLocalController(effects, profile, rawInvoke)
  return result
}
export function display(report: any): T.ActionResult & { version: '1' } {
  if (!report || typeof report !== 'object') throw refuse()
  const rows: any[] = []
  const add = (name: string, value: string, copyable = false, masked = false) =>
    rows.push({
      name,
      value,
      copyable,
      masked,
      type: 'single',
      description: null,
      qr: false,
    })
  if (report.credential) {
    const c = report.credential
    if (
      typeof c.rune !== 'string' ||
      !c.grant ||
      c.grant.chain?.profile !== profile ||
      c.grant.chain?.environment !== 'mainnet'
    )
      throw refuse()
    add(
      'Bounded controller credential',
      JSON.stringify({ grant: c.grant, rune: c.rune }),
      true,
      true,
    )
  }
  const records = Array.isArray(report.reviews) ? report.reviews : [report]
  for (const r of records) {
    if (hex(r?.confirmation)) add('Grant confirmation', r.confirmation, true)
    if (['incoming', 'outgoing'].includes(r?.kind)) add('Role', r.kind)
    if (['review', 'intent', 'saved', 'cancelled'].includes(r?.phase))
      add('Phase', r.phase)
    for (const k of [
      'blocked',
      'current',
      'paused',
      'initialized',
      'restart_required',
      'existing_records',
      'recovery_preserved',
    ])
      if (typeof r?.[k] === 'boolean') add(k, String(r[k]))
    if (
      Number.isSafeInteger(r?.channel_count) &&
      r.channel_count >= 0 &&
      r.channel_count <= 8
    )
      add('Automatically selected channels', String(r.channel_count))
    for (const k of [
      'max_swaps',
      'max_amount_msat',
      'total_amount_msat',
      'max_fee_msat',
      'max_delay_blocks',
      'max_hops',
      'min_cltv_delta',
      'max_cltv_delta',
      'close_before_blocks',
    ]) {
      if (Number.isSafeInteger(r?.limits?.[k]) && r.limits[k] >= 0)
        add(k, String(r.limits[k]))
    }
    for (const k of ['expires_at', 'confirm_before'])
      if (Number.isSafeInteger(r?.[k]) && r[k] >= 0 && r[k] <= 2 ** 35)
        add(k + ' (UTC)', new Date(r[k] * 1000).toISOString())
  }
  return {
    version: '1',
    title: 'Coordinator Grant',
    message:
      report.restart_required === true
        ? 'Coordinator state is ready. Restart this node, then review and confirm bounded grants.'
        : 'Review the automatically selected channels and bounded amounts, then confirm the exact grant. Existing swap records remain recoverable.',
    result: { type: 'group', value: rows },
  }
}
export function createActions(base = sdk.Actions.of()) {
  return base.addAction(localControllerAction(profile, rawInvoke)).addAction(
    sdk.Action.withInput(
      'swap-controller-status',
      async () => ({
        name: 'Swap Controller Status',
        group: 'Swap Coordinator',
        allowedStatuses: 'only-running' as const,
        visibility: 'enabled' as const,
        description: 'Inspect scoped authority without showing credentials.',
      }),
      sdk.InputSpec.of({}),
      async () => ({}),
      async ({ effects }) =>
        display(await rawInvoke(effects, { action: 'status' })),
    ),
  )
}
