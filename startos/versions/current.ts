import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.7:3',
  releaseNotes: {
    en_US: `The TunnelSats service can now route this node's clearnet traffic through its tunnel and announce the tunnel's address, by raising a prompt on Core Lightning.

New Payments actions: Pay Invoice pays a Lightning invoice from the node, and Receive Payment creates one for it to be paid.

Updated the bundled Bitcoin Core RPC client (\`bitcoin-cli\`) to 31.1. This refreshes the command-line client Core Lightning uses to communicate with your Bitcoin service. See the complete Bitcoin Core release notes: https://bitcoincore.org/en/releases/`,
    es_ES: `El servicio TunnelSats ahora puede enrutar el tráfico clearnet de este nodo por su túnel y anunciar la dirección del túnel, mostrando un aviso en Core Lightning.

Nuevas acciones de Pagos: Pagar factura paga una factura Lightning desde el nodo, y Recibir pago crea una para que se le pague.

Se actualizó el cliente RPC de Bitcoin Core incluido (\`bitcoin-cli\`) a la versión 31.1. Esto actualiza el cliente de línea de comandos que Core Lightning utiliza para comunicarse con tu servicio Bitcoin. Consulta las notas de versión completas de Bitcoin Core: https://bitcoincore.org/en/releases/`,
    de_DE: `Der TunnelSats-Dienst kann den Clearnet-Verkehr dieses Knotens jetzt durch seinen Tunnel leiten und die Adresse des Tunnels ankündigen, indem er eine Aufforderung in Core Lightning auslöst.

Neue Aktionen unter Zahlungen: Rechnung bezahlen bezahlt eine Lightning-Rechnung vom Knoten aus, und Zahlung empfangen erstellt eine, mit der er bezahlt werden kann.

Der mitgelieferte Bitcoin-Core-RPC-Client (\`bitcoin-cli\`) wurde auf Version 31.1 aktualisiert. Damit wird der Kommandozeilen-Client aktualisiert, über den Core Lightning mit Ihrem Bitcoin-Dienst kommuniziert. Die vollständigen Bitcoin-Core-Versionshinweise finden Sie unter: https://bitcoincore.org/en/releases/`,
    pl_PL: `Usługa TunnelSats może teraz kierować ruch clearnet tego węzła przez swój tunel i ogłaszać adres tunelu, wyświetlając monit w Core Lightning.

Nowe akcje w grupie Płatności: Zapłać fakturę opłaca fakturę Lightning z węzła, a Odbierz płatność tworzy fakturę do opłacenia.

Dołączony klient RPC Bitcoin Core (\`bitcoin-cli\`) został zaktualizowany do wersji 31.1. Aktualizacja obejmuje klienta wiersza poleceń, którego Core Lightning używa do komunikacji z usługą Bitcoin. Pełne informacje o wydaniach Bitcoin Core: https://bitcoincore.org/en/releases/`,
    fr_FR: `Le service TunnelSats peut désormais acheminer le trafic clearnet de ce nœud par son tunnel et annoncer l'adresse du tunnel, en affichant une invite dans Core Lightning.

Nouvelles actions Paiements : Payer une facture règle une facture Lightning depuis le nœud, et Recevoir un paiement en crée une pour qu'il soit payé.

Le client RPC Bitcoin Core inclus (\`bitcoin-cli\`) a été mis à jour vers la version 31.1. Cette mise à jour concerne le client en ligne de commande que Core Lightning utilise pour communiquer avec votre service Bitcoin. Consultez les notes de version complètes de Bitcoin Core : https://bitcoincore.org/en/releases/`,
  },
  migrations: {},
})
