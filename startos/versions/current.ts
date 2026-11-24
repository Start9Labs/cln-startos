import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:10',
  releaseNotes: {
    en_US: `**Added**

- Decode Invoice, under Payments: it shows an invoice's amount, destination, description, creation and expiry times, network and payment hash, and pays nothing.

**Changed**

- A payment prompt from another service shows only the invoice's amount and destination; the description appears in the result after paying.`,
    es_ES: `**Añadido**

- Decodificar factura, en Pagos: muestra el importe, el destino, la descripción, las fechas de creación y caducidad, la red y el hash de pago de una factura, sin pagar nada.

**Cambiado**

- Una solicitud de pago de otro servicio muestra solo el importe y el destino de la factura; la descripción aparece en el resultado tras pagar.`,
    de_DE: `**Hinzugefügt**

- Rechnung dekodieren, unter Zahlungen: zeigt Betrag, Ziel, Beschreibung, Erstellungs- und Ablaufzeit, Netzwerk und Zahlungs-Hash einer Rechnung und bezahlt nichts.

**Geändert**

- Eine Zahlungsaufforderung eines anderen Dienstes zeigt nur Betrag und Ziel der Rechnung; die Beschreibung erscheint nach der Zahlung im Ergebnis.`,
    pl_PL: `**Dodano**

- Dekoduj fakturę, w grupie Płatności: pokazuje kwotę, miejsce docelowe, opis, czas utworzenia i wygaśnięcia, sieć oraz hash płatności faktury i niczego nie płaci.

**Zmieniono**

- Prośba o płatność od innej usługi pokazuje tylko kwotę i miejsce docelowe faktury; opis pojawia się w wyniku po zapłacie.`,
    fr_FR: `**Ajouté**

- Décoder une facture, dans Paiements : affiche le montant, la destination, la description, les dates de création et d’expiration, le réseau et le hachage de paiement d’une facture, sans rien payer.

**Modifié**

- Une demande de paiement d’un autre service n’affiche que le montant et la destination de la facture ; la description apparaît dans le résultat après le paiement.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
