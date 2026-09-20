import { peerPort, rootDir } from './utils'

export const vpnIface = 'wg0'
export const vpnTable = 51820
export const vpnConfPath = `${rootDir}/vpn/${vpnIface}.conf`
// WireGuard rekeys about every two minutes while traffic flows.
export const handshakeStaleMs = 180_000

export type WireguardConfig = {
  privateKey: string
  address: string
  mtu: string | null
  publicKey: string
  presharedKey: string | null
  endpoint: string
  allowedIps: string
  persistentKeepalive: string
}

export type WireguardConfigError =
  | { error: 'line'; line: string }
  | { error: 'interface' | 'peer' | 'allowedIps' }

export function parseWireguardConfig(
  text: string,
): { config: WireguardConfig } | WireguardConfigError {
  const sections: Record<string, Record<string, string>>[] = []
  let current: Record<string, string> | null = null
  let peers = 0
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/[#;].*$/, '').trim()
    if (!line) continue
    const section = line.match(/^\[(\w+)\]$/)
    if (section) {
      const name = section[1].toLowerCase()
      if (name === 'peer') peers++
      current = {}
      sections.push({ [name]: current })
      continue
    }
    const kv = line.match(/^([A-Za-z]+)\s*=\s*(.+)$/)
    if (!kv || !current) return { error: 'line', line: raw.trim() }
    current[kv[1].toLowerCase()] = kv[2].trim()
  }
  const iface = sections.find((s) => s.interface)?.interface
  const peer = sections.find((s) => s.peer)?.peer
  if (!iface?.privatekey || !iface.address) return { error: 'interface' }
  if (peers !== 1 || !peer?.publickey || !peer.endpoint)
    return { error: 'peer' }
  const allowedIps = (peer.allowedips ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!allowedIps.includes('0.0.0.0/0')) return { error: 'allowedIps' }
  return {
    config: {
      privateKey: iface.privatekey,
      address: iface.address,
      mtu: iface.mtu ?? null,
      publicKey: peer.publickey,
      presharedKey: peer.presharedkey ?? null,
      endpoint: peer.endpoint,
      allowedIps: allowedIps.join(', '),
      persistentKeepalive: peer.persistentkeepalive ?? '25',
    },
  }
}

export function isHostPort(value: string): boolean {
  const m = value.match(/^(\[[0-9a-fA-F:]+\]|[A-Za-z0-9.-]+):(\d{1,5})$/)
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 65535
}

// Unmarked traffic can only leave through the tunnel's table, so a tunnel that is down drops it rather than leaking it; on-link routes (the bridge) still win via suppress_prefixlength 0.
export function renderWgQuick(c: WireguardConfig): string {
  const v6 = c.allowedIps.split(', ').includes('::/0')
    ? `ip -6 route add default dev %i table ${vpnTable}`
    : `ip -6 route add blackhole default table ${vpnTable}`
  const postUp = [
    `wg set %i fwmark ${vpnTable}`,
    `ip -4 route add default dev %i table ${vpnTable}`,
    `ip -4 rule add not fwmark ${vpnTable} table ${vpnTable}`,
    'ip -4 rule add table main suppress_prefixlength 0',
    v6,
    `ip -6 rule add not fwmark ${vpnTable} table ${vpnTable}`,
    'ip -6 rule add table main suppress_prefixlength 0',
    'sysctl -q -w net.ipv4.conf.all.src_valid_mark=1 || true',
    // Only the peer port is reachable from the tunnel; Core Lightning's other listeners are not.
    ...['iptables', 'ip6tables'].flatMap((t) => [
      `${t} -A INPUT -i %i -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT`,
      `${t} -A INPUT -i %i -p tcp --dport ${peerPort} -j ACCEPT`,
      `${t} -A INPUT -i %i -j DROP`,
    ]),
  ]
  return [
    '[Interface]',
    `PrivateKey = ${c.privateKey}`,
    `Address = ${c.address}`,
    ...(c.mtu ? [`MTU = ${c.mtu}`] : []),
    'Table = off',
    ...postUp.map((cmd) => `PostUp = ${cmd}`),
    '',
    '[Peer]',
    `PublicKey = ${c.publicKey}`,
    ...(c.presharedKey ? [`PresharedKey = ${c.presharedKey}`] : []),
    `AllowedIPs = ${c.allowedIps}`,
    `Endpoint = ${c.endpoint}`,
    `PersistentKeepalive = ${c.persistentKeepalive}`,
    '',
  ].join('\n')
}

// Teardown clears the interface, policy routes and rules, and firewall entries.
export const vpnDownScript = `
if ip link show ${vpnIface} >/dev/null 2>&1; then ip link del ${vpnIface}; fi
for t in iptables ip6tables; do
  $t -S INPUT 2>/dev/null | grep -- "-i ${vpnIface} " | sed 's/^-A /-D /' | while read -r rule; do $t $rule; done
done
for fam in -4 -6; do
  ip $fam route flush table ${vpnTable} 2>/dev/null || true
  while ip $fam rule show | grep -q "lookup ${vpnTable}"; do ip $fam rule del table ${vpnTable} || break; done
  while ip $fam rule show | grep -q "suppress_prefixlength 0"; do ip $fam rule del table main suppress_prefixlength 0 || break; done
done
`

export const vpnUpScript = `set -e
${vpnDownScript}
chmod 600 '${vpnConfPath}'
wg-quick up '${vpnConfPath}'
`
