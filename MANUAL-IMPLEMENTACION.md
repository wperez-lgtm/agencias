# Manual de implementación — Portal de disponibilidad Galaxy Cruises

Actualizado el 9 de noviembre de 2026.

## Qué vas a implementar

Una sola consulta `GET`, sin clave de acceso, devuelve las salidas, los espacios y los precios de la flota Galaxy. Este manual explica en seis pasos cómo llamarla desde tu sistema y cómo tratar su respuesta. Los ejemplos están en JavaScript y se ejecutaron contra el servicio real.

```
GET https://disponibilidad.galapagosgalaxycruises.com/api/v3/availability/search/ship/{shipId}/{startDate}/{endDate}
```

| Tema | Detalle |
| --- | --- |
| Autenticación | No requiere clave ni usuario |
| Operación | Solo lectura |
| Formato de respuesta | JSON |
| Llamada desde el navegador | Permitida desde cualquier dominio (CORS `*`) |
| Límite | 60 consultas por minuto |
| Encabezados del límite | `X-RateLimit-Limit` y `X-RateLimit-Remaining` |

Usa únicamente el dominio `disponibilidad.galapagosgalaxycruises.com`. El dominio `galagentssystem.com`, que aparece en el manual anterior de la API, devolvió datos distintos.

## Paso 1. Probar el endpoint

Antes de escribir código, confirma que tu equipo llega al servicio. Ejecuta esto en una terminal, con fechas iguales o posteriores a hoy:

```bash
curl -i https://disponibilidad.galapagosgalaxycruises.com/api/v3/availability/search/ship/0/2026-12-01/2026-12-31
```

El resultado correcto empieza con `HTTP/2 200` y termina con un JSON que contiene `"successful":true`. Si recibes `401`, revisa las fechas: una fecha pasada se rechaza.

## Paso 2. Construir la URL

La consulta recibe tres valores, todos dentro de la ruta. Usa `shipId = 0` y filtra por barco en tu sistema: así una sola consulta sirve para toda la flota y cuidas el límite por minuto.

| Parámetro | Tipo | Regla |
| --- | --- | --- |
| `shipId` | Número entero | Código del barco. `0` trae todos |
| `startDate` | Texto `yyyy-MM-dd` | No puede ser anterior a hoy |
| `endDate` | Texto `yyyy-MM-dd` | Igual o posterior a `startDate` |

```js
const API_BASE = 'https://disponibilidad.galapagosgalaxycruises.com/api/v3/availability/search/ship';

function buildAvailabilityUrl(shipId, startDate, endDate) {
  return `${API_BASE}/${shipId}/${startDate}/${endDate}`;
}
```

Códigos de barco, con su estado comprobado en noviembre de 2026 para el año siguiente:

| ID | Barco | Tipo | Estado |
| --- | --- | --- | --- |
| 0 | Todos los barcos | — | Devuelve todos los que tienen salidas |
| 1 | M/Y Galaxy | — | Sin salidas |
| 2 | M/C EcoGalaxy | Crucero | Con salidas |
| 3 | M/C Alya | Crucero | Con salidas |
| 4 | M/Y Bonita | Crucero | Con salidas |
| 6 | M/Y Galaxy Daily | — | Responde `401`, "No existen barcos" |
| 7 | M/C Galaxy Sirius | Crucero | Con salidas |
| 8 | M/Y Galaxy Diver II | Crucero | Con salidas |
| 9 | M/Y Galaxy Orion | Crucero | Con salidas |
| 10 | M/Y Galaxy Zibo | — | Sin salidas |
| 11 | M/Y Galaxy Diver III | Crucero | Con salidas |
| 12 | M/Y Galaxy Stella | Crucero | Con salidas |
| 13 | M/Y Galaxy Skape | Tour diario | Con salidas |

No guardes esta lista como definitiva: un barco sin salidas no aparece en la respuesta, y uno nuevo aparecerá cuando el servicio lo devuelva.

## Paso 3. Hacer la consulta y controlar los errores

