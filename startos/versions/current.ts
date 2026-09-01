import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.7:2',
  releaseNotes: {
    en_US: `Core Lightning is now installed from the signed release tarballs published by the Core Lightning developers.

The Docker images upstream published for 26.06.7 were built incorrectly and do not contain that release's security fixes, even though they report 26.06.7 on startup. The previous StartOS release, 26.6.7:1, was built from one of those images: a node running it reports 26.06.7 but does not have the fixes. Update as soon as you can.

Nothing about your node's configuration changes, and no action is needed beyond updating.`,
    es_ES: `Core Lightning ahora se instala desde los archivos comprimidos de versión firmados que publican los desarrolladores de Core Lightning.

Las imágenes de Docker que el proyecto original publicó para la versión 26.06.7 se compilaron incorrectamente y no contienen las correcciones de seguridad de esa versión, aunque indiquen 26.06.7 al arrancar. La versión anterior de StartOS, 26.6.7:1, se construyó a partir de una de esas imágenes: un nodo que la ejecuta indica 26.06.7 pero no tiene las correcciones. Actualiza cuanto antes.

La configuración de tu nodo no cambia y no hay que hacer nada más que actualizar.`,
    de_DE: `Core Lightning wird jetzt aus den signierten Release-Archiven der Core-Lightning-Entwickler installiert.

Die vom Upstream-Projekt für 26.06.7 veröffentlichten Docker-Images wurden fehlerhaft erstellt und enthalten die Sicherheitskorrekturen dieser Version nicht, obwohl sie beim Start 26.06.7 melden. Die vorherige StartOS-Version, 26.6.7:1, wurde aus einem dieser Images gebaut: Ein Node, der sie ausführt, meldet 26.06.7, hat die Korrekturen aber nicht. Aktualisieren Sie so bald wie möglich.

An der Konfiguration Ihres Nodes ändert sich nichts, und außer dem Update ist nichts zu tun.`,
    pl_PL: `Core Lightning jest teraz instalowany z podpisanych archiwów wydania publikowanych przez twórców Core Lightning.

Obrazy Dockera opublikowane przez projekt źródłowy dla wersji 26.06.7 zostały zbudowane niepoprawnie i nie zawierają poprawek bezpieczeństwa z tego wydania, mimo że przy uruchomieniu podają 26.06.7. Poprzednie wydanie StartOS, 26.6.7:1, powstało na bazie jednego z tych obrazów: węzeł, który je uruchamia, podaje 26.06.7, ale nie ma poprawek. Zaktualizuj jak najszybciej.

Konfiguracja twojego węzła się nie zmienia i poza aktualizacją nie trzeba nic robić.`,
    fr_FR: `Core Lightning est désormais installé à partir des archives de version signées publiées par les développeurs de Core Lightning.

Les images Docker publiées en amont pour la version 26.06.7 ont été construites de façon incorrecte et ne contiennent pas les correctifs de sécurité de cette version, bien qu'elles annoncent 26.06.7 au démarrage. La version précédente de StartOS, 26.6.7:1, a été construite à partir de l'une de ces images : un nœud qui l'exécute annonce 26.06.7 mais n'a pas les correctifs. Mettez à jour dès que possible.

La configuration de votre nœud ne change pas et rien d'autre que la mise à jour n'est nécessaire.`,
  },
  migrations: {},
})
