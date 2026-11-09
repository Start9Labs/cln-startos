import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { sdk } from '../sdk'

export const v_26_6_10_3 = VersionInfo.of({
  version: '26.6.10:3',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.1 or later. Services that depend on Core Lightning can now connect with a rune limited to invoices and payments, or through its RPC socket, gRPC or admin rune, without access to its seed; services that use the RPC socket need their own update to keep connecting.',
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. Los servicios que dependen de Core Lightning ahora pueden conectarse con una runa limitada a facturas y pagos, o a través de su socket RPC, gRPC o runa de administrador, sin acceso a su semilla; los servicios que usan el socket RPC necesitan su propia actualización para seguir conectándose.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Dienste, die von Core Lightning abhängen, können sich jetzt mit einer auf Rechnungen und Zahlungen beschränkten Rune oder über seinen RPC-Socket, gRPC oder seine Admin-Rune verbinden, ohne Zugriff auf seinen Seed; Dienste, die den RPC-Socket nutzen, benötigen ein eigenes Update, um sich weiterhin zu verbinden.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Usługi zależne od Core Lightning mogą teraz łączyć się za pomocą runy ograniczonej do faktur i płatności albo przez jego gniazdo RPC, gRPC lub runę administratora, bez dostępu do jego seeda; usługi korzystające z gniazda RPC potrzebują własnej aktualizacji, aby nadal się łączyć.',
    fr_FR:
      "Nécessite StartOS 0.4.1 ou une version ultérieure. Les services qui dépendent de Core Lightning peuvent désormais s'y connecter avec une rune limitée aux factures et aux paiements, ou via son socket RPC, gRPC ou sa rune d'administration, sans accès à sa seed ; les services qui utilisent le socket RPC ont besoin de leur propre mise à jour pour continuer à se connecter.",
  },
  migrations: {
    up: async () => {
      await rm(sdk.volumes.main.subpath('./bitcoin/lightning-rpc'), {
        force: true,
      })
    },
    down: IMPOSSIBLE,
  },
})
