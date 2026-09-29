import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.8:3',
  releaseNotes: {
    en_US: `Clearnet Lightning traffic can no longer leave over the server's own internet connection if the TunnelSats tunnel's network interface goes away.`,
    es_ES: `El tráfico Lightning por clearnet ya no puede salir por la conexión a Internet del propio servidor si desaparece la interfaz de red del túnel de TunnelSats.`,
    de_DE: `Clearnet-Lightning-Verkehr kann den Server nicht mehr über dessen eigene Internetverbindung verlassen, wenn die Netzwerkschnittstelle des TunnelSats-Tunnels wegfällt.`,
    pl_PL: `Ruch Lightning w sieci clearnet nie może już wychodzić przez własne połączenie internetowe serwera, gdy zniknie interfejs sieciowy tunelu TunnelSats.`,
    fr_FR: `Le trafic Lightning clearnet ne peut plus sortir par la connexion Internet du serveur lui-même si l'interface réseau du tunnel TunnelSats disparaît.`,
  },
  migrations: {},
})
