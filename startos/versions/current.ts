import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.7:3',
  releaseNotes: {
    en_US: `Updated the bundled Bitcoin Core RPC client (\`bitcoin-cli\`) to 31.1.

This refreshes the command-line client Core Lightning uses to communicate with your Bitcoin service. See the complete Bitcoin Core release notes: https://bitcoincore.org/en/releases/`,
    es_ES: `Se actualizó el cliente RPC de Bitcoin Core incluido (\`bitcoin-cli\`) a la versión 31.1.

Esto actualiza el cliente de línea de comandos que Core Lightning utiliza para comunicarse con tu servicio Bitcoin. Consulta las notas de versión completas de Bitcoin Core: https://bitcoincore.org/en/releases/`,
    de_DE: `Der mitgelieferte Bitcoin-Core-RPC-Client (\`bitcoin-cli\`) wurde auf Version 31.1 aktualisiert.

Damit wird der Kommandozeilen-Client aktualisiert, über den Core Lightning mit Ihrem Bitcoin-Dienst kommuniziert. Die vollständigen Bitcoin-Core-Versionshinweise finden Sie unter: https://bitcoincore.org/en/releases/`,
    pl_PL: `Dołączony klient RPC Bitcoin Core (\`bitcoin-cli\`) został zaktualizowany do wersji 31.1.

Aktualizacja obejmuje klienta wiersza poleceń, którego Core Lightning używa do komunikacji z usługą Bitcoin. Pełne informacje o wydaniach Bitcoin Core: https://bitcoincore.org/en/releases/`,
    fr_FR: `Le client RPC Bitcoin Core inclus (\`bitcoin-cli\`) a été mis à jour vers la version 31.1.

Cette mise à jour concerne le client en ligne de commande que Core Lightning utilise pour communiquer avec votre service Bitcoin. Consultez les notes de version complètes de Bitcoin Core : https://bitcoincore.org/en/releases/`,
  },
  migrations: {},
})
