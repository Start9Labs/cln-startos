import { sdk } from '../sdk'
import { autoclean } from './config/autoclean'
import { experimental } from './config/experimental'
import { config } from './config/config'
import { plugins } from './config/plugins'
import { watchtower } from './config/watchtower'
import { createRune } from './generateRune'
import { deleteGossipStore } from './deleteGossipStore'

export const actions = sdk.Actions.of()
  .addAction(autoclean)
  .addAction(config)
  .addAction(experimental)
  .addAction(plugins)
  .addAction(watchtower)
  .addAction(createRune)
  .addAction(deleteGossipStore)

// @TODO reset-password (UI), generate-lnlink, and rescan-blockchain actions
