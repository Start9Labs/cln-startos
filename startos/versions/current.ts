import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.7:4',
  releaseNotes: {
    en_US: `Fixes apps that connect to Core Lightning over gRPC, such as Alby Hub, being refused with "tls: unrecognized name" on StartOS 0.4.0.2 and later.

Core Lightning's gRPC certificate is valid only for the name "cln", so every gRPC app asks for that name when it connects. StartOS now refuses a name that is not one of the interface's own addresses, which turned those apps away before they reached your node. The gRPC port is now forwarded straight to Core Lightning, which still authenticates every client with its own certificates.

No action is needed beyond updating.`,
    es_ES: `Corrige el rechazo con «tls: unrecognized name» que recibían las aplicaciones que se conectan a Core Lightning por gRPC, como Alby Hub, en StartOS 0.4.0.2 y versiones posteriores.

El certificado gRPC de Core Lightning solo es válido para el nombre «cln», así que toda aplicación gRPC pide ese nombre al conectarse. StartOS ahora rechaza cualquier nombre que no sea una de las direcciones propias de la interfaz, por lo que esas aplicaciones eran rechazadas antes de llegar a tu nodo. El puerto gRPC ahora se reenvía directamente a Core Lightning, que sigue autenticando a cada cliente con sus propios certificados.

No hay que hacer nada más que actualizar.`,
    de_DE: `Behebt, dass Apps, die sich per gRPC mit Core Lightning verbinden, etwa Alby Hub, unter StartOS 0.4.0.2 und neuer mit „tls: unrecognized name“ abgewiesen wurden.

Das gRPC-Zertifikat von Core Lightning gilt nur für den Namen „cln“, daher fragt jede gRPC-App beim Verbinden nach diesem Namen. StartOS weist inzwischen jeden Namen ab, der keine eigene Adresse der Schnittstelle ist, sodass diese Apps abgewiesen wurden, bevor sie Ihren Node erreichten. Der gRPC-Port wird jetzt direkt an Core Lightning weitergeleitet, das weiterhin jeden Client mit seinen eigenen Zertifikaten authentifiziert.

Außer dem Update ist nichts zu tun.`,
    pl_PL: `Naprawia odrzucanie aplikacji łączących się z Core Lightning przez gRPC, takich jak Alby Hub, z błędem „tls: unrecognized name” w StartOS 0.4.0.2 i nowszych.

Certyfikat gRPC Core Lightning jest ważny tylko dla nazwy „cln”, więc każda aplikacja gRPC podaje tę nazwę przy łączeniu. StartOS odrzuca teraz każdą nazwę, która nie jest jednym z własnych adresów interfejsu, przez co aplikacje te były odrzucane, zanim dotarły do twojego węzła. Port gRPC jest teraz przekazywany bezpośrednio do Core Lightning, który nadal uwierzytelnia każdego klienta własnymi certyfikatami.

Poza aktualizacją nie trzeba nic robić.`,
    fr_FR: `Corrige le refus, avec « tls: unrecognized name », des applications qui se connectent à Core Lightning en gRPC, comme Alby Hub, sous StartOS 0.4.0.2 et versions ultérieures.

Le certificat gRPC de Core Lightning n'est valable que pour le nom « cln », si bien que toute application gRPC demande ce nom en se connectant. StartOS refuse désormais tout nom qui n'est pas l'une des adresses propres de l'interface, ce qui écartait ces applications avant qu'elles n'atteignent votre nœud. Le port gRPC est maintenant transmis directement à Core Lightning, qui continue d'authentifier chaque client avec ses propres certificats.

Rien d'autre que la mise à jour n'est nécessaire.`,
  },
  migrations: {},
})
