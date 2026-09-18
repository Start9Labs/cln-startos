import { sdk } from '../sdk'
import { experimental } from './config/experimental'
import { config } from './config/config'
import { plugins } from './config/plugins'
import { watchtower } from './watchtower/watchtower'
import { createRune } from './generateRune'
import { revokeRunes } from './revokeRunes'
import { deleteGossipStore } from './deleteGossipStore'
import { resetPassword } from './resetPassword'
import { watchtowerInfo } from './watchtower/watchtowerInfo'
import { watchtowerClientInfo } from './watchtower/watchtowerClientInfo'
import { rescanBlockchain } from './rescanBlockchain'
import { nodeInfo } from './nodeInfo'
import { displaySeed } from './displaySeed'
import { clearnetVpn } from './clearnetVpn'
import { payInvoice } from './payInvoice'
import { receivePayment } from './receivePayment'

export const actions = sdk.Actions.of()
  .addAction(config)
  .addAction(displaySeed)
  .addAction(experimental)
  .addAction(plugins)
  .addAction(watchtower)
  .addAction(createRune)
  .addAction(revokeRunes)
  .addAction(deleteGossipStore)
  .addAction(resetPassword)
  .addAction(watchtowerInfo)
  .addAction(watchtowerClientInfo)
  .addAction(rescanBlockchain)
  .addAction(nodeInfo)
  .addAction(clearnetVpn)
  .addAction(payInvoice)
  .addAction(receivePayment)

// @TODO generate-lnlink
