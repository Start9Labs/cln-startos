import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.7:2',
  releaseNotes: {
    en_US: `The TunnelSats service can now route this node's clearnet traffic through its tunnel and announce the tunnel's address, by raising a prompt on Core Lightning.`,
    es_ES: `El servicio TunnelSats ahora puede enrutar el tráfico clearnet de este nodo por su túnel y anunciar la dirección del túnel, mostrando un aviso en Core Lightning.`,
    de_DE: `Der TunnelSats-Dienst kann den Clearnet-Verkehr dieses Knotens jetzt durch seinen Tunnel leiten und die Adresse des Tunnels ankündigen, indem er eine Aufforderung in Core Lightning auslöst.`,
    pl_PL: `Usługa TunnelSats może teraz kierować ruch clearnet tego węzła przez swój tunel i ogłaszać adres tunelu, wyświetlając monit w Core Lightning.`,
    fr_FR: `Le service TunnelSats peut désormais acheminer le trafic clearnet de ce nœud par son tunnel et annoncer l'adresse du tunnel, en affichant une invite dans Core Lightning.`,
  },
  migrations: {},
})
