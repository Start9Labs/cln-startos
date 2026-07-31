import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:5',
  releaseNotes: {
    en_US: `Adds a Custom External Host setting for announcing a tunnel or VPN endpoint, and renames "Other Config Options" to "General Settings".

Enter an external endpoint — a Tunnelsats address, for example — and Core Lightning announces it in place of any public IP address StartOS detects, so peers are not handed the home IP the tunnel exists to hide. Your Tor address is still announced. The endpoint is not announced while Tor Only is enabled, because Core Lightning cannot resolve a hostname with every connection forced through the proxy.`,
    es_ES: `Añade un ajuste Host Externo Personalizado para anunciar un túnel o punto final VPN, y renombra «Otras opciones de configuración» a «Configuración general».

Introduzca un punto final externo — una dirección de Tunnelsats, por ejemplo — y Core Lightning lo anunciará en lugar de cualquier dirección IP pública que StartOS detecte, de modo que los pares no reciben la IP doméstica que el túnel existe para ocultar. Su dirección Tor se sigue anunciando. El punto final no se anuncia mientras Solo Tor esté activado, porque Core Lightning no puede resolver un nombre de host con todas las conexiones forzadas a través del proxy.`,
    de_DE: `Fügt die Einstellung „Benutzerdefinierter externer Host“ hinzu, um einen Tunnel- oder VPN-Endpunkt bekannt zu geben, und benennt „Weitere Konfigurationsoptionen“ in „Allgemeine Einstellungen“ um.

Geben Sie einen externen Endpunkt an — etwa eine Tunnelsats-Adresse — und Core Lightning gibt ihn anstelle jeder von StartOS erkannten öffentlichen IP-Adresse bekannt, sodass Peers nicht die Heim-IP erhalten, die der Tunnel verbergen soll. Ihre Tor-Adresse wird weiterhin bekannt gegeben. Solange „Nur Tor“ aktiviert ist, wird der Endpunkt nicht bekannt gegeben, denn Core Lightning kann keinen Hostnamen auflösen, wenn jede Verbindung über den Proxy erzwungen wird.`,
    pl_PL: `Dodaje ustawienie Niestandardowy host zewnętrzny do ogłaszania tunelu lub punktu końcowego VPN oraz zmienia nazwę „Inne opcje konfiguracji” na „Ustawienia ogólne”.

Podaj zewnętrzny punkt końcowy — na przykład adres Tunnelsats — a Core Lightning ogłosi go zamiast jakiegokolwiek publicznego adresu IP wykrytego przez StartOS, więc peery nie otrzymają domowego IP, które tunel ma ukrywać. Twój adres Tor jest nadal ogłaszany. Punkt końcowy nie jest ogłaszany, gdy włączona jest opcja Tylko Tor, ponieważ Core Lightning nie może rozwiązać nazwy hosta, gdy każde połączenie jest wymuszane przez proxy.`,
    fr_FR: `Ajoute un réglage Hôte externe personnalisé pour annoncer un tunnel ou un point de terminaison VPN, et renomme « Autres options de configuration » en « Paramètres généraux ».

Saisissez un point de terminaison externe — une adresse Tunnelsats, par exemple — et Core Lightning l'annonce à la place de toute adresse IP publique détectée par StartOS, afin que les pairs ne reçoivent pas l'IP domestique que le tunnel sert à masquer. Votre adresse Tor reste annoncée. Le point de terminaison n'est pas annoncé tant que Tor uniquement est activé, car Core Lightning ne peut pas résoudre un nom d'hôte lorsque chaque connexion est forcée par le proxy.`,
  },
  migrations: {},
})
