export const alertInstall = {
  en_US:
    'READ CAREFULLY! Core Lightning and the Lightning Network are considered beta software. Please use with caution and do not risk more money than you are willing to lose. We encourage frequent backups. If for any reason, you need to restore CLN from a backup, your on-chain wallet will be restored, but the money locked up in your channels will be stuck in those channels for an indeterminate period of time, if they are returned to you at all. It depends on the cooperation of your peers. Choose peers with discretion.',
  es_ES:
    '¡LEA ATENTAMENTE! Core Lightning y Lightning Network se consideran software beta. Utilícelos con precaución y no arriesgue más dinero del que esté dispuesto a perder. Recomendamos copias de seguridad frecuentes. Si por cualquier motivo necesita restaurar CLN desde una copia de seguridad, su billetera on-chain se restaurará, pero el dinero bloqueado en sus canales quedará atrapado en esos canales por un período de tiempo indeterminado, si es que se le devuelve. Depende de la cooperación de sus pares. Elija pares con discreción.',
  de_DE:
    'SORGFÄLTIG LESEN! Core Lightning und das Lightning-Netzwerk gelten als Beta-Software. Bitte verwenden Sie sie mit Vorsicht und riskieren Sie nicht mehr Geld, als Sie bereit sind zu verlieren. Wir empfehlen häufige Backups. Falls Sie CLN aus einem Backup wiederherstellen müssen, wird Ihre On-Chain-Wallet wiederhergestellt, aber das in Ihren Kanälen gesperrte Geld bleibt für einen unbestimmten Zeitraum in diesen Kanälen stecken, falls es überhaupt zurückgegeben wird. Es hängt von der Kooperation Ihrer Peers ab. Wählen Sie Peers mit Bedacht.',
  pl_PL:
    'PRZECZYTAJ UWAŻNIE! Core Lightning i Lightning Network są uważane za oprogramowanie w wersji beta. Używaj ostrożnie i nie ryzykuj więcej pieniędzy niż jesteś gotów stracić. Zachęcamy do częstych kopii zapasowych. Jeśli z jakiegokolwiek powodu będziesz musiał przywrócić CLN z kopii zapasowej, Twój portfel on-chain zostanie przywrócony, ale pieniądze zablokowane w Twoich kanałach pozostaną w tych kanałach przez nieokreślony czas, jeśli w ogóle zostaną Ci zwrócone. Zależy to od współpracy Twoich peerów. Wybieraj peerów z rozwagą.',
  fr_FR:
    "LISEZ ATTENTIVEMENT ! Core Lightning et le Lightning Network sont considérés comme des logiciels bêta. Veuillez les utiliser avec prudence et ne risquez pas plus d'argent que vous n'êtes prêt à perdre. Nous encourageons les sauvegardes fréquentes. Si pour une raison quelconque vous devez restaurer CLN à partir d'une sauvegarde, votre portefeuille on-chain sera restauré, mais l'argent verrouillé dans vos canaux restera bloqué dans ces canaux pour une durée indéterminée, s'il vous est retourné. Cela dépend de la coopération de vos pairs. Choisissez vos pairs avec discernement.",
}

export const alertUninstall = {
  en_US:
    'READ CAREFULLY! Uninstalling Core Lightning will result in permanent loss of data, including its private keys for its on-chain wallet and all channel states. Please make a backup if you have any funds in your on-chain wallet or in any channels. Recovering from backup will restore your on-chain wallet, but due to the architecture of the Lightning Network, your channels cannot be recovered. All your channel funds will be stuck in those channels for an indeterminate period of time, and if your peers do not cooperate, they will not be recoverable at all.',
  es_ES:
    '¡LEA ATENTAMENTE! Desinstalar Core Lightning resultará en la pérdida permanente de datos, incluidas sus claves privadas para su billetera on-chain y todos los estados de los canales. Haga una copia de seguridad si tiene fondos en su billetera on-chain o en cualquier canal. La recuperación desde una copia de seguridad restaurará su billetera on-chain, pero debido a la arquitectura de Lightning Network, sus canales no se pueden recuperar. Todos los fondos de sus canales quedarán atrapados en esos canales por un período de tiempo indeterminado, y si sus pares no cooperan, no serán recuperables en absoluto.',
  de_DE:
    'SORGFÄLTIG LESEN! Die Deinstallation von Core Lightning führt zum dauerhaften Verlust von Daten, einschließlich der privaten Schlüssel für die On-Chain-Wallet und aller Kanalzustände. Bitte erstellen Sie ein Backup, wenn Sie Guthaben in Ihrer On-Chain-Wallet oder in Kanälen haben. Die Wiederherstellung aus einem Backup stellt Ihre On-Chain-Wallet wieder her, aber aufgrund der Architektur des Lightning-Netzwerks können Ihre Kanäle nicht wiederhergestellt werden. Alle Ihre Kanalgelder bleiben für einen unbestimmten Zeitraum in diesen Kanälen stecken, und wenn Ihre Peers nicht kooperieren, sind sie überhaupt nicht wiederherstellbar.',
  pl_PL:
    'PRZECZYTAJ UWAŻNIE! Odinstalowanie Core Lightning spowoduje trwałą utratę danych, w tym kluczy prywatnych portfela on-chain i wszystkich stanów kanałów. Wykonaj kopię zapasową, jeśli masz jakiekolwiek środki w portfelu on-chain lub w jakichkolwiek kanałach. Odzyskiwanie z kopii zapasowej przywróci Twój portfel on-chain, ale ze względu na architekturę Lightning Network Twoje kanały nie mogą zostać odzyskane. Wszystkie środki z Twoich kanałów pozostaną zablokowane w tych kanałach przez nieokreślony czas, a jeśli Twoi peerzy nie będą współpracować, nie będą w ogóle do odzyskania.',
  fr_FR:
    "LISEZ ATTENTIVEMENT ! La désinstallation de Core Lightning entraînera la perte permanente de données, y compris ses clés privées pour son portefeuille on-chain et tous les états des canaux. Veuillez faire une sauvegarde si vous avez des fonds dans votre portefeuille on-chain ou dans des canaux. La récupération à partir d'une sauvegarde restaurera votre portefeuille on-chain, mais en raison de l'architecture du Lightning Network, vos canaux ne peuvent pas être récupérés. Tous les fonds de vos canaux resteront bloqués dans ces canaux pour une durée indéterminée, et si vos pairs ne coopèrent pas, ils ne seront pas récupérables du tout.",
}

