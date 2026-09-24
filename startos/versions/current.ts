import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.8:0',
  releaseNotes: {
    en_US: `Updates Core Lightning to 26.06.8, a security release from the Core Lightning developers. Upgrade as soon as you can.

The bundled Bitcoin Core RPC client (\`bitcoin-cli\`) is updated to 31.1.

Core Lightning release notes: https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
    es_ES: `Actualiza Core Lightning a 26.06.8, una versión de seguridad de los desarrolladores de Core Lightning. Actualiza cuanto antes.

Se actualizó el cliente RPC de Bitcoin Core incluido (\`bitcoin-cli\`) a la versión 31.1.

Notas de la versión de Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
    de_DE: `Aktualisiert Core Lightning auf 26.06.8, eine Sicherheitsversion der Core-Lightning-Entwickler. Aktualisieren Sie so bald wie möglich.

Der mitgelieferte Bitcoin-Core-RPC-Client (\`bitcoin-cli\`) wurde auf Version 31.1 aktualisiert.

Core-Lightning-Versionshinweise: https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
    pl_PL: `Aktualizuje Core Lightning do wersji 26.06.8, wydania zabezpieczeń od twórców Core Lightning. Zaktualizuj jak najszybciej.

Dołączony klient RPC Bitcoin Core (\`bitcoin-cli\`) został zaktualizowany do wersji 31.1.

Informacje o wydaniu Core Lightning: https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
    fr_FR: `Met à jour Core Lightning vers la version 26.06.8, une version de sécurité publiée par les développeurs de Core Lightning. Mettez à jour dès que possible.

Le client RPC Bitcoin Core inclus (\`bitcoin-cli\`) a été mis à jour vers la version 31.1.

Notes de version de Core Lightning : https://github.com/ElementsProject/lightning/releases/tag/v26.06.8`,
  },
  migrations: {},
})