El código de estado no basta para interpretar la respuesta. Dos casos sorprenden: "sin salidas" llega como `200` con `data: null`, y un parámetro inválido llega como `401` aunque el servicio no pida credenciales.

| Respuesta | Cuándo ocurre | Cuerpo | Qué debes hacer |
| --- | --- | --- | --- |
| `200` con datos | Hay salidas | JSON con `data.ship` | Continuar al paso 4 |
| `200` con `data: null` | No hay salidas en el rango | JSON | Tratarlo como lista vacía, no como error |
| `401` | Barco o fechas inválidos | JSON con `message` y, casi siempre, `errors` | Mostrar `errors`, o `message` si no viene. No agregar credenciales |
| `404` | Ruta incompleta | HTML | Corregir la URL. No leerlo como JSON |
| `429` | Más de 60 consultas por minuto | Aún sin observar | Esperar un minuto. No leerlo como JSON |
| `500` | Error del servidor | HTML | Mostrar un error general. No leerlo como JSON |

Si llamas desde un servidor, envía un `User-Agent` propio. El servicio responde `406` a los clientes `Python-urllib` y `python-requests` con su valor por defecto. Con un valor como `agencia-disponibilidad/1.0` responde `200`.

Con `fetch`, en navegador o Node.js 18 o superior:

```js
async function fetchAvailability(shipId, startDate, endDate) {
  const response = await fetch(buildAvailabilityUrl(shipId, startDate, endDate));

  if (response.status === 429) {
    throw new Error('Se alcanzó el límite de consultas. Espera un minuto.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`El servicio respondió con un error (${response.status}).`);
  }

  const body = await response.json();

  if (response.status === 401) {
    const details = Object.values(body.errors ?? {}).flat();
    throw new Error(details.join(' ') || body.message);
  }
  if (!response.ok || body.successful !== true) {
    throw new Error(`El servicio respondió con un error (${response.status}).`);
  }

  return body.data?.ship ?? [];
}
```