export const alertRestore = {
  en_US:
    'Restoring Core Lightning will overwrite its current data, including its on-chain wallet and channels. Any channels opened since the last backup will be forgotten and may linger indefinitely, and channels contained in the backup will be closed and their funds returned to your wallet, assuming your peers choose to cooperate.',
  es_ES:
    'Restaurar Core Lightning sobrescribirá sus datos actuales, incluida su billetera on-chain y canales. Cualquier canal abierto desde la última copia de seguridad será olvidado y puede permanecer indefinidamente, y los canales contenidos en la copia de seguridad se cerrarán y sus fondos se devolverán a su billetera, asumiendo que sus pares elijan cooperar.',
  de_DE:
    'Die Wiederherstellung von Core Lightning überschreibt die aktuellen Daten, einschließlich der On-Chain-Wallet und der Kanäle. Alle seit dem letzten Backup geöffneten Kanäle werden vergessen und können auf unbestimmte Zeit bestehen bleiben, und die im Backup enthaltenen Kanäle werden geschlossen und ihre Gelder an Ihre Wallet zurückgegeben, vorausgesetzt Ihre Peers kooperieren.',
  pl_PL:
    'Przywrócenie Core Lightning nadpisze jego bieżące dane, w tym portfel on-chain i kanały. Wszelkie kanały otwarte od ostatniej kopii zapasowej zostaną zapomniane i mogą pozostać na czas nieokreślony, a kanały zawarte w kopii zapasowej zostaną zamknięte, a ich środki zwrócone do Twojego portfela, zakładając że Twoi peerzy zdecydują się współpracować.',
  fr_FR:
    'La restauration de Core Lightning écrasera ses données actuelles, y compris son portefeuille on-chain et ses canaux. Tout canal ouvert depuis la dernière sauvegarde sera oublié et pourra persister indéfiniment, et les canaux contenus dans la sauvegarde seront fermés et leurs fonds retournés à votre portefeuille, en supposant que vos pairs choisissent de coopérer.',
}

export const short = {
  en_US: 'An implementation of the Lightning Network protocol by Blockstream.',
  es_ES:
    'Una implementación del protocolo de Lightning Network por Blockstream.',
  de_DE:
    'Eine Implementierung des Lightning-Netzwerk-Protokolls von Blockstream.',
  pl_PL: 'Implementacja protokołu Lightning Network przez Blockstream.',
  fr_FR: 'Une implémentation du protocole Lightning Network par Blockstream.',
}

export const long = {
  en_US:
    'Core Lightning (CLN) (formerly c-lightning) is a lightweight, highly customizable, and standards compliant implementation of the Lightning Network protocol. It is optimized for performance and extensibility.',
  es_ES:
    'Core Lightning (CLN) (anteriormente c-lightning) es una implementación ligera, altamente personalizable y compatible con los estándares del protocolo Lightning Network. Está optimizado para el rendimiento y la extensibilidad.',
  de_DE:
    'Core Lightning (CLN) (ehemals c-lightning) ist eine leichtgewichtige, hochgradig anpassbare und standardkonforme Implementierung des Lightning-Netzwerk-Protokolls. Es ist für Leistung und Erweiterbarkeit optimiert.',
  pl_PL:
    'Core Lightning (CLN) (dawniej c-lightning) to lekka, wysoce konfigurowalna i zgodna ze standardami implementacja protokołu Lightning Network. Jest zoptymalizowany pod kątem wydajności i rozszerzalności.',
  fr_FR:
    "Core Lightning (CLN) (anciennement c-lightning) est une implémentation légère, hautement personnalisable et conforme aux standards du protocole Lightning Network. Il est optimisé pour la performance et l'extensibilité.",
}

export const depBitcoindDescription = {
  en_US: 'Used to subscribe to new block events.',
  es_ES: 'Utilizado para suscribirse a eventos de nuevos bloques.',
  de_DE: 'Wird verwendet, um neue Block-Ereignisse zu abonnieren.',
  pl_PL: 'Używany do subskrybowania wydarzeń nowych bloków.',
  fr_FR: "Utilisé pour s'abonner aux événements de nouveaux blocs.",
}
