export const sats = (msat: number | undefined) =>
  msat === undefined ? '' : String(Math.floor(msat / 1000))

export const literal = (text: string) => text.replace(/\$/g, '$$$$')

export function cliJson<T>(stdout: unknown): T | null {
  if (typeof stdout !== 'string') return null
  try {
    return JSON.parse(stdout.slice(stdout.indexOf('{'))) as T
  } catch {
    return null
  }
}

// lightning-cli reports an RPC error as a JSON object on stdout, exit code 1, sometimes after `# …` progress lines.
export const errorMessage = (res: { stdout: unknown; stderr: unknown }) => {
  const raw = String(res.stdout || res.stderr).trim()
  const parsed = cliJson<{ message?: unknown }>(raw)
  return parsed?.message ? String(parsed.message) : raw || 'unknown'
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
