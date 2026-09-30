import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { readFile, writeFile } from 'fs/promises'
import { commandoEnv } from '../utils'

export const current = VersionInfo.of({
  version: '26.6.8:3',
  releaseNotes: {
    en_US: `Updates the CLN Application web interface to 26.09, a security release from its developers. Upgrade as soon as you can.

Invoice runes created from the Connect Wallet screen now work with wallets. An invoice rune created there by an earlier version is removed during this update; create a new one from the same screen.

Large balances are shown in millions (1.25M).

CLN Application release notes: https://github.com/ElementsProject/cln-application/releases/tag/v26.09`,
    es_ES: `Actualiza la interfaz web CLN Application a 26.09, una versión de seguridad de sus desarrolladores. Actualiza cuanto antes.

Las runas de facturas creadas desde la pantalla Conectar billetera ahora funcionan con las billeteras. Una runa de facturas creada allí con una versión anterior se elimina durante esta actualización; cree una nueva desde la misma pantalla.

Los saldos grandes se muestran en millones (1.25M).

Notas de la versión de CLN Application: https://github.com/ElementsProject/cln-application/releases/tag/v26.09`,
    de_DE: `Aktualisiert die Weboberfläche CLN Application auf 26.09, eine Sicherheitsversion ihrer Entwickler. Aktualisieren Sie so bald wie möglich.

Rechnungs-Runes, die über den Bildschirm „Wallet verbinden“ erstellt werden, funktionieren jetzt mit Wallets. Eine dort mit einer früheren Version erstellte Rechnungs-Rune wird bei diesem Update entfernt; erstellen Sie auf demselben Bildschirm eine neue.

Große Guthaben werden in Millionen angezeigt (1.25M).

CLN-Application-Versionshinweise: https://github.com/ElementsProject/cln-application/releases/tag/v26.09`,
    pl_PL: `Aktualizuje interfejs webowy CLN Application do wersji 26.09, wydania zabezpieczeń od jego twórców. Zaktualizuj jak najszybciej.

Runy faktur utworzone na ekranie Połącz portfel działają teraz z portfelami. Runa faktur utworzona tam we wcześniejszej wersji jest usuwana podczas tej aktualizacji; utwórz nową na tym samym ekranie.

Duże salda są wyświetlane w milionach (1.25M).

Informacje o wydaniu CLN Application: https://github.com/ElementsProject/cln-application/releases/tag/v26.09`,
    fr_FR: `Met à jour l'interface web CLN Application vers la version 26.09, une version de sécurité publiée par ses développeurs. Mettez à jour dès que possible.

Les runes de facture créées depuis l'écran Connecter un portefeuille fonctionnent désormais avec les portefeuilles. Une rune de facture créée à cet endroit avec une version antérieure est supprimée lors de cette mise à jour ; créez-en une nouvelle depuis le même écran.

Les soldes importants sont affichés en millions (1.25M).

Notes de version de CLN Application : https://github.com/ElementsProject/cln-application/releases/tag/v26.09`,
  },
  migrations: {
    up: async () => {
      const env = await readFile(commandoEnv, 'utf-8').catch(() => null)
      if (env === null) return
      await writeFile(commandoEnv, env.replace(/^INVOICE_RUNE=.*\n?/m, ''))
    },
    down: IMPOSSIBLE,
  },
})
