import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.6.6:7',
  releaseNotes: {
    en_US: `Fixes the Watchtower Client, which could not register with any watchtower and showed an empty list of towers.

Two faults were responsible. The service image was missing the root certificates the watchtower client needs before it can make any network request, so every registration attempt failed immediately. Separately, the client's identity key and its list of registered towers were kept outside the service's permanent storage, so both were erased whenever the container was rebuilt. Watchtowers you have already added will register themselves again after this update.`,
    es_ES: `Corrige el Cliente de Watchtower, que no lograba registrarse en ningún watchtower y mostraba una lista de torres vacía.

Había dos fallos. A la imagen del servicio le faltaban los certificados raíz que el cliente de watchtower necesita antes de poder hacer cualquier petición de red, por lo que todos los intentos de registro fallaban de inmediato. Además, la clave de identidad del cliente y su lista de torres registradas se guardaban fuera del almacenamiento permanente del servicio, así que ambas se borraban cada vez que se reconstruía el contenedor. Los watchtowers que ya hayas añadido se registrarán de nuevo por sí solos tras esta actualización.`,
    de_DE: `Behebt den Watchtower-Client, der sich bei keinem Watchtower registrieren konnte und eine leere Liste von Towers anzeigte.

Dafür waren zwei Fehler verantwortlich. Im Dienst-Image fehlten die Stammzertifikate, die der Watchtower-Client benötigt, bevor er überhaupt eine Netzwerkanfrage stellen kann, sodass jeder Registrierungsversuch sofort fehlschlug. Zusätzlich wurden der Identitätsschlüssel des Clients und seine Liste registrierter Towers außerhalb des dauerhaften Speichers des Dienstes abgelegt und daher bei jedem Neuaufbau des Containers gelöscht. Bereits hinzugefügte Watchtower registrieren sich nach dieser Aktualisierung von selbst erneut.`,
    pl_PL: `Naprawia Klienta Watchtower, który nie mógł zarejestrować się w żadnym watchtowerze i pokazywał pustą listę wież.

Odpowiadały za to dwa błędy. W obrazie usługi brakowało głównych certyfikatów, których klient watchtower potrzebuje, zanim wykona jakiekolwiek zapytanie sieciowe, więc każda próba rejestracji kończyła się natychmiastowym niepowodzeniem. Ponadto klucz tożsamości klienta i jego lista zarejestrowanych wież były przechowywane poza trwałym magazynem usługi, więc znikały przy każdej przebudowie kontenera. Watchtowery, które już zostały dodane, zarejestrują się ponownie samoczynnie po tej aktualizacji.`,
    fr_FR: `Corrige le client Watchtower, qui ne parvenait à s'enregistrer auprès d'aucun watchtower et affichait une liste de tours vide.

Deux défauts en étaient responsables. L'image du service ne contenait pas les certificats racine dont le client watchtower a besoin avant de pouvoir effectuer la moindre requête réseau, si bien que chaque tentative d'enregistrement échouait immédiatement. Par ailleurs, la clé d'identité du client et sa liste de tours enregistrées étaient stockées en dehors du stockage permanent du service et étaient donc effacées à chaque reconstruction du conteneur. Les watchtowers que vous avez déjà ajoutés s'enregistreront à nouveau d'eux-mêmes après cette mise à jour.`,
  },
  migrations: {},
})
