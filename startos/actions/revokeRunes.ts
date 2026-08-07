import { rm } from 'fs/promises'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { commandoEnv, mainMounts, rootDir } from '../utils'

export const revokeRunes = sdk.Action.withoutInput(
  // id
  'revoke-runes',

  // metadata
  async ({ effects }) => ({
    name: i18n('Revoke All Runes'),
    description: i18n(
      'Blacklists every rune this node has issued, so none of them can authenticate again. Use this if a rune may have been copied or exposed, or if an app with RPC access to this node may have created one without your knowledge.',
    ),
    warning: i18n(
      'This revokes every rune, including ones you still rely on. Any integration that authenticates with a rune loses access until you issue it a new one with Create Rune.',
    ),
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    const outcome = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'lightning' },
      mainMounts,
      'revoke-runes',
      async (subc) => {
        const shown = await subc.exec(['lightning-cli', 'showrunes'], {
          cwd: rootDir,
        })
        if (shown.exitCode !== 0)
          return { error: String(shown.stderr) } as const

        const { runes } = JSON.parse(shown.stdout as string) as {
          runes: { unique_id: string }[]
        }
        if (!runes.length) return { revoked: 0 } as const

        // blacklistrune takes a unique_id range, so one call covers every rune
        // the node has issued.
        const last = Math.max(...runes.map((r) => Number(r.unique_id)))
        const blacklisted = await subc.exec(
          ['lightning-cli', 'blacklistrune', '0', String(last)],
          { cwd: rootDir },
        )
        return blacklisted.exitCode === 0
          ? ({ revoked: runes.length } as const)
          : ({ error: String(blacklisted.stderr) } as const)
      },
    )

    if ('error' in outcome)
      return {
        version: '1',
        title: i18n('Failed to Revoke Runes'),
        message: `Error: ${outcome.error}`,
        result: null,
      }

    if (outcome.revoked) {
      // The CLN Application UI authenticates with a rune of its own, cached in
      // .commando-env and reused for as long as it is present and the node
      // pubkey matches. Blacklisting it without clearing that cache locks the
      // UI out for good, so drop the file and let the commando-config oneshot
      // mint a replacement on the way back up.
      await rm(commandoEnv, { force: true })
      await sdk.restart(effects)
    }

    return {
      version: '1',
      title: i18n('Success'),
      message: outcome.revoked
        ? i18n(
            'Every rune this node had issued is now revoked, and Core Lightning is restarting to issue the web UI a fresh one. Any other integration that used a rune needs a new one from the "Create Rune" action.',
          )
        : i18n(
            'This node has not issued any runes, so there was nothing to revoke.',
          ),
      result: null,
    }
  },
)
