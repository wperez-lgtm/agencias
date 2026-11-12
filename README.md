# Disponibilidad de cruceros · Galaxy Cruises

Portal para que las agencias consulten salidas, espacios y tarifas de la flota en tiempo real.

Este repositorio contiene **dos versiones de la misma aplicación** y la **documentación de su API**. Las dos versiones son intercambiables: elige la que mejor encaje con el sitio donde se va a publicar.

| Carpeta | Qué es | Tecnología | Puerto local |
|---|---|---|---|
| `agencias-disponibilidad/` | Portal, opción 1 | Angular 22 y TypeScript | 4200 |
| `agencias-disponibilidad-jquery/` | Portal, opción 2 | jQuery 4 y JavaScript, sin compilación | 4300 |
| `openapi/` | Documentación de la API | OpenAPI 3.1 y Swagger UI | 4400 |

**¿Vas a conectar tu sistema a la API?** Sigue el [manual de implementación](MANUAL-IMPLEMENTACION.md), paso a paso y con ejemplos.

## Contenido

1. [Inicio rápido](#1-inicio-rápido)
2. [Qué hace el portal](#2-qué-hace-el-portal)
3. [Cómo elegir entre Angular y jQuery](#3-cómo-elegir-entre-angular-y-jquery)
4. [API de disponibilidad](#4-api-de-disponibilidad)
5. [Campos de la respuesta](#5-campos-de-la-respuesta)
6. [Cómo se tratan los datos](#6-cómo-se-tratan-los-datos)
7. [De la API a la pantalla](#7-de-la-api-a-la-pantalla)
8. [Arquitectura](#8-arquitectura)
9. [Estructura de archivos](#9-estructura-de-archivos)
10. [Diseño](#10-diseño)
11. [Swagger y OpenAPI](#11-swagger-y-openapi)
12. [Pruebas](#12-pruebas)
13. [Despliegue](#13-despliegue)
14. [Cómo hacer cambios habituales](#14-cómo-hacer-cambios-habituales)
15. [Solución de problemas](#15-solución-de-problemas)
16. [Seguridad](#16-seguridad)
17. [Condiciones especiales](#17-condiciones-especiales)

---

## 1. Inicio rápido

### Requisitos

- [Node.js](https://nodejs.org) 24, que incluye npm.
- Internet, porque los datos vienen de la API y la tipografía Roboto de Google Fonts.

### Versiones usadas

| Componente | Versión |
|---|---|
| Node.js | 24.21.0 |
| Angular | 22.2.5 |
| jQuery | 4.0.0 |
| Swagger UI | 5.17.14 |
| http-server (servidor local) | 14.1.1 |

### Levantar cada parte

Usa una terminal distinta para cada una. `npm install` solo hace falta la primera vez.

```bash
# Opción 1: Angular
cd agencias-disponibilidad
npm install
npm start

# Opción 2: jQuery
cd agencias-disponibilidad-jquery
npm install
npm start

# Documentación de la API
cd openapi
npm start
```

### Abrir en el navegador

| Qué | En tu PC | Desde otro equipo de la misma red |
|---|---|---|
| Angular | http://localhost:4200 | `http://IP-DE-TU-PC:4200` |
| jQuery | http://localhost:4300 | `http://IP-DE-TU-PC:4300` |
| Swagger | http://localhost:4400 | `http://IP-DE-TU-PC:4400` |

Para conocer la IP en Mac ejecuta `ipconfig getifaddr en0`.

Mientras estos comandos corren, cualquier equipo de la misma red puede ver las páginas. Se apagan al cerrar la terminal o con `Ctrl+C`. Sirven para desarrollo y revisión, no para producción: para publicar, sigue la [sección 13](#13-despliegue).

---

## 2. Qué hace el portal

### Al abrir la página

Consulta automáticamente la disponibilidad **desde hoy hasta dentro de 30 días**, de todos los barcos, con un mínimo de 1 espacio.

### Formulario de búsqueda

| Campo | Valor inicial | Qué hace | ¿Consulta la API? |
|---|---|---|---|
| Barco | Todos los barcos | Muestra solo ese barco. La lista incluye únicamente barcos con disponibilidad en la búsqueda actual | No, filtra en pantalla |
| Desde | Hoy | Primera fecha de salida | Solo al pulsar el botón |
| Hasta | Hoy + 30 días | Última fecha del rango | Solo al pulsar el botón |
| Espacios mínimos | 1 | Oculta salidas con menos espacios libres. Nunca baja de 1 | No, filtra en pantalla |
| Buscar salidas | — | Consulta la API con las fechas elegidas | Sí, una consulta por pulsación |

Si el barco elegido deja de estar disponible por un cambio de filtro o de fechas, el selector vuelve a "Todos los barcos".

### Validación antes de consultar

Estas reglas evitan gastar consultas del límite por minuto en búsquedas que la API rechazaría.

| Situación | Mensaje |
|---|---|
| Falta una fecha | Selecciona las dos fechas. |
| El inicio es anterior a hoy | La fecha de inicio no puede ser anterior a hoy. |
| El final es anterior al inicio | La fecha final debe ser igual o posterior a la de inicio. |

### Resultados

- **Resumen:** salidas, barcos, espacios libres y salidas con promoción.
- **Accesos a cada barco:** botones que llevan a su sección. Solo aparecen cuando hay más de un barco.
- **Secciones por barco:** nombre, tipo, número de salidas y precio "Desde".
- **Tarjetas de salida:** fecha, itinerario, ruta, espacios, precios y cabinas desplegables.

### Estados de la pantalla

| Estado | Qué se ve |
|---|---|
| Consultando | Cuatro bloques animados y el botón "Buscando…" desactivado |
| Con resultados | Resumen y tarjetas |
| Sin salidas | "Sin salidas para esta búsqueda" |
| Error | "No pudimos completar la búsqueda" y el motivo |

### Mensajes de error

| Causa | Mensaje que ve el usuario |
|---|---|
| Sin conexión o servicio inalcanzable | No se pudo conectar con el servicio de disponibilidad. Revisa tu conexión. |
| Más de 60 consultas por minuto (`429`) | Se alcanzó el límite de consultas por minuto. Espera un momento e inténtalo de nuevo. |
| Parámetros rechazados (`401` con `errors`) | El texto enviado por la API, que llega en inglés |
| Cualquier otro error | El servicio de disponibilidad respondió con un error (código). |
| `successful: false` | La API indicó que la consulta no fue exitosa. |
| Respuesta con formato inesperado | No se pudo interpretar la respuesta de disponibilidad. |

---

## 3. Cómo elegir entre Angular y jQuery

Las dos muestran la misma información. Lo que cambia es cómo se construyen y se mantienen.

| Criterio | Angular | jQuery |
|---|---|---|
| Lenguaje | TypeScript, con tipos | JavaScript |
| Necesita compilar | Sí, `npm run build` | No |
| Qué se publica | La carpeta generada en `dist/` | La carpeta `public/` tal cual |
| Actualización de pantalla | Automática con signals | La vista se redibuja al avisar el store |
| Publicar en una subcarpeta | Requiere ajustes | Funciona directamente |
| Peso de JavaScript | 257 kB (70 kB comprimido) | 79 kB de jQuery más los módulos propios |
| Encaja mejor en | Aplicaciones que van a crecer | Sitios existentes o integración sencilla |

**Importante:** son dos bases de código independientes. Una regla o un cambio de diseño hecho en una versión debe repetirse en la otra.

---

## 4. API de disponibilidad

### Ambientes

| Ambiente | URL base | Uso |
|---|---|---|
| **Pruebas (actual)** | `https://disponibilidad.galapagosgalaxycruises.com` | Ambiente en uso mientras el portal se desarrolla y se prueba |
| **Producción** | `https://galaxycruises.com` | Destino final, una vez terminadas las pruebas |

> **Cuando el portal esté probado, debe apuntar a Producción.** Los pasos están en [Cambiar la URL de la API](#cambiar-la-url-de-la-api).

### Endpoint

```
GET https://disponibilidad.galapagosgalaxycruises.com/api/v3/availability/search/ship/{shipId}/{startDate}/{endDate}
```

Ejemplo:

```bash
curl https://disponibilidad.galapagosgalaxycruises.com/api/v3/availability/search/ship/0/2027-02-14/2027-02-14
```

La misma consulta en Producción, para cuando terminen las pruebas:

```bash
curl https://galaxycruises.com/api/v3/availability/search/ship/0/2027-02-14/2027-02-14
```

### Características

| Tema | Detalle |
|---|---|
| Autenticación | No requiere |
| Operación | Solo lectura |
| Formato | JSON |
| Acceso desde navegador | Permitido desde cualquier dominio (CORS `*`) |
| Límite | 60 consultas por minuto |
| Encabezados del límite | `X-RateLimit-Limit` y `X-RateLimit-Remaining` |
| Periodo de consulta | Hasta 3 meses. Para periodos más largos, una consulta por mes |

### Parámetros

| Parámetro | Tipo | Regla |
|---|---|---|
| `shipId` | Número entero | Código de barco; `0` trae todos |
| `startDate` | Texto `yyyy-MM-dd` | No puede ser anterior a hoy |
| `endDate` | Texto `yyyy-MM-dd` | Igual o posterior a `startDate` |

### Barcos

Estado comprobado en noviembre de 2026, para el año siguiente.

| ID | Barco | Tipo | Estado |
|---|---|---|---|
| 0 | Todos los barcos | — | Devuelve la unión de todos los barcos |
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

Los nombres de los ID 1, 6 y 10 vienen del manual, porque la API no los devolvió. El portal siempre consulta `shipId = 0` y filtra por barco en pantalla, así no gasta una consulta por cada barco.

### Respuestas

| Código | Significado | Cuerpo |
|---|---|---|
| `200` con datos | Hay salidas | JSON con `data.ship` |
| `200` con `data: null` | No hay salidas en ese rango | `{ "successful": true, "data": null }` |
| `401` | Parámetros inválidos. La API usa este código aunque no pida autenticación | JSON con `message` y, casi siempre, `errors` |
| `404` | Ruta incompleta | HTML |
| `429` | Límite superado | — |
| `500` | Error del servidor | HTML o JSON con `success: false` y `message` |

### Ejemplos de error `401`

Fecha pasada:

```json
{
  "message": "Dato(s) invalido(s)",
  "errors": {
    "start_date": ["The start date must be a date after or equal to today."]
  }
}
```

Barco sin registro, sin el campo `errors`:

```json
{ "message": "Dato(s) invalido(s) No existen barcos" }
```

| Caso | Campo | Mensaje |
|---|---|---|
| Barco inexistente | `ship_id` | The selected ship id is invalid. |
| Fecha inicial pasada | `start_date` | The start date must be a date after or equal to today. |
| Fecha final antes de la inicial | `end_date` | The end date must be a date after or equal to start date. |
| Formato de fecha incorrecto | `start_date` | The start date does not match the format Y-m-d. |

---

## 5. Campos de la respuesta

### Ejemplo de crucero

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

### Barco (`data.ship[]`)

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | Texto | Nombre del barco |
| `type` | Número | `1` crucero, `5` tour diario. El manual lo llama `ship_type_id`, pero la API envía `type` |
| `itinerary` | Lista | Salidas del barco |

### Salida (`itinerary[]`)

| Campo | Tipo | Nulo | Descripción | En pantalla |
|---|---|---|---|---|
| `id` | Número | No | Identificador | No se muestra |
| `name` | Texto | No | Nombre, por ejemplo `C` o `C+A` | Título de la tarjeta |
| `acronym` | Texto | No | Acrónimo | Etiqueta, solo si difiere de `name` |
| `date.start` | Fecha | No | Inicio | Bloque de fecha y ruta |
| `date.end` | Fecha | No | Fin | Ruta |
| `island.start` / `island.end` | Texto | Ausente en tours diarios | Códigos de lugar | Ruta |
| `guide.language` | Texto | No | Idioma del guía | "Guía: Inglés" |
| `free` | Número | No | Espacios libres; total disponible para vender | "8 de 16 libres" |
| `hold` | Número | No | Espacios bloqueados | Barra naranja y texto |
| `single` | Número | No | Singles disponibles, ver [condiciones especiales](#17-condiciones-especiales) | Texto bajo la barra |
| `capacity` | Número | No | Capacidad | "8 de 16 libres" |
| `price` | Número | No | Precio por persona en doble acomodación | Precio principal o tachado |
| `promo` | Objeto | Sí | Promoción | Precio y vigencia |
| `package` | Objeto | No | Precios de paquete | Franja inferior |
| `cabin` | Lista | Sí | Cabinas ofrecidas | Desplegable "Ver N cabinas" |
| `deck` | Texto | Solo tours diarios | Cubierta general | Etiqueta |
| `accom` | Objeto | Solo tours diarios | Espacios generales | No se muestra |

### Promoción (`promo`)

| Campo | Tipo | Nulo | Descripción |
|---|---|---|---|
| `date` | Fecha | No | Caducidad de la promoción |
| `amount` | Número | Sí | Precio promocional. Nulo cuando la promoción es solo un beneficio, sin rebaja |
| `observation` | Texto | Sí | Beneficio adicional, por ejemplo `Free Air Ticket` |

### Paquete (`package`)

Cada valor puede llegar como número o como texto, por ejemplo `"1300.00"`.

| Campo | Etiqueta en pantalla | Nulo |
|---|---|---|
| `normal` | Paquete normal | No |
| `save` | Precio agencia | No |
| `promo` | Paquete promo, solo si existe | Sí |

### Cabina (`cabin[]`)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Número | Identificador |
| `name` | Texto | Nombre o número |
| `deck` | Texto | Cubierta |
| `accom` | Lista | Formas de vender la cabina. **Son alternativas y no se suman** |
| `space` | Lista | Solo tours diarios: espacios físicos. No se muestra |

### Acomodación (`cabin[].accom[]`)

| Campo | Tipo | Descripción | En pantalla |
|---|---|---|---|
| `id` | Número | Identificador | No se muestra |
| `name` | Texto | Por ejemplo `Double Twin` | Nombre |
| `share` | Booleano | `true` por compartir, `false` cabina completa | "por compartir" o "cabina completa" |
| `space` | Número | Capacidad | "2 plazas" |
| `price` | Número | Precio | Precio o tachado |
| `promo` | Número o nulo | Precio promocional | Precio destacado |
| `active`, `delete` | Número | Solo tours diarios, sin documentar | No se muestran |

### Diferencias entre crucero y tour diario

| Tema | Crucero (`type: 1`) | Tour diario (`type: 5`) |
|---|---|---|
| Etiqueta | Crucero | Tour diario |
| Título | Itinerario C | Plazas |
| Ruta (`island`) | Sí | No viene y no se dibuja |
| Nota del precio | por persona, doble acomodación | por persona |
| Campos extra | — | `accom`, `deck`, `cabin[].space` |

Un tipo que el portal no conozca se presenta como crucero.

En M/Y Galaxy Skape, las cabinas VIP (`1-VIP`), Matrimonial (`2-MATRIMONIAL`) y Twin (`3-TWIN`) tienen costo adicional al itinerario.

---

## 6. Cómo se tratan los datos

### Particularidades de la API que se corrigen

| La API | El portal | Dónde |
|---|---|---|
| Devuelve salidas anteriores a `startDate` | Las descarta | `data/availability.mapper` |
| No siempre ordena las salidas | Ordena por inicio y luego por fin | `data/availability.mapper` |
| Envía precios de paquete como número o texto | Los convierte a número; vacío o inválido pasa a nulo | `data/availability.mapper` |
| Responde `data: null` sin salidas | Lo trata como lista vacía | `data/http-availability.repository` |
| Usa `401` para validación | Muestra el detalle de `errors` | `data/availability-error.translator` |
| Incluye salidas con `free: 0` | Nunca las muestra | `domain/availability.rules` |
| Repite espacios en itinerarios combinados | No los suma dos veces | `domain/availability.rules` |
| Envía promociones sin monto | Conserva el precio normal | `domain/availability.rules` |

### Fórmulas

| Dato | Cálculo | Ejemplo |
|---|---|---|
| Precio final | `promo.amount` si existe; si no, `price` | 2320 |
| Descuento | `(price - promo.amount) / price × 100`, redondeado. Es 0 sin monto o con precio 0 | 20 % |
| Precio "Desde" | El menor precio final entre las salidas visibles del barco | $2.320 |
| Noches | `date.end - date.start` | 4 |
| Días | Noches + 1 | 5 |
| Filtro de espacios | `free >= max(espacios mínimos, 1)` | — |
| Barra verde | `free / capacity`, máximo 100 % | 50 % |
| Barra naranja | `hold / capacity`, limitado al espacio restante de la barra | 12,5 % |
| Últimos espacios | `free <= 2`; la barra y la cifra pasan a rojo | — |

### Resumen superior

| Indicador | Qué cuenta |
|---|---|
| Salidas | Todas las salidas visibles |
| Barcos | Barcos con al menos una salida visible |
| Espacios libres | Suma de `free`, excluyendo itinerarios cuyo nombre contiene `+` |
| Con promoción | Salidas con `promo`, tenga monto o solo beneficio |

**Por qué se excluyen los combinados:** `C+A` vende los mismos espacios que `C` y `A`. Sumarlos contaría dos veces los mismos asientos.

### Formatos

| Dato | Formato | Ejemplos |
|---|---|---|
| Precio entero | `$`, punto de miles | `$1.300` |
| Precio con centavos | Coma y dos decimales | `$3.697,50` |
| Precio ausente | Guion largo | `—` |
| Fecha | Español | `jue`, `12`, `nov 2026`, `12 nov` |

### Traducciones propias

Estas equivalencias no vienen de la API y están en `presentation/availability.labels`.

| Código | Se muestra | Si llega otro código |
|---|---|---|
| `GPS` | Baltra | Se muestra el código |
| `SCY` | San Cristóbal | Se muestra el código |
| `en` | Inglés | El código en mayúsculas |
| `es` | Español | El código en mayúsculas |

---

## 7. De la API a la pantalla

```
Usuario pulsa "Buscar salidas"
        │
        ▼
Formulario ─ valida las fechas (no consulta si son inválidas)
        │
        ▼
Store ─ activa "cargando" y anula cualquier búsqueda anterior
        │
        ▼
Repositorio ─ GET /ship/0/{inicio}/{fin}
        │
        ├─ error ──► Traductor de errores ──► mensaje claro
        │
        ▼
Mapper ─ descarta salidas anteriores, ordena, convierte precios
        │
        ▼
Store ─ guarda los barcos
        │
        ▼
Reglas ─ quitan agotadas, filtran por espacios y barco, calculan el resumen
        │
        ▼
Pantalla ─ resumen, secciones por barco y tarjetas
```

Cambiar "Barco" o "Espacios mínimos" solo repite el paso de **Reglas** y la **Pantalla**, sin consultar la API.

Si el usuario lanza una búsqueda mientras otra sigue en curso, la respuesta antigua se ignora, aunque llegue después. Angular lo resuelve con `switchMap` y jQuery con un número de búsqueda.

---

## 8. Arquitectura

Las dos versiones comparten la misma organización. La dependencia siempre apunta hacia el dominio.

```
presentation ──► application ──► domain ◄── data
```

| Capa | Responsabilidad | No debe |
|---|---|---|
| `domain` | Reglas del negocio y contrato del repositorio | Conocer la API, el navegador o el framework |
| `data` | Consultar la API y corregir sus datos | Contener reglas de negocio o pantalla |
| `application` | Mantener el estado y ofrecer una sola entrada a la pantalla | Construir elementos visuales |
| `presentation` | Formulario, tarjetas, textos y formatos | Llamar directamente a la API |

### Patrones GoF

| Patrón | Dónde | Problema que resuelve |
|---|---|---|
| Adapter | `data/http-availability.repository` | Traduce la API externa al contrato que espera el dominio |
| Facade | `application/availability.store` | Da a la pantalla una sola puerta hacia estado y reglas |
| Observer | Signals en Angular; `subscribe` del store en jQuery | La pantalla se actualiza cuando cambia el estado |
| Chain of Responsibility | `data/availability-error.translator` | Cada eslabón atiende un tipo de error; agregar uno no altera los demás |
| Strategy | `presentation/ship-type-presentation` | Cambia textos según el tipo de barco, sin condicionales repartidos |
| Factory | `shared/dom/elements.js` (jQuery) | Centraliza la creación de elementos con contenido siempre como texto |

### Principios SOLID

| Principio | Aplicación |
|---|---|
| Responsabilidad única | El mapper corrige datos, las reglas calculan, las vistas dibujan |
| Abierto/cerrado | Un error o tipo de barco nuevo se agrega sin modificar lo existente |
| Sustitución de Liskov | Cualquier repositorio puede reemplazar al HTTP; las pruebas usan uno falso |
| Segregación de interfaces | El contrato del repositorio expone solo `search` |
| Inversión de dependencias | El store depende de `AvailabilityRepository`, no de la implementación HTTP |

La implementación concreta se decide en un solo lugar: `app.config.ts` en Angular y `main.js` en jQuery.

### Clean code aplicado

- Valores con nombre en lugar de números sueltos, por ejemplo `LOW_STOCK_THRESHOLD`.
- Funciones pequeñas con un solo propósito.
- Comentarios solo donde explican un motivo no evidente.

---

## 9. Estructura de archivos

### Raíz

```
agencias/
├── README.md                          Este documento
├── MANUAL-IMPLEMENTACION.md           Paso a paso para conectarse a la API
├── openapi/                           Swagger y especificación
├── agencias-disponibilidad/           Portal en Angular
└── agencias-disponibilidad-jquery/    Portal en jQuery
```

### Angular

```
agencias-disponibilidad/
├── angular.json                       Configuración de compilación
├── package.json                       Dependencias y comandos
├── public/brand/                      Favicon, foto principal y logo
└── src/
    ├── index.html                     Página base
    ├── styles.scss                    Colores y estilos generales
    ├── environments/                  URL de la API
    └── app/
        ├── app.ts, app.config.ts      Inicio de la aplicación
        ├── shared/
        │   ├── date/iso-date.ts       Fechas
        │   └── pipes/                 Formato de precio y plurales
        └── features/availability/
            ├── domain/
            │   ├── availability.models.ts       Tipos de datos
            │   ├── availability.repository.ts   Contrato y error
            │   └── availability.rules.ts        Reglas del negocio
            ├── data/
            │   ├── availability.dto.ts              Formato real de la API
            │   ├── availability.mapper.ts           Corrección de datos
            │   ├── availability-error.translator.ts Mensajes de error
            │   └── http-availability.repository.ts  Consulta HTTP
            ├── application/
            │   └── availability.store.ts            Estado
            └── presentation/
                ├── availability.labels.ts           Islas e idiomas
                ├── ship-type-presentation.ts        Textos por tipo
                ├── availability-page/               Página y resultados
                ├── search-form/                     Formulario y validación
                └── departure-card/                  Tarjeta de salida
```

### jQuery

```
agencias-disponibilidad-jquery/
├── package.json                       Dependencias y comandos
├── tests/                             Pruebas automáticas
└── public/                            Lo que se publica
    ├── index.html                     Estructura fija de la página
    ├── brand/                         Favicon, foto principal y logo
    ├── css/                           Estilos
    ├── vendor/jquery.min.js           jQuery
    └── js/
        ├── main.js                    Inicio y unión de las capas
        ├── config/environment.js      URL de la API
        ├── shared/
        │   ├── jquery.js              Acceso único a jQuery
        │   ├── date/iso-date.js       Fechas
        │   ├── dom/elements.js        Creación segura de elementos
        │   └── format/                Precio, fechas y plurales
        └── features/availability/
            ├── domain/
            │   ├── availability.repository.js   Contrato y error
            │   └── availability.rules.js        Reglas del negocio
            ├── data/
            │   ├── availability.mapper.js           Corrección de datos
            │   ├── availability-error.translator.js Mensajes de error
            │   └── http-availability.repository.js  Consulta con $.ajax
            ├── application/
            │   └── availability.store.js            Estado
            └── presentation/
                ├── availability-page.view.js        Coordina la página
                ├── search-form.view.js              Formulario
                ├── date-range.validator.js          Validación de fechas
                ├── results.view.js                  Resumen y barcos
                ├── departure-card.view.js           Tarjeta de salida
                ├── availability.labels.js           Islas e idiomas
                └── ship-type-presentation.js        Textos por tipo
```

### OpenAPI

```
openapi/
├── availability.openapi.yaml          Especificación de la API
├── index.html                         Página de Swagger con los colores de Galaxy
├── swagger-ui.css
├── swagger-ui-bundle.js
├── swagger-ui-standalone-preset.js
├── SWAGGER-UI-LICENSE
└── package.json                       Comando para servirlo en local
```

---

## 10. Diseño

### Colores

| Variable | Color | Uso |
|---|---|---|
| `--ink` | `#002554` | Azul principal, fechas, botón |
| `--ink-soft` | `#0e3b68` | Cabecera de cada barco |
| `--ink-hover` | `#022547` | Botón al pasar el cursor |
| `--sea-deep` | `#317782` | Textos destacados, precio agencia |
| `--sea` | `#009aa1` | Barra de espacios y foco |
| `--sea-light` | `#a4c8cb` | Texto secundario sobre azul |
| `--cyan` | `#00ffff` | Acento de la cabecera |
| `--sun` | `#ec8e00` | Espacios bloqueados |
| `--coral` | `#af2d05` | Descuentos, alertas, errores |
| `--sky` | `#e7f6fd` | Fondo de beneficios |
| `--bg` | `#f3f3f5` | Fondo de la página |
| `--surface` | `#ffffff` | Tarjetas |
| `--text` | `#212529` | Texto principal |
| `--muted` | `#4c6a8e` | Texto secundario |

### Dónde están los estilos

| Versión | Ubicación |
|---|---|
| Angular | `src/styles.scss` y un `.scss` por componente |
| jQuery | `public/css/` |

Los CSS de jQuery se generaron compilando los SCSS de Angular, por eso son idénticos. Desde entonces son archivos independientes: un cambio visual debe hacerse en ambos.

La página se adapta a móvil, con cambios de distribución en 960, 760, 560 y 480 píxeles.

---

## 11. Swagger y OpenAPI

En Swagger se ve cada campo de la API y se puede ejecutar una consulta real desde el navegador.

### Cómo probar una consulta

1. Abre http://localhost:4400.
2. Pulsa la operación `GET`.
3. Escribe `shipId`, `startDate` y `endDate`.
4. Pulsa **Execute**.

Las fechas de ejemplo son fijas. Si ya pasaron, cámbialas o la API responderá `401`. En **Servers** elige Producción o Pruebas. Cada **Execute** es una consulta real a ese ambiente y cuenta para el límite de 60 por minuto.

### Validar la especificación

```bash
cd openapi
npx @redocly/cli lint availability.openapi.yaml
```

Da un único aviso por no declarar licencia, que no afecta a una API interna.

### Cómo se construyó

La especificación combina el manual de noviembre de 2026 y respuestas reales. Se validó contra un año de datos reales (658 salidas), 6 errores de validación y 8 ejemplos incluidos.

### Actualizar Swagger

Al cambiar la API, edita solo `availability.openapi.yaml`; la página lo lee al abrirse. Si el cambio no aparece, recarga la página sin caché.

---

## 12. Pruebas

```bash
# Angular: 27 pruebas
cd agencias-disponibilidad
npx ng test --watch=false

# jQuery: 32 pruebas
cd agencias-disponibilidad-jquery
npm test
```

| Área cubierta | Ejemplos |
|---|---|
| Reglas | Salidas agotadas, descuentos, combinados, promoción sin monto, ocupación máxima |
| Datos | Fechas anteriores, orden, precios en texto, `data: null` |
| Errores | Conexión, límite, validación, respuesta HTML |
| Estado | Carga, búsquedas superpuestas, selección que deja de estar disponible |
| Formatos y validación | Miles, centavos, zona horaria, rangos de fechas |

### Verificación realizada (9 de noviembre de 2026)

Se abrieron las dos versiones en Chrome con la API real y se comparó el texto completo de cada tarjeta. No hubo diferencias.

| Escenario | Salidas comparadas |
|---|---|
| Búsqueda inicial, 30 días | 41 |
| Mínimo 3 espacios | 27 |
| Filtro por un barco | 3 |
| Un año completo, 9 barcos | 579 |
| Todas las cabinas abiertas | 579 |

También se comprobó el mensaje de fechas inválidas, la ausencia de errores en la consola y que en móvil no haya desplazamiento horizontal.

---

## 13. Despliegue

Las tres partes son estáticas. Basta un servidor web como Nginx, Apache, IIS o S3. El servidor no necesita Node ni configuración especial de CORS.

| Parte | Pasos |
|---|---|
| Angular | `npm run build` y subir el contenido de `dist/agencias-disponibilidad/browser/` |
| jQuery | Subir el contenido de `public/` |
| Swagger | Subir `index.html`, `availability.openapi.yaml`, `swagger-ui.css`, `swagger-ui-bundle.js` y `swagger-ui-standalone-preset.js` |

### Consideraciones

- **Servir por HTTP o HTTPS.** Abrir `index.html` con doble clic no funciona.
- **Subcarpetas en jQuery y Swagger:** funcionan sin cambios, porque usan rutas relativas.
- **Subcarpetas en Angular:** está preparado para la raíz del dominio. Para otra ruta usa `npm run build -- --base-href /ruta/` y ajusta la dirección de `hero.jpg` en `availability-page.scss`.
- **jQuery en servidores antiguos:** los `.js` deben enviarse como `text/javascript`, o los módulos no cargarán.
- **Sin rutas internas:** el portal es una sola página, así que no hace falta redirigir URLs.

### Cambiar la URL de la API

Hoy el portal usa la URL de Pruebas. Cuando esté probado, cámbiala en estos archivos por la de Producción: `https://galaxycruises.com/api/v3/availability/search/ship`.

| Parte | Archivo |
|---|---|
| Angular | `src/environments/environment.ts` y `src/environments/environment.development.ts` |
| jQuery | `public/js/config/environment.js` |
| Swagger | Sección `servers` de `availability.openapi.yaml` |

---

## 14. Cómo hacer cambios habituales

Las rutas son relativas a `features/availability/`, dentro de `src/app/` en Angular y `public/js/` en jQuery. Recuerda aplicar el cambio en las dos versiones.

| Quiero | Qué hacer |
|---|---|
| Cambiar cuándo aparece "Últimos espacios" | Valor `LOW_STOCK_THRESHOLD` en `domain/availability.rules` |
| Cambiar el rango inicial de 30 días | Valor `DEFAULT_RANGE_DAYS` en el formulario de búsqueda |
| Agregar una isla o idioma | `ISLAND_NAMES` o `LANGUAGE_NAMES` en `presentation/availability.labels` |
| Agregar un tipo de barco | Nueva presentación en `presentation/ship-type-presentation` |
| Agregar un error | Nuevo eslabón en `ERROR_CHAIN` de `data/availability-error.translator` |
| Corregir un dato nuevo de la API | `data/availability.mapper` |
| Cambiar textos de la tarjeta | Angular: `departure-card.html`. jQuery: `departure-card.view.js` |
| Cambiar un color | Variables de `styles.scss` y `css/base.css` |
| Agregar un barco | Nada: aparece solo cuando la API lo devuelve. Añádelo a la tabla de Swagger |

---

## 15. Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| `Port 4200 is already in use` u otro puerto ocupado | Ya hay un servidor corriendo | Ciérralo o localízalo con `lsof -i :4200` |
| `Operation not permitted` en Mac | macOS bloquea a Terminal el acceso a Documentos | En Ajustes del Sistema → Privacidad y seguridad → Acceso total al disco, activa Terminal, ciérrala con `Cmd+Q` y ábrela de nuevo |
| No abre desde otro equipo | Red distinta, IP cambiada o firewall | Confirma la red, la IP y permite Node en el firewall de macOS |
| Swagger responde `401` | Fecha de ejemplo ya pasada | Usa una fecha igual o posterior a hoy |
| "No se pudo conectar con el servicio" | Sin internet o API caída | Prueba la URL con `curl` |
| "Se alcanzó el límite de consultas" | Más de 60 consultas por minuto | Espera un minuto |
| `Cannot GET` | Archivo fuera de la carpeta que publica el servidor | Comprueba la dirección y el puerto de la [sección 1](#1-inicio-rápido) |
| Página en blanco en jQuery | Módulos bloqueados o `.js` mal servido | Abre la consola del navegador y revisa el tipo de archivo |
| Los datos cambian entre Pruebas y Producción | Cada ambiente tiene su propia información | Compara siempre dentro del mismo ambiente |
| Una búsqueda larga no responde | El periodo supera los 3 meses | Haz una consulta por mes |

---

## 16. Seguridad

- La API es pública y de solo lectura. El portal no maneja usuarios, contraseñas ni datos de pasajeros.
- **Contenido de la API:** se muestra siempre como texto. Angular lo hace por defecto y jQuery mediante `shared/dom/elements.js`. En jQuery no se debe usar `.html()` ni pasar a `.append()` textos que vengan de la API.
- **Swagger:** la validación externa está desactivada, así que la especificación no se envía a terceros.
- **Servidores locales:** `npm start` no está pensado para producción. Angular lo advierte al arrancar.

---

## 17. Condiciones especiales

| Condición | Regla |
|---|---|
| Singles | `single` es el número de singles disponibles. Cuando la embarcación está completamente libre (`free` igual a `capacity`), solo se permiten 2 singles por itinerario. En ese caso la API envía `single` en 0, lo que no significa que no haya singles |
| M/Y Galaxy Skape | Las cabinas son adicionales al costo del itinerario. Hay 3: VIP (Cabina 1), Matrimonial (Cabina 2) y Twin (Cabina 3), con capacidad máxima de 2 personas. Si no se agrega ninguna cabina, aplican los espacios generales |
| Total de espacios | No se puede vender más que `free`, aunque las plazas de las cabinas ofrecidas sumen más |
| Vigencia de promociones | La promoción caduca en la fecha de `promo.date` |