Con jQuery y AJAX, usando la función completa de la sección [Ejemplos por lenguaje](#ejemplos-por-lenguaje):

```js
fetchAvailability(0, '2026-12-01', '2026-12-31')
  .done((ships) => {
    // Continúa con el paso 5.
  })
  .fail((error) => {
    // Muestra error.message.
  });
```

Los mensajes de `errors` llegan en inglés:

| Caso | Campo | Mensaje |
| --- | --- | --- |
| Barco inexistente | `ship_id` | The selected ship id is invalid. |
| Fecha inicial pasada | `start_date` | The start date must be a date after or equal to today. |
| Fecha final anterior a la inicial | `end_date` | The end date must be a date after or equal to start date. |
| Formato de fecha incorrecto | `start_date` | The start date does not match the format Y-m-d. |

## Paso 4. Leer la respuesta

La respuesta agrupa las salidas por barco: `data.ship[]` contiene los barcos e `itinerary[]` las salidas de cada uno.

**Respuesta correcta: `200`**

```json
{
  "successful": true,
  "data": {
    "ship": [
      {
        "name": "M/Y Bonita",
        "type": 1,
        "itinerary": [
          {
            "id": 2267,
            "name": "C",
            "acronym": "C",
            "date": { "start": "2026-12-02", "end": "2026-12-06" },
            "island": { "start": "GPS", "end": "GPS" },
            "guide": { "language": "en" },
            "free": 6,
            "hold": 0,
            "single": 0,
            "capacity": 16,
            "price": 2900,
            "promo": { "date": "2026-12-02", "amount": 2320, "observation": null },
            "package": { "normal": 4060, "save": 3715, "promo": 3164 },
            "cabin": [
              {
                "id": 28,
                "name": "1",
                "deck": "Lower Deck",
                "accom": [
                  { "id": 165, "name": "Double Twin", "share": false, "space": 2, "price": 2900, "promo": 2320 }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Sin salidas en el rango: `200`**

```json
{ "successful": true, "data": null }
```

**Parámetro inválido: `401`**

```json
{
  "message": "Dato(s) invalido(s)",
  "errors": {
    "start_date": ["The start date must be a date after or equal to today."]
  }
}
```

**Barco sin registro: `401`, sin el campo `errors`**

```json
{ "message": "Dato(s) invalido(s) No existen barcos" }
```

Campos de cada barco y salida:

| Campo | Tipo | Puede ser nulo | Descripción |
| --- | --- | --- | --- |
| `ship[].name` | Texto | No | Nombre del barco |
| `ship[].type` | Número | No | `1` crucero, `5` tour diario |
| `id` | Número | No | Identificador de la salida |
| `name` | Texto | No | Itinerario, por ejemplo `C` o `C+A` |
| `acronym` | Texto | No | Acrónimo del itinerario |
| `date.start`, `date.end` | Fecha | No | Inicio y fin de la salida |
| `island.start`, `island.end` | Texto | No viene en tours diarios | Códigos de lugar, por ejemplo `GPS` |
| `guide.language` | Texto | No | Idioma del guía, por ejemplo `en` |
| `free` | Número | No | Espacios libres, total disponible para vender |
| `hold` | Número | No | Espacios bloqueados |
| `single` | Número | No | Singles. Significado por confirmar |
| `capacity` | Número | No | Capacidad de la embarcación |
| `price` | Número | No | Precio por persona en doble acomodación |
| `promo` | Objeto | Sí | `date` caducidad, `amount` precio promocional, `observation` beneficio |
| `package` | Objeto | No | `normal`, `save` precio agencia y `promo`. Cada valor llega como número o texto |
| `cabin` | Lista | Sí | Cabinas ofrecidas |
| `cabin[].accom` | Lista | No | Formas de vender la cabina. Son alternativas y no se suman |
| `accom`, `deck`, `cabin[].space` | Varios | Solo en tours diarios | Espacios generales, cubierta y espacios físicos |

`promo.amount` puede ser nulo cuando la promoción es solo un beneficio, por ejemplo `Free Air Ticket`. En ese caso se cobra `price`.

**Cabinas de M/Y Galaxy Skape:** VIP (`1-VIP`), Matrimonial (`2-MATRIMONIAL`) y Twin (`3-TWIN`) tienen costo adicional al itinerario.

## Paso 5. Filtrar y ordenar las salidas

**Este paso evita ofrecer salidas que no se pueden vender.** La API devuelve salidas que no pediste, incluye las agotadas y no siempre las ordena. Por eso no debes mostrar la respuesta tal como llega.

En una consulta real del 1 al 31 de diciembre de 2026, la API devolvió 60 salidas y solo 50 se podían ofrecer: 3 eran anteriores al 1 de diciembre y 7 estaban agotadas.

Haz esto en tu sistema, en este orden:

| # | Qué hacer | Por qué | Si no lo haces |
| --- | --- | --- | --- |
| 1 | Quitar las salidas con `date.start` anterior a `startDate` | La API las incluye aunque estén fuera del rango | Ofreces fechas que el cliente no pidió |
| 2 | Quitar las salidas con `free` igual a 0 | La API incluye las agotadas | Ofreces salidas sin espacios |
| 3 | Convertir a número `package.normal`, `package.save` y `package.promo` | Pueden llegar como texto, por ejemplo `"1300.00"` | `"1300.00" + 100` da `"1300.00100"` |
| 4 | Calcular el precio final: `promo.amount` si existe; si no, `price` | Una promoción puede venir sin monto | Muestras un precio vacío |
| 5 | Ordenar por `date.start` y luego por `date.end` | La API no siempre las ordena | Las fechas salen desordenadas |
| 6 | Al sumar espacios, no contar los itinerarios con `+` en el nombre | `C+A` vende los mismos espacios que `C` y `A` | Cuentas dos veces los mismos espacios |

Ejemplo de una búsqueda desde el 1 de diciembre:

| Itinerario | Inicio | `free` | Resultado |
| --- | --- | --- | --- |
| C | 26 de noviembre | 7 | Se quita: es anterior al 1 de diciembre |
| A | 5 de diciembre | 0 | Se quita: está agotada |
| B | 9 de diciembre | 3 | Se muestra y suma 3 espacios |
| C+A | 2 de diciembre | 4 | Se muestra, pero no suma espacios |

Este código hace los seis puntos. Los números de los comentarios corresponden a la tabla:

```js
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanDeparture(departure) {
  return {
    ...departure,
    finalPrice: departure.promo?.amount ?? departure.price, // 4
    package: { // 3
      normal: toNumber(departure.package.normal),
      save: toNumber(departure.package.save),
      promo: toNumber(departure.package.promo),
    },
  };
}

function byDate(a, b) {
  return a.date.start.localeCompare(b.date.start) || a.date.end.localeCompare(b.date.end);
}

function cleanShips(ships, startDate, minSpaces = 1) {
  return ships
    .map((ship) => ({
      ...ship,
      itinerary: ship.itinerary
        .filter((departure) => departure.date.start >= startDate) // 1
        .filter((departure) => departure.free >= Math.max(minSpaces, 1)) // 2
        .map(cleanDeparture) // 3 y 4
        .sort(byDate), // 5
    }))
    .filter((ship) => ship.itinerary.length > 0);
}

function totalFreeSpaces(ships) {
  return ships
    .flatMap((ship) => ship.itinerary)
    .filter((departure) => !departure.name.includes('+')) // 6
    .reduce((total, departure) => total + departure.free, 0);
}
```

Uso con jQuery y AJAX:

```js
const startDate = '2026-12-01';
const endDate = '2026-12-31';

fetchAvailability(0, startDate, endDate)
  .done((ships) => {
    const sellableShips = cleanShips(ships, startDate);
    console.log(sellableShips.length, totalFreeSpaces(sellableShips));
  })
  .fail((error) => console.error(error.message));
```

## Paso 6. Mostrar los resultados

Calcula los valores visibles con estas fórmulas e inserta siempre el contenido del servicio como texto.

| Dato | Cálculo | Ejemplo con la respuesta del paso 4 |
| --- | --- | --- |
| Precio final | `promo.amount` si existe; si no, `price` | 2320 |
| Descuento | `(price - promo.amount) / price × 100`, redondeado | 20 % |
| Noches | `date.end - date.start` | 4 |
| Días | Noches + 1 | 5 |
| Espacios | `free` de `capacity` | 6 de 16 |

- **Fechas:** no uses `new Date('2026-12-02')` para mostrarlas, porque en Ecuador aparece el día anterior. Usa `new Date(2026, 11, 2)` con la fecha separada en año, mes y día.
- **Cabinas:** las opciones de `accom` son alternativas de una misma cabina. No sumes sus plazas ni sus precios.
- **Seguridad:** usa `textContent` en JavaScript o `.text()` en jQuery. No insertes datos del servicio con `innerHTML` ni `.html()`.

## Ejemplos por lenguaje

Estos ejemplos cubren la consulta y los errores. Después aplica las reglas del paso 5.

**jQuery con AJAX**

```js
const API_BASE = 'https://disponibilidad.galapagosgalaxycruises.com/api/v3/availability/search/ship';

function availabilityErrorMessage(xhr) {
  if (xhr.status === 0) {
    return 'No se pudo conectar con el servicio.';
  }
  if (xhr.status === 429) {
    return 'Se alcanzó el límite de consultas. Espera un minuto.';
  }
  if (xhr.status === 401 && xhr.responseJSON) {
    const details = Object.values(xhr.responseJSON.errors ?? {}).flat();
    return details.join(' ') || xhr.responseJSON.message;
  }
  return `El servicio respondió con un error (${xhr.status}).`;
}

function fetchAvailability(shipId, startDate, endDate) {
  return $.ajax({
    url: `${API_BASE}/${shipId}/${startDate}/${endDate}`,
    method: 'GET',
    dataType: 'json',
    timeout: 30000,
  }).then(
    (body) => {
      if (body.successful !== true) {
        return $.Deferred().reject(new Error('El servicio no completó la consulta.'));
      }
      return body.data?.ship ?? [];
    },
    (xhr) => $.Deferred().reject(new Error(availabilityErrorMessage(xhr))),
  );
}
```

En el navegador, una ruta incompleta llega con `xhr.status` igual a 0, no como `404`. Valida que las fechas estén completas antes de llamar a la función.

**PHP con cURL**

```php
<?php
const API_BASE = 'https://disponibilidad.galapagosgalaxycruises.com/api/v3/availability/search/ship';

function fetchAvailability(int $shipId, string $startDate, string $endDate): array
{
    $curl = curl_init(API_BASE . "/$shipId/$startDate/$endDate");
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30]);
    $raw = curl_exec($curl);
    if ($raw === false) {
        throw new RuntimeException('No se pudo conectar con el servicio.');
    }
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $body = json_decode($raw, true);

    if ($status === 401 && is_array($body)) {
        $details = array_merge(...array_values($body['errors'] ?? [[]]));
        throw new RuntimeException($details ? implode(' ', $details) : $body['message']);
    }
    if ($status !== 200 || !is_array($body) || ($body['successful'] ?? false) !== true) {
        throw new RuntimeException("El servicio respondió con un error ($status).");
    }

    return $body['data']['ship'] ?? [];
}
```

**Python, solo con la biblioteca estándar**

```python
import json
import urllib.error
import urllib.request

