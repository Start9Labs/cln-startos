import { setTimeout as sleep } from 'node:timers/promises'
/** Published local-service contract. Contains only scoped grants authorized by the local administrator. */
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { T } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { clnrestPort } from '../utils'
import { clnConfig } from '../fileModels/config'

type Call = (
  effects: T.Effects,
  request: Record<string, unknown>,
) => Promise<any>
const enabledPath = () =>
  sdk.volumes.main.subpath('local-controller-enabled.json')
const publicationPath = () => sdk.volumes.public.subpath('swap-controller.json')
export const localControllerActionId = 'local-swap-controller'
const hex = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v)
export async function publication(
  status: any,
  profile: string,
  credential: (id: string) => Promise<any>,
  now = Date.now() / 1000,
) {
  if (status?.blocked !== false || !Array.isArray(status.reviews))
    throw Error('local_setup_unavailable')
  const credentials: Record<string, any> = {}
  for (const kind of ['incoming', 'outgoing']) {
    const matches = status.reviews.filter(
      (r: any) =>
        r.kind === kind &&
        r.phase === 'saved' &&
        r.current === true &&
        r.paused === false &&
        r.expires_at > now,
    )
    if (matches.length > 1) throw Error('local_setup_unavailable')
    if (!matches.length) continue
    const r = matches[0]
    if (!hex(r.confirmation) || r.profile !== profile)
      throw Error('local_setup_unavailable')
    const c = (await credential(r.confirmation))?.credential
    if (
      !c ||
      typeof c.rune !== 'string' ||
      !/^[A-Za-z0-9_=-]{32,8192}$/.test(c.rune) ||
      c.grant?.kind !== kind ||
      c.grant?.chain?.profile !== profile ||
      c.grant?.chain?.environment !== 'mainnet'
    )
      throw Error('local_setup_unavailable')
    credentials[kind] = c
  }
  return {
    format: 'local-swap-node-v1',
    profile,
    hostId: 'clnrest',
    internalPort: clnrestPort,
    credentials,
  }
}
export async function clearPublication() {
  await unlink(publicationPath()).catch((e: any) => {
    if (e.code !== 'ENOENT') throw e
  })
}
async function setting() {
  try {
    return JSON.parse(await readFile(enabledPath(), 'utf8'))
  } catch (e: any) {
    if (e.code === 'ENOENT') return null
    throw e
  }
}
let trustMessage = 'Local controller trust is disabled.'
export async function syncLocalController(
  effects: T.Effects,
  profile: string,
  call: Call,
) {
  try {
    const configured = await setting()
    if (!configured?.enabled) {
      trustMessage = 'Local controller trust is disabled.'
      await clearPublication()
      return
    }
    if (configured.trust === 2) {
      const state = await call(effects, {
        action: 'local-trust',
        operation: 'maintain',
      })
      trustMessage =
        state.state === 'ready'
          ? 'Trusted local controller: scoped grants renew automatically.'
          : state.state === 'waiting_for_recovery'
            ? 'Trusted local controller: preserving outstanding swap recovery.'
            : Object.values(state.roles || {}).includes('history_full')
              ? 'Automatic grants stopped: coordinator history is full. Preserve records for maintenance.'
              : state.enabled
                ? 'Trusted local controller: waiting for suitable channel liquidity.'
                : 'Local controller authority is paused. Enable trust again to resume.'
      if (!state.enabled) {
        await clearPublication()
        return
      }
    } else
      trustMessage =
        'Legacy sharing only. Enable Trust Local Swap Controller for automatic grants.'
    // Never reuse a publication after loss of current node/grant evidence.
    const value = await publication(
      await call(effects, { action: 'status' }),
      profile,
      (id) =>
        call(effects, { action: 'credential', grant_id: id, confirmed: true }),
    )
    const raw = JSON.stringify(value)
    if ((await readFile(publicationPath(), 'utf8').catch(() => '')) === raw)
      return
    await mkdir(sdk.volumes.public.subpath(''), { recursive: true })
    const tmp = publicationPath() + '.' + randomBytes(8).toString('hex')
    await writeFile(tmp, raw, { mode: 0o600, flag: 'wx' })
    await rename(tmp, publicationPath())
  } catch {
    trustMessage =
      'Local controller grants unavailable; retrying after node recovery.'
    await clearPublication()
  }
}
export function localControllerAction(profile: string, call: Call) {
  return sdk.Action.withInput(
    localControllerActionId,
    async () => ({
      name: 'Trust Local Swap Controller',
      group: 'Swap Coordinator',
      allowedStatuses: 'only-running' as const,
      visibility: 'enabled' as const,
      description:
        'Authorize the local Swap Controller once. Incoming and outgoing scoped grants are created and renewed automatically when channels have liquidity. No per-grant approval or credential copying is required.',
      warning:
        'The trusted controller can initiate swaps within automatic limits (up to 100,000 sats each). Incoming protection can close the receiving channel near a swap deadline. Disabling trust stops new use of managed grants; existing swaps retain recovery authority.',
    }),
    sdk.InputSpec.of({
      enabled: sdk.Value.toggle({
        name: 'Trust this local swap controller',
        default: false,
      }),
    }),
    async () => ({
      enabled: await setting().then(
        (s) => s?.enabled === true && s?.trust === 2,
      ),
    }),
    async ({ effects, input }) => {
      if (!input.enabled) {
        const configured = await setting()
        if (configured?.trust === 2)
          await call(effects, { action: 'local-trust', operation: 'disable' })
        await unlink(enabledPath()).catch((e: any) => {
          if (e.code !== 'ENOENT') throw e
        })
        await clearPublication()
      } else {
        await call(effects, { action: 'setup', confirmed: true })
        await call(effects, { action: 'local-trust', operation: 'enable' })
        const tmp = enabledPath() + '.' + randomBytes(8).toString('hex')
        await writeFile(tmp, '{"enabled":true,"trust":2}', {
          mode: 0o600,
          flag: 'wx',
        })
        await rename(tmp, enabledPath())
        const conf = await clnConfig.read().once()
        if (conf?.clnrest !== true)
          await clnConfig.merge(effects, { clnrest: true })
        await sdk.restart(effects)
      }
      return {
        version: '1' as const,
        title: 'Local Controller Trust',
        message: input.enabled
          ? 'Local controller trusted. The node restarts to activate its coordinator. Scoped grants are created and renewed automatically when suitable channels are available. No individual grant approvals are needed.'
          : 'Local controller trust disabled. Automatically managed grants are paused for new swaps; existing swaps retain recovery authority.',
        result: {
          type: 'single' as const,
          value: input.enabled ? 'Trusted' : 'Disabled',
          copyable: false,
          masked: false,
          qr: false,
          launchable: false,
        },
      }
    },
  )
}

export function publicationDaemon(
  effects: T.Effects,
  profile: string,
  call: Call,
) {
  return {
    subcontainer: null,
    requires: ['lightningd' as const],
    exec: {
      fn: async (_sub: null, abort: AbortSignal) => {
        while (!abort.aborted) {
          await syncLocalController(effects, profile, call)
          try {
            await sleep(30000, undefined, { signal: abort })
          } catch {
            break
          }
        }
        return null
      },
    },
    ready: {
      display: 'Local Controller Trust',
      fn: () => ({ result: 'success' as const, message: trustMessage }),
    },
  }
}
