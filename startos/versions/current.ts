import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:11',
  releaseNotes: {
    en_US: `**Fixed**

- Pay Invoice reports a payment that is still in flight as pending, with its payment hash, instead of as failed. Running it again with the same invoice shows the final result.`,
    es_ES: `**Corregido**

- Pagar factura informa como pendiente, con su hash de pago, un pago que sigue en curso, en lugar de como fallido. Volver a ejecutarla con la misma factura muestra el resultado final.`,
    de_DE: `**Behoben**

- Rechnung bezahlen meldet eine noch laufende Zahlung als ausstehend, mit ihrem Zahlungs-Hash, statt als fehlgeschlagen. Ein erneuter Aufruf mit derselben Rechnung zeigt das endgültige Ergebnis.`,
    pl_PL: `**Naprawiono**

- Zapłać fakturę zgłasza płatność, która wciąż jest w toku, jako oczekującą, z jej hashem płatności, zamiast jako nieudaną. Ponowne uruchomienie z tą samą fakturą pokazuje ostateczny wynik.`,
    fr_FR: `**Corrigé**

- Payer une facture signale un paiement encore en cours comme en attente, avec son hachage de paiement, au lieu de l’indiquer comme échoué. La relancer avec la même facture affiche le résultat final.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
