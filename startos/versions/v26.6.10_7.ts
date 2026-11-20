import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { mkdir, rename } from 'fs/promises'
import { dirname } from 'node:path'
import { sdk } from '../sdk'
import { commandoEnv } from '../utils'

export const v_26_6_10_7 = VersionInfo.of({
  version: '26.6.10:7',
  releaseNotes: {
    en_US: `**Security**

- The CLN UI now holds a rune that allows only what the UI does. The connection its Connect Wallet screen shows carries that rune, so connect a wallet that needs full access with the CLNrest address or a rune from Create Rune.
- The rune in the CLNrest address is replaced during this update, and the address is now masked. Reconnect any wallet set up with the old CLNrest address or the CLN UI's Connect Wallet screen, and restart Ride The Lightning if it uses this node.
- Pay Invoice no longer opens for a request from another service that presets the amount, fee or confirmation.
- The unused RPC interface and its host (rpc) are removed, including any domains attached to that host.
- The CLN UI runs on Node.js 22.23.5.`,
    es_ES: `**Seguridad**

- La interfaz de CLN ahora usa una runa que solo permite lo que hace la interfaz. La conexión que muestra su pantalla Conectar billetera lleva esa runa, así que conecte una billetera que necesite acceso completo con la dirección CLNrest o con una runa de Crear runa.
- La runa de la dirección CLNrest se reemplaza durante esta actualización y la dirección ahora está oculta. Vuelva a conectar cualquier billetera configurada con la dirección CLNrest anterior o con la pantalla Conectar billetera de la interfaz de CLN, y reinicie Ride The Lightning si usa este nodo.
- Pagar factura ya no se abre para una solicitud de otro servicio que predefine el importe, la comisión o la confirmación.
- Se eliminan la interfaz RPC sin uso y su host (rpc), incluidos los dominios asociados a ese host.
- La interfaz de CLN funciona con Node.js 22.23.5.`,
    de_DE: `**Sicherheit**

- Die CLN-Oberfläche verwendet jetzt eine Rune, die nur erlaubt, was die Oberfläche tut. Die Verbindung, die ihr Bildschirm „Wallet verbinden“ anzeigt, enthält diese Rune; verbinden Sie eine Wallet, die vollen Zugriff braucht, daher über die CLNrest-Adresse oder mit einer Rune aus „Rune erstellen“.
- Die Rune in der CLNrest-Adresse wird bei diesem Update ersetzt, und die Adresse ist jetzt maskiert. Verbinden Sie jede Wallet neu, die mit der alten CLNrest-Adresse oder über den Bildschirm „Wallet verbinden“ der CLN-Oberfläche eingerichtet wurde, und starten Sie Ride The Lightning neu, wenn es diesen Knoten nutzt.
- „Rechnung bezahlen“ öffnet sich nicht mehr für eine Anfrage eines anderen Dienstes, die Betrag, Gebühr oder Bestätigung vorgibt.
- Die ungenutzte RPC-Schnittstelle und ihr Host „rpc“ werden einschließlich zugehöriger Domains entfernt.
- Die CLN-Oberfläche läuft mit Node.js 22.23.5.`,
    pl_PL: `**Bezpieczeństwo**

- Interfejs CLN używa teraz runy, która pozwala tylko na to, co robi interfejs. Połączenie pokazywane na jego ekranie Połącz portfel zawiera tę runę, więc portfel wymagający pełnego dostępu połącz przez adres CLNrest lub runą z akcji Utwórz runę.
- Runa w adresie CLNrest jest zastępowana podczas tej aktualizacji, a adres jest teraz maskowany. Połącz ponownie każdy portfel skonfigurowany ze starym adresem CLNrest lub przez ekran Połącz portfel interfejsu CLN i uruchom ponownie Ride The Lightning, jeśli korzysta z tego węzła.
- Zapłać fakturę nie otwiera się już dla żądania innej usługi, które z góry ustawia kwotę, opłatę lub potwierdzenie.
- Usunięto nieużywany interfejs RPC i jego host (rpc), w tym domeny przypisane do tego hosta.
- Interfejs CLN działa na Node.js 22.23.5.`,
    fr_FR: `**Sécurité**

- L'interface de CLN utilise désormais une rune qui n'autorise que ce que fait l'interface. La connexion qu'affiche son écran Connecter un portefeuille contient cette rune ; connectez donc un portefeuille qui a besoin d'un accès complet avec l'adresse CLNrest ou une rune de Créer une rune.
- La rune de l'adresse CLNrest est remplacée lors de cette mise à jour, et l'adresse est désormais masquée. Reconnectez tout portefeuille configuré avec l'ancienne adresse CLNrest ou depuis l'écran Connecter un portefeuille de l'interface de CLN, et redémarrez Ride The Lightning s'il utilise ce nœud.
- Payer une facture ne s'ouvre plus pour une demande d'un autre service qui préremplit le montant, les frais ou la confirmation.
- L'interface RPC inutilisée et son hôte (rpc) sont supprimés, ainsi que les domaines associés à cet hôte.
- L'interface de CLN fonctionne sous Node.js 22.23.5.`,
  },
  migrations: {
    up: async ({ effects }) => {
      await mkdir(dirname(commandoEnv), { recursive: true })
      await rename(
        '/media/startos/volumes/main/.commando-env',
        commandoEnv,
      ).catch((e) => {
        if (e.code !== 'ENOENT') throw e
      })
      await sdk.MultiHost.of(effects, 'rpc').retire()
    },
    down: IMPOSSIBLE,
  },
})
