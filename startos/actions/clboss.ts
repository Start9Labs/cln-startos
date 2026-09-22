import { T } from '@start9labs/start-sdk'
import { clnConfig } from '../fileModels/config'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, rootDir } from '../utils'
import { clbossPlugin } from './config/plugins'
import { cliJson, errorMessage, literal, row, sats } from './payments'

const { InputSpec, Value } = sdk

type ClbossStatus = {
  info?: { version: string }
  internet?: { connection: string }
  onchain_feerate?: { judgment: string }
  should_monitor_onchain_funds?: {
    status: 'ignore' | 'notice'
    disable_until_human: string
  }
  channel_candidates?: unknown[]
  unmanaged?: Record<string, string>
  swap_report?: {
    swaps: unknown[]
    total_amount_sent: string
    total_amount_received: string
    loss: string
    percent_loss: number
  }
}

const visibility = async (effects: T.Effects): Promise<T.ActionVisibility> =>
  (await clnConfig
    .read((c) => !!c.raw?.plugin?.includes(clbossPlugin))
    .const(effects))
    ? 'enabled'
    : { disabled: i18n('CLBOSS must be enabled in Plugins') }

const clboss = async (effects: T.Effects, args: string[]) => {
  const res = await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'lightning' },
    mainMounts,
    args[0],
    (subc) =>
      subc.exec(['lightning-cli', `--lightning-dir=${rootDir}`, '-k', ...args]),
  )
  if (res.exitCode !== 0) {
    throw new Error(
      i18n('CLBOSS refused the request: ${error}', {
        error: literal(errorMessage(res)),
      }),
    )
  }
  return res.stdout
}

const msatSats = (amount: string) => `${sats(parseInt(amount))} sats`

export const clbossStatus = sdk.Action.withoutInput(
  'clboss-status',
  async ({ effects }) => ({
    name: i18n('CLBOSS Status'),
    description: i18n(
      'Show what CLBOSS currently sees and does: connectivity, its reading of on-chain fees, whether it is managing on-chain funds, the peers you have excluded from management, and the swaps it has made.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('CLBOSS'),
    visibility: await visibility(effects),
  }),
  async ({ effects }) => {
    const status = cliJson<ClbossStatus>(
      await clboss(effects, ['clboss-status']),
    )
    if (!status) throw new Error(i18n('CLBOSS returned an unreadable status.'))
    const onchain = status.should_monitor_onchain_funds
    const unmanaged = Object.entries(status.unmanaged ?? {}).filter(
      ([id]) => id !== 'comment',
    )
    const swaps = status.swap_report

    return {
      version: '1',
      title: i18n('CLBOSS Status'),
      message: null,
      result: {
        type: 'group',
        value: [
          row(i18n('Version'), status.info?.version ?? '-', false),
          row(i18n('Internet'), status.internet?.connection ?? '-', false),
          row(
            i18n('On-chain fees'),
            status.onchain_feerate?.judgment ?? '-',
            false,
          ),
          row(
            i18n('On-chain funds'),
            onchain?.status === 'ignore'
              ? i18n('Ignored until ${time}', {
                  time: onchain.disable_until_human,
                })
              : i18n('Managed'),
            false,
          ),
          row(
            i18n('Channel candidates'),
            String(status.channel_candidates?.length ?? 0),
            false,
          ),
          {
            type: 'group',
            name: i18n('Unmanaged peers'),
            description: null,
            value: unmanaged.length
              ? unmanaged.map(([id, tags]) => row(id, tags, false))
              : [row(i18n('None'), '-', false)],
          },
          {
            type: 'group',
            name: i18n('Swaps'),
            description: null,
            value: swaps
              ? [
                  row(i18n('Count'), String(swaps.swaps.length), false),
                  row(i18n('Sent'), msatSats(swaps.total_amount_sent), false),
                  row(
                    i18n('Received'),
                    msatSats(swaps.total_amount_received),
                    false,
                  ),
                  row(
                    i18n('Lost to fees'),
                    `${msatSats(swaps.loss)} (${swaps.percent_loss.toFixed(2)}%)`,
                    false,
                  ),
                ]
              : [row(i18n('None'), '-', false)],
          },
        ],
      },
    }
  },
)

export const clbossIgnoreOnchain = sdk.Action.withInput(
  'clboss-ignore-onchain',
  async ({ effects }) => ({
    name: i18n('Ignore On-chain Funds'),
    description: i18n(
      'Stop CLBOSS from putting on-chain funds into channels of its choosing, so you can open channels or withdraw funds yourself. It keeps managing fees, rebalancing and peers, and resumes on its own when the time runs out.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('CLBOSS'),
    visibility: await visibility(effects),
  }),
  InputSpec.of({
    hours: Value.number({
      name: i18n('Duration'),
      description: null,
      required: true,
      default: 24,
      min: 1,
      integer: true,
      units: 'hours',
      placeholder: null,
    }),
  }),
  async () => ({}),
  async ({ effects, input }) => {
    await clboss(effects, ['clboss-ignore-onchain', `hours=${input.hours}`])
    return {
      version: '1',
      title: i18n('On-chain funds ignored'),
      message: i18n(
        'CLBOSS will leave on-chain funds alone for ${hours} hours, or until you run Resume On-chain Management.',
        { hours: String(input.hours) },
      ),
      result: null,
    }
  },
)

export const clbossNoticeOnchain = sdk.Action.withoutInput(
  'clboss-notice-onchain',
  async ({ effects }) => ({
    name: i18n('Resume On-chain Management'),
    description: i18n(
      'Let CLBOSS manage on-chain funds again after Ignore On-chain Funds.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('CLBOSS'),
    visibility: await visibility(effects),
  }),
  async ({ effects }) => {
    await clboss(effects, ['clboss-notice-onchain'])
    return {
      version: '1',
      title: i18n('On-chain management resumed'),
      message: i18n('CLBOSS is managing on-chain funds again.'),
      result: null,
    }
  },
)

const unmanageTags = {
  lnfee: i18n('Channel fees'),
  open: i18n('Opening channels'),
  close: i18n('Closing channels'),
  balance: i18n('Rebalancing'),
}

export const clbossUnmanage = sdk.Action.withInput(
  'clboss-unmanage',
  async ({ effects }) => ({
    name: i18n('Unmanage Peer'),
    description: i18n(
      'Stop CLBOSS from managing some or all of what it does with one peer, for example to set your own fees on a channel to a friend. CLBOSS Status lists the peers you have excluded.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('CLBOSS'),
    visibility: await visibility(effects),
  }),
  InputSpec.of({
    nodeid: Value.text({
      name: i18n('Node ID'),
      description: null,
      required: true,
      default: null,
      patterns: [
        {
          regex: '^0[23][0-9a-fA-F]{64}$',
          description: i18n('Must be a 66-character node ID.'),
        },
      ],
    }),
    tags: Value.multiselect({
      name: i18n('Stop managing'),
      description: i18n(
        'Select nothing to return the peer to full management.',
      ),
      default: [],
      values: unmanageTags,
    }),
  }),
  async () => ({}),
  async ({ effects, input }) => {
    await clboss(effects, [
      'clboss-unmanage',
      `nodeid=${JSON.stringify(input.nodeid)}`,
      `tags=${JSON.stringify(input.tags.join(','))}`,
    ])
    return {
      version: '1',
      title: i18n('Peer updated'),
      message: input.tags.length
        ? i18n('CLBOSS no longer manages ${tags} for this peer.', {
            tags: input.tags.map((t) => unmanageTags[t]).join(', '),
          })
        : i18n('CLBOSS fully manages this peer again.'),
      result: null,
    }
  },
)