API_BASE = "https://disponibilidad.galapagosgalaxycruises.com/api/v3/availability/search/ship"


def fetch_availability(ship_id, start_date, end_date):
    url = f"{API_BASE}/{ship_id}/{start_date}/{end_date}"
    request = urllib.request.Request(url, headers={"User-Agent": "agencia-disponibilidad/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = json.load(response)
    except urllib.error.HTTPError as error:
        if error.code == 401:
            body = json.load(error)
            details = [text for texts in body.get("errors", {}).values() for text in texts]
            raise RuntimeError(" ".join(details) or body["message"]) from error
        raise RuntimeError(f"El servicio respondió con un error ({error.code}).") from error

    return (body.get("data") or {}).get("ship", [])
```

## Lista de comprobación antes de publicar

- [ ] La URL usa `disponibilidad.galapagosgalaxycruises.com`.
- [ ] Una búsqueda sin salidas muestra un mensaje, no un error.
- [ ] Una fecha pasada muestra el mensaje del servicio.
- [ ] Un `404`, `429` o `500` no rompe la página.
- [ ] No aparecen salidas agotadas ni anteriores a la fecha de inicio.
- [ ] Las salidas están ordenadas por fecha.
- [ ] Los precios de `package` se muestran bien cuando llegan como texto.
- [ ] Una promoción sin monto conserva el precio normal.
- [ ] Los totales no cuentan dos veces los itinerarios combinados.
- [ ] Las búsquedas no superan 60 consultas por minuto.

## Problemas frecuentes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `401` sin haber pedido credenciales | Barco o fechas inválidos | Leer `errors` y corregir el parámetro |
| `406 Not Acceptable` desde un servidor | `User-Agent` por defecto del cliente rechazado | Enviar un `User-Agent` propio |
| `404` con HTML | Falta un segmento de la ruta | Enviar barco, inicio y fin |
| Error al leer el JSON | La respuesta es HTML (`404` o `500`) | Comprobar el `content-type` antes de leer |
| Error con `data.ship` | `data` llegó nulo | Usar lista vacía cuando `data` sea nulo |
| Fecha un día antes | La fecha se interpretó en UTC | Construirla con año, mes y día locales |
| `429` | Más de 60 consultas por minuto | Esperar un minuto y reducir las consultas |
| Datos distintos a otra fuente | Se usó el dominio anterior | Usar solo el dominio de este manual |

## Pendiente de confirmar

Estos puntos dependen de Galaxy y pueden cambiar cómo presentas los datos.

- La moneda: el servicio no la indica.
- El significado exacto de `single`: puede ser mayor que `free`.
- El contenido de la respuesta `429`: no se ha observado.
- Las consultas después de las 19:00 de Ecuador: sin probar si la fecha de hoy se rechaza.
