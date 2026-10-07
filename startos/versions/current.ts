import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.9:1',
  releaseNotes: {
    en_US: `Updates Core Lightning to 26.06.9, a security release from the Core Lightning developers. Upgrade as soon as you can.

Core Lightning release notes: https://github.com/ElementsProject/lightning/releases/tag/v26.06.9

- Delete Gossip Store and Resume On-chain Management ask for confirmation before running, as does Reset UI Password when a password is set.
- Display BIP-39 Seed shows the 12 words as a numbered grid.
- Create Rune, Revoke All Runes, Watchtower Info and Watchtower Client Info show the error output in a copyable field when they fail.
- The descriptions of CLBOSS, Dual Funding And Liquidity Ads, Watchtower Client and Pay Invoice's Amount list each option, and CLBOSS's minimum and maximum channel sizes show their actual defaults.
- Node Info numbers peer URIs as URI #1, URI #2 and so on, and Watchtower Settings shows the format of a tower URI.
- Bitcoin must be at least 28.4:29, 29.4:16, 30.3:16 or 31.1:16, depending on its major version. Bitcoin Knots (pre-RDTS) 29.3:29 or later also works.`,
    es_ES: `Actualiza Core Lightning a 26.06.9, una versión de seguridad de los desarrolladores de Core Lightning. Actualiza cuanto antes.

Notas de la versión de Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.9

- Eliminar gossip_store y Reanudar gestión on-chain piden confirmación antes de ejecutarse, al igual que Restablecer contraseña de la interfaz cuando hay una contraseña establecida.
- Mostrar semilla BIP-39 muestra las 12 palabras en una cuadrícula numerada.
- Crear Rune, Revocar todas las runas, Información de Watchtower e Información del cliente Watchtower muestran la salida de error en un campo copiable cuando fallan.
- Las descripciones de CLBOSS, Financiación dual y anuncios de liquidez, Cliente Watchtower y el Importe de Pagar factura enumeran cada opción, y los tamaños mínimo y máximo de canal de CLBOSS muestran sus valores predeterminados reales.
- Información del nodo numera las URI de pares como URI #1, URI #2, etc., y Configuración de Watchtower muestra el formato de la URI de una torre.
- Bitcoin debe ser al menos la versión 28.4:29, 29.4:16, 30.3:16 o 31.1:16, según su versión principal. También funciona Bitcoin Knots (pre-RDTS) 29.3:29 o posterior.`,
    de_DE: `Aktualisiert Core Lightning auf 26.06.9, eine Sicherheitsversion der Core-Lightning-Entwickler. Aktualisieren Sie so bald wie möglich.

Core-Lightning-Versionshinweise: https://github.com/ElementsProject/lightning/releases/tag/v26.06.9

- „gossip_store löschen“ und „On-Chain-Verwaltung fortsetzen“ fragen vor der Ausführung nach einer Bestätigung, ebenso „UI-Passwort zurücksetzen“, wenn ein Passwort gesetzt ist.
- „BIP-39-Seed anzeigen“ zeigt die 12 Wörter in einem nummerierten Raster.
- „Rune erstellen“, „Alle Runes widerrufen“, „Watchtower-Informationen“ und „Watchtower-Client-Informationen“ zeigen bei einem Fehler die Fehlerausgabe in einem kopierbaren Feld.
- Die Beschreibungen von CLBOSS, „Duale Finanzierung und Liquiditätsanzeigen“, Watchtower-Client und dem Betrag von „Rechnung bezahlen“ führen jede Option auf, und die minimale und maximale Kanalgröße von CLBOSS zeigen ihre tatsächlichen Standardwerte.
- „Knoteninformationen“ nummeriert Peer-URIs als URI #1, URI #2 usw., und „Watchtower-Einstellungen“ zeigt das Format einer Tower-URI.
- Bitcoin muss je nach Hauptversion mindestens 28.4:29, 29.4:16, 30.3:16 oder 31.1:16 sein. Bitcoin Knots (pre-RDTS) ab 29.3:29 funktioniert ebenfalls.`,
    pl_PL: `Aktualizuje Core Lightning do wersji 26.06.9, wydania zabezpieczeń od twórców Core Lightning. Zaktualizuj jak najszybciej.

Informacje o wydaniu Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.9

- „Usuń gossip_store” i „Wznów zarządzanie on-chain” proszą o potwierdzenie przed uruchomieniem, podobnie jak „Zresetuj hasło interfejsu”, gdy hasło jest ustawione.
- „Wyświetl ziarno BIP-39” pokazuje 12 słów w numerowanej siatce.
- „Utwórz Rune”, „Unieważnij wszystkie runy”, „Informacje o Watchtower” i „Informacje o kliencie Watchtower” pokazują komunikat błędu w polu do skopiowania, gdy się nie powiodą.
- Opisy CLBOSS, „Podwójne finansowanie i ogłoszenia o płynności”, „Klient Watchtower” i kwoty w „Zapłać fakturę” wymieniają każdą opcję, a minimalny i maksymalny rozmiar kanału CLBOSS pokazują swoje rzeczywiste wartości domyślne.
- „Informacje o węźle” numeruje URI peerów jako URI #1, URI #2 itd., a „Ustawienia Watchtower” pokazują format URI serwera.
- Bitcoin musi być co najmniej w wersji 28.4:29, 29.4:16, 30.3:16 lub 31.1:16, zależnie od wersji głównej. Działa też Bitcoin Knots (pre-RDTS) 29.3:29 lub nowszy.`,
    fr_FR: `Met à jour Core Lightning vers la version 26.06.9, une version de sécurité publiée par les développeurs de Core Lightning. Mettez à jour dès que possible.

Notes de version de Core Lightning : https://github.com/ElementsProject/lightning/releases/tag/v26.06.9

- Supprimer gossip_store et Reprendre la gestion on-chain demandent une confirmation avant de s'exécuter, tout comme Réinitialiser le mot de passe de l'interface lorsqu'un mot de passe est défini.
- Afficher la graine BIP-39 présente les 12 mots dans une grille numérotée.
- Créer un Rune, Révoquer toutes les runes, Informations Watchtower et Informations du client Watchtower affichent la sortie d'erreur dans un champ copiable en cas d'échec.
- Les descriptions de CLBOSS, de Financement dual et annonces de liquidité, de Client Watchtower et du montant de Payer une facture énumèrent chaque option, et les tailles minimale et maximale de canal de CLBOSS indiquent leurs vraies valeurs par défaut.
- Informations sur le noeud numérote les URI de pair URI #1, URI #2, etc., et Paramètres Watchtower indique le format d'une URI de tour.
- Bitcoin doit être au moins en version 28.4:29, 29.4:16, 30.3:16 ou 31.1:16, selon sa version majeure. Bitcoin Knots (pre-RDTS) 29.3:29 ou plus récent fonctionne aussi.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
