import { sdk } from '../sdk'
import { autoclean } from './config/autoclean'
import { experimental } from './config/experimental'
import { config } from './config/config'
import { plugins } from './config/plugins'
import { watchtower } from './watchtower/watchtower'
import { createRune } from './generateRune'
import { deleteGossipStore } from './deleteGossipStore'
import { resetPassword } from './resetPassword'
import { watchtowerInfo } from './watchtower/watchtowerInfo'
import { watchtowerClientInfo } from './watchtower/watchtowerClientInfo'
import { rescanBlockchain } from './rescanBlockchain'
import { nodeInfo } from './nodeInfo'

export const actions = sdk.Actions.of()
  .addAction(autoclean)
  .addAction(config)
  .addAction(experimental)
  .addAction(plugins)
  .addAction(watchtower)
  .addAction(createRune)
  .addAction(deleteGossipStore)
  .addAction(resetPassword)
  .addAction(watchtowerInfo)
  .addAction(watchtowerClientInfo)
  .addAction(rescanBlockchain)
  .addAction(nodeInfo)

// @TODO generate-lnlink
