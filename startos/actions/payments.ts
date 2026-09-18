export const sats = (msat: number | undefined) =>
  msat === undefined ? '' : String(Math.floor(msat / 1000))

// lightning-cli reports an RPC error as a JSON object on stdout, exit code 1, sometimes after `# …` progress lines.
export const errorMessage = (res: { stdout: unknown; stderr: unknown }) => {
  const raw = String(res.stdout || res.stderr).trim()
  try {
    return String(JSON.parse(raw.slice(raw.indexOf('{'))).message ?? raw)
  } catch {
    return raw || 'unknown'
  }
}

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
  masked: false,
  type: 'single' as const,
  value,
})
