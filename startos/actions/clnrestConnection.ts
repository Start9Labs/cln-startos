import { FileHelper, T } from '@start9labs/start-sdk'
import { parse } from 'dotenv'
import { clnConfig } from '../fileModels/config'
import { i18n } from '../i18n'
import { clnrestHostId, clnrestInterfaceId } from '../interfaces'
import { sdk } from '../sdk'
import { adminCommandoEnv, clnrestPort } from '../utils'

export const clnrestConnection = sdk.Action.withoutInput(
  // id
  'clnrest-connection',

  // metadata
  async ({ effects }) => ({
    name: i18n('Show CLNrest Connection'),
    description: i18n(
      "Show the CLNrest address with this node's unrestricted rune, for connecting a wallet such as Zeus.",
    ),
    warning: i18n(
      'This connection has full control of your node, funds included. Give it only to a wallet you trust.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: (await clnConfig.read((c) => c.clnrest).const(effects))
      ? 'enabled'
      : { disabled: i18n('Enable CLNrest in Plugins first.') },
  }),

  // the execution function
  async ({ effects }) => {
    const env = await FileHelper.string(adminCommandoEnv).read().once()
    const rune = env && parse(env)['LIGHTNING_RUNE']
    const addresses = await sdk.host
      .getOwn(effects, clnrestHostId, (host) => {
        const address =
          host?.bindings[clnrestPort]?.interfaces[clnrestInterfaceId]
            ?.addressInfo.nonLocal
        return (
          address?.hostnames.map((h) => ({
            name: `${h.hostname} (${h.ssl ? 'HTTPS' : 'HTTP'})`,
            url: address.toUrl(h),
          })) ?? []
        )
      })
      .once()

    if (!rune || !addresses.length)
      return {
        version: '1',
        title: i18n('CLNrest Not Ready'),
        message: i18n(
          'Start Core Lightning and wait for it to finish starting, then run this action again.',
        ),
        result: null,
      }

    return {
      version: '1',
      title: i18n('CLNrest Connection'),
      message: i18n(
        "Scan or paste one of these into your wallet. Each carries this node's unrestricted rune: anyone holding it can spend your funds. Use the clnrest+http address for Tor and a clnrest+https address on your LAN or a domain.",
      ),
      result: {
        type: 'group',
        value: addresses.map(
          ({ name, url }): T.ActionResultMember => ({
            type: 'single',
            name,
            description: null,
            value: `${url}?rune=${encodeURIComponent(rune)}`,
            copyable: true,
            masked: true,
            qr: true,
            launchable: false,
          }),
        ),
      },
    }
  },
)
