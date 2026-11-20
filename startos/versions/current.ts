import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.10:8',
  releaseNotes: {
    en_US: `**Security**

- The CLNrest address no longer carries a rune. To connect a wallet such as Zeus over CLNrest, use the new **Show CLNrest Connection** action. A wallet you already connected with the CLNrest address keeps working; to connect it again, use that action, since the address alone no longer signs it in.`,
    es_ES: `**Seguridad**

- La dirección CLNrest ya no lleva una runa. Para conectar una billetera como Zeus por CLNrest, use la nueva acción **Mostrar conexión CLNrest**. Una billetera que ya conectó con la dirección CLNrest sigue funcionando; para volver a conectarla, use esa acción, porque la dirección por sí sola ya no le da acceso.`,
    de_DE: `**Sicherheit**

- Die CLNrest-Adresse enthält keine Rune mehr. Um eine Wallet wie Zeus über CLNrest zu verbinden, verwenden Sie die neue Aktion **CLNrest-Verbindung anzeigen**. Eine Wallet, die Sie bereits mit der CLNrest-Adresse verbunden haben, funktioniert weiter; um sie erneut zu verbinden, verwenden Sie diese Aktion, da die Adresse allein keinen Zugang mehr gewährt.`,
    pl_PL: `**Bezpieczeństwo**

- Adres CLNrest nie zawiera już runy. Aby połączyć portfel taki jak Zeus przez CLNrest, użyj nowej akcji **Pokaż połączenie CLNrest**. Portfel, który już połączyłeś adresem CLNrest, działa dalej; aby połączyć go ponownie, użyj tej akcji, ponieważ sam adres nie daje już dostępu.`,
    fr_FR: `**Sécurité**

- L'adresse CLNrest ne contient plus de rune. Pour connecter un portefeuille comme Zeus via CLNrest, utilisez la nouvelle action **Afficher la connexion CLNrest**. Un portefeuille déjà connecté avec l'adresse CLNrest continue de fonctionner ; pour le reconnecter, utilisez cette action, car l'adresse seule ne donne plus accès.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
