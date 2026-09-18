import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { vpnIface } from '../vpn'

export const vpnConfFile = FileHelper.string({
  base: sdk.volumes.main,
  subpath: `/vpn/${vpnIface}.conf`,
})
