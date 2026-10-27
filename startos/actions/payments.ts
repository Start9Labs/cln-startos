export const sats = (msat: number | undefined) =>
  msat === undefined ? '' : String(Math.floor(msat / 1000))

export const literal = (text: string) => text.replace(/\$/g, '$$$$')

export const row = (
  name: string,
  value: string,
  copyable: boolean,
  qr = false,
) => ({
  name,
  description: null,
  copyable,
  qr,
  launchable: false,
  masked: false,
  type: 'single' as const,
  value,
})
