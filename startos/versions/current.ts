import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.7:3',
  releaseNotes: {
    en_US: `The TunnelSats service can now route this node's clearnet traffic through its tunnel and announce the tunnel's address, by raising a prompt on Core Lightning.

New Payments actions: Pay Invoice pays a Lightning invoice from the node, and Receive Payment creates one for it to be paid.

Fixes apps that connect to Core Lightning over gRPC, such as Alby Hub, being refused with "tls: unrecognized name" on StartOS 0.4.0.2 and later. Core Lightning's gRPC certificate is valid only for the name "cln", so every gRPC app asks for that name when it connects, and StartOS refuses a name that is not one of the interface's own addresses. The gRPC port is now forwarded straight to Core Lightning, over IPv4 and IPv6, and Core Lightning still authenticates every client with its own certificates.

Updated the bundled Bitcoin Core RPC client (\`bitcoin-cli\`) to 31.1. This refreshes the command-line client Core Lightning uses to communicate with your Bitcoin service. See the complete Bitcoin Core release notes: https://bitcoincore.org/en/releases/

No action is needed beyond updating.`,
    es_ES: `El servicio TunnelSats ahora puede enrutar el tráfico clearnet de este nodo por su túnel y anunciar la dirección del túnel, mostrando un aviso en Core Lightning.

Nuevas acciones de Pagos: Pagar factura paga una factura Lightning desde el nodo, y Recibir pago crea una para que se le pague.

Corrige el rechazo con «tls: unrecognized name» que recibían las aplicaciones que se conectan a Core Lightning por gRPC, como Alby Hub, en StartOS 0.4.0.2 y versiones posteriores. El certificado gRPC de Core Lightning solo es válido para el nombre «cln», así que toda aplicación gRPC pide ese nombre al conectarse, y StartOS rechaza cualquier nombre que no sea una de las direcciones propias de la interfaz. El puerto gRPC ahora se reenvía directamente a Core Lightning, por IPv4 e IPv6, y Core Lightning sigue autenticando a cada cliente con sus propios certificados.

Se actualizó el cliente RPC de Bitcoin Core incluido (\`bitcoin-cli\`) a la versión 31.1. Esto actualiza el cliente de línea de comandos que Core Lightning utiliza para comunicarse con tu servicio Bitcoin. Consulta las notas de versión completas de Bitcoin Core: https://bitcoincore.org/en/releases/

No hay que hacer nada más que actualizar.`,
    de_DE: `Der TunnelSats-Dienst kann den Clearnet-Verkehr dieses Knotens jetzt durch seinen Tunnel leiten und die Adresse des Tunnels ankündigen, indem er eine Aufforderung in Core Lightning auslöst.

Neue Aktionen unter Zahlungen: Rechnung bezahlen bezahlt eine Lightning-Rechnung vom Knoten aus, und Zahlung empfangen erstellt eine, mit der er bezahlt werden kann.

Behebt, dass Apps, die sich per gRPC mit Core Lightning verbinden, etwa Alby Hub, unter StartOS 0.4.0.2 und neuer mit „tls: unrecognized name“ abgewiesen wurden. Das gRPC-Zertifikat von Core Lightning gilt nur für den Namen „cln“, daher fragt jede gRPC-App beim Verbinden nach diesem Namen, und StartOS weist jeden Namen ab, der keine eigene Adresse der Schnittstelle ist. Der gRPC-Port wird jetzt direkt an Core Lightning weitergeleitet, über IPv4 und IPv6, und Core Lightning authentifiziert weiterhin jeden Client mit seinen eigenen Zertifikaten.

Der mitgelieferte Bitcoin-Core-RPC-Client (\`bitcoin-cli\`) wurde auf Version 31.1 aktualisiert. Damit wird der Kommandozeilen-Client aktualisiert, über den Core Lightning mit Ihrem Bitcoin-Dienst kommuniziert. Die vollständigen Bitcoin-Core-Versionshinweise finden Sie unter: https://bitcoincore.org/en/releases/

Außer dem Update ist nichts zu tun.`,
    pl_PL: `Usługa TunnelSats może teraz kierować ruch clearnet tego węzła przez swój tunel i ogłaszać adres tunelu, wyświetlając monit w Core Lightning.

Nowe akcje w grupie Płatności: Zapłać fakturę opłaca fakturę Lightning z węzła, a Odbierz płatność tworzy fakturę do opłacenia.

Naprawia odrzucanie aplikacji łączących się z Core Lightning przez gRPC, takich jak Alby Hub, z błędem „tls: unrecognized name” w StartOS 0.4.0.2 i nowszych. Certyfikat gRPC Core Lightning jest ważny tylko dla nazwy „cln”, więc każda aplikacja gRPC podaje tę nazwę przy łączeniu, a StartOS odrzuca każdą nazwę, która nie jest jednym z własnych adresów interfejsu. Port gRPC jest teraz przekazywany bezpośrednio do Core Lightning, przez IPv4 i IPv6, a Core Lightning nadal uwierzytelnia każdego klienta własnymi certyfikatami.

Dołączony klient RPC Bitcoin Core (\`bitcoin-cli\`) został zaktualizowany do wersji 31.1. Aktualizacja obejmuje klienta wiersza poleceń, którego Core Lightning używa do komunikacji z usługą Bitcoin. Pełne informacje o wydaniach Bitcoin Core: https://bitcoincore.org/en/releases/

Poza aktualizacją nie trzeba nic robić.`,
    fr_FR: `Le service TunnelSats peut désormais acheminer le trafic clearnet de ce nœud par son tunnel et annoncer l'adresse du tunnel, en affichant une invite dans Core Lightning.

Nouvelles actions Paiements : Payer une facture règle une facture Lightning depuis le nœud, et Recevoir un paiement en crée une pour qu'il soit payé.

Corrige le refus, avec « tls: unrecognized name », des applications qui se connectent à Core Lightning en gRPC, comme Alby Hub, sous StartOS 0.4.0.2 et versions ultérieures. Le certificat gRPC de Core Lightning n'est valable que pour le nom « cln », si bien que toute application gRPC demande ce nom en se connectant, et StartOS refuse tout nom qui n'est pas l'une des adresses propres de l'interface. Le port gRPC est maintenant transmis directement à Core Lightning, en IPv4 comme en IPv6, et Core Lightning continue d'authentifier chaque client avec ses propres certificats.

Le client RPC Bitcoin Core inclus (\`bitcoin-cli\`) a été mis à jour vers la version 31.1. Cette mise à jour concerne le client en ligne de commande que Core Lightning utilise pour communiquer avec votre service Bitcoin. Consultez les notes de version complètes de Bitcoin Core : https://bitcoincore.org/en/releases/

Rien d'autre que la mise à jour n'est nécessaire.`,
  },
  migrations: {},
})
