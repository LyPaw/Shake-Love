# Shake & Love

![Tecnologia - HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Tecnologia - CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Tecnologia - JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tecnologia - Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tecnologia - GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white)
![Diseno - Procreate](https://img.shields.io/badge/Procreate-2B9C6A?style=for-the-badge&logo=procreate&logoColor=white)

**Autor:** LyPaw (Manuel Fuentes Cruz)
**Ano:** 2026

Pagina web romantica y minimalista construida con HTML, CSS y JavaScript puro, sin frameworks frontend. El destinatario accede a una escena interactiva donde un pollito duerme sobre una caja; al agitar el movil, el pollito despierta y la caja se abre revelando un mensaje personalizado. La app usa **Supabase** como backend para habitaciones compartidas, enlaces ilegibles por codigo y un sistema de notas y regalos persistidos entre dispositivos.

---

## Aviso Legal

Copyright 2026 LyPaw (Manuel Fuentes Cruz). Todos los derechos reservados.

### Uso permitido
- Usar la aplicacion web desde su enlace oficial
- Compartir el enlace con otras personas
- Ver y disfrutar de la experiencia

### Queda prohibido sin autorizacion escrita
- Reproducir, copiar o redistribuir el codigo fuente
- Modificar, adaptar o crear trabajos derivados
- Uso comercial total o parcial
- Alojar una copia de la aplicacion en otro servidor
- Vender o monetizar cualquier parte de la aplicacion

El codigo fuente se proporciona unicamente como referencia tecnica.

---

## Arquitectura

Aplicacion estatica de una sola pagina (SPA) desplegada en GitHub Pages, con backend gestionado por **Supabase** (Postgres + RLS). Toda la logica de interfaz se ejecuta en el navegador; los datos (habitaciones, notas y regalos) se leen/escriben mediante llamadas `rpc()` a funciones `security definer`.

```
index.html          -> Estructura HTML (creacion, propuesta, modales de nota/regalo)
style.css           -> Estilos CSS con paleta pastel y animaciones
config.js           -> Cliente Supabase (`supabaseClient`) + sesion anonima
script.js           -> Logica: interaccion, fisica, sonido, RPC, URLs por codigo
assets/             -> Imagenes PNG/SVG del pollito, cofre, nota, regalo, logo
```

### Configuracion (config.js)
- Crea el cliente con `window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`.
- La variable se llama **`supabaseClient`** (no `supabase`) para no colisionar con el global `supabase` declarado por el bundle UMD de la CDN.
- `ensureAnonSession()` firma de forma anonima (`signInAnonymously`) si no hay sesion, ya que la app no usa login.
- La clave anon es **publica por diseno**; la de `service_role` nunca se expone.

### Backend Supabase (RLS endurecido)
- Acceso solo via funciones `security definer`: `get_room`, `get_gifts`, `create_room`, `create_gift`, `delete_gift`, `delete_room`, `answer_gift`. No hay acceso directo `select` desde el cliente.
- Las consultas exigen el codigo exacto de la habitacion (`p_codigo` / `p_room_code`), por lo que un enlace con codigo desconocido devuelve vacio.
- Tablas: `rooms` (codigo, remitente, mensaje, zonas horarias, autor) y `gifts` (tipo, contenido, autor, respuesta `si`/`no`, respondido-por).

## Diseno

Los assets graficos del pollito, cofre y demas elementos fueron dibujados manualmente en Procreate (iPad) con fondo transparente y exportados como PNG.

![Captura del proceso de diseno en Procreate](assets/pocreate.PNG)

Paleta de colores utilizada:

| Variable | Color | Uso |
|----------|-------|-----|
| `--pink-light` | #FFE4EC | Fondo principal, bordes |
| `--pink-medium` | #FFB6D3 | Botones, acentos |
| `--pink-dark` | #FF8BBE | Textos destacados, titulos |
| `--cream` | #FFF5F7 | Fondos de input, textura |
| `--gold` | #FFD700 | Destellos, confeti |
| `--text-dark` | #5A4A5A | Texto principal |
| `--text-light` | #8A7A8A | Texto secundario, relojes |

Los objetos interactivos (almohada, peluche) se crearon como SVGs minimalistas con la misma estetica pastel. Los emojis (estrella, flor, corazon, pluma) se usan directamente como elementos del DOM con `font-size` grande y `drop-shadow` para integrarlos visualmente con los assets dibujados.

Las decoraciones de fondo (estrellas, nubes, hojas, destellos) son SVGs inline en el HTML con animaciones CSS sutiles (flotacion, deriva horizontal, caida con rotacion) para dar vida a la escena sin sobrecargar la interfaz.

## Flujo de Experiencia

```
Pantalla de Creacion                  Pantalla de Propuesta
+-------------------+                 +---------------------------+
| Formulario con    |   ?r=CODIGO     | Relojes (tz)              |
| nombre + mensaje  | ------------->  | Escena interactiva         |
| + zonas horarias  |  (codigo       | Pollito durmiendo          |
|                   |   ilegible)     | Caja cerrada               |
| Boton "Generar"   |                 | Objetos arrastrables       |
+-------------------+                 | Notas y regalos (escena)   |
                                            |
                                      Agitar movil (40x)
                                            |
                                      Pollito despierta
                                      Caja desaparece (permanente)
                                            |
                                      Mensaje visible
                                      Botones Si / No
```

- El enlace que se comparte es **`?r=CODIGO`**: el mensaje, el remitente y las zonas horarias se cargan via RPC despues de abrir el enlace, por lo que **nunca aparecen en la URL**.
- `?preview=true` mantiene la vista previa local al crear el enlace (sin persistir).
- Al abrir el cofre una vez, este **desaparece y la mecanica de agitar queda bloqueada de forma permanente** (tanto si se responde Si como No), evitando reabrirlo.

## Notas y Regalos (flujo de regalo)

Ademas del cofre principal, cada persona de la habitacion puede anadir objetos a la escena:

- **Nota (sobre, `assets/nota.svg`)** -> abre `#carta-modal` con el texto al tocarlo. Las notas propias muestran boton de eliminar.
- **Regalo (cofre, `assets/cofre.png`)** -> abre `#regalo-modal` con una pregunta y botones Si/No. Solo la persona que no es autora puede responder una vez; la respuesta (Si/No) queda **persistida** en Supabase y se muestra como notita. El autor ve la pregunta pero no puede responder.
- Ambos son objetos fisicos movibles en la escena, auto-colocados, con color segun el autor (tuyas vs ajenas).
- Se crean desde el boton "➕ Anadir" con pestanas Nota/Regalo.
- El regalo principal (cofre) usa respuesta visual sin persistir; la persistencia aplica a los regalos añadidos en la escena.

## Interaccion Tactil (tap vs arrastre)

- Cada objeto distingue **tocar** (abrir nota/regalo) de **arrastrar** (moverlo).
- El tap se detecta en `touchend`/`mouseup` si el objeto no se movio mas de 8px (bandera `moved`).
- No se depende del evento sintetico `click` (que algunos navegadores moviles suprimen al hacer `preventDefault` en `touchstart`), por lo que **abrir sobres y regalos funciona en movil**.
- Se ignora la secuencia de raton sintetica posterior a un toque (ventana de 500ms) para evitar abrir dos veces.

## Fisica Ice-Rink (Objetos Arrastrables)

Los 6 objetos interactivos (almohada, peluche, estrella, flor, corazon, pluma) y las notas/regalos utilizan un sistema de fisica basado en un modelo "pista de hielo":

- **Friccion:** 0.992 (los objetos deslizan y se frenan gradualmente)
- **Rebote:** 0.7 (al chocar contra los limites de la escena)
- **Calculo de velocidad:** Se mide la distancia recorrida entre frames y se divide por el tiempo transcurrido, normalizado a 16ms (aprox. 60fps)
- **Correccion de coordenadas:** Se usa `getBoundingClientRect()` del contenedor `#scene` para restar el offset del viewport, evitando deriva de gravedad
- **Touch events:** Se registran tanto `mousedown/touchstart` para compatibilidad con escritorio y movil

La animacion se ejecuta via `requestAnimationFrame` en un loop continuo que aplica friccion, rebote y colision con los bordes.

## Sonido (Web Audio API)

Los sonidos se generan programaticamente con la Web Audio API, sin archivos de audio externos:

| Objeto | Tecnica |
|--------|---------|
| Almohada | Oscilador sine 150Hz con decaimiento exponencial |
| Peluche | Sine 800Hz con sweep rapido a 1200Hz y vuelta |
| Estrella | Sine 800Hz descendiendo a 400Hz en 0.5s |
| Flor | Ruido blanco filtrado con bandpass a 2000Hz |
| Corazon | Sine 80Hz con envolvente de doble pulso (latido) |
| Pluma | Sine 600Hz descendiendo a 200Hz en 0.3s |

Los sonidos de "Si" y "No" usan secuencias de notas y osciladores descendentes. Todos los sonidos se envuelven en bloques `try/catch` para no afectar la experiencia si el navegador bloquea el AudioContext.

## Deteccion de Sacudida (DeviceMotion API)

- Se usa `DeviceMotionEvent` para acceder al acelerometro del dispositivo
- En iOS 13+, se requiere `DeviceMotionEvent.requestPermission()` en respuesta a una interaccion del usuario (click)
- El umbral de deteccion es `speed > 50` (calculado como la variacion absoluta de aceleracion incluyendo gravedad)
- Se ignoran eventos con menos de 100ms de diferencia para evitar duplicados
- Se requieren **40 sacudidas** dentro de una ventana de 5s para despertar al pollito, con decaimiento de progreso si se deja de agitar
- En escritorio, las teclas Espacio y Enter simulan una sacudida
- Si no se detecta movimiento en 2s se muestra un **control táctil de respaldo** (frotar) para dispositivos sin acelerometro
- Una vez abierto el cofre, la mecánica de sacudida queda **bloqueada permanentemente** (bandera `chestOpened`), tambien para el respaldo y el teclado

## Sistema de Relojes (Zonas Horarias IANA)

- Se puebla un `<select multiple>` con todas las zonas horarias soportadas por `Intl.supportedValuesOf('timeZone')`
- Las zonas se agrupan por continente en `<optgroup>` (Africa, America, Asia, Europe, etc.)
- Los relojes se muestran en la parte superior de la pantalla de propuesta
- Se actualizan cada 15 segundos usando `toLocaleTimeString('es-ES', { timeZone: zone })`
- Formato: `CiudadName HH:MM`
- Las zonas se guardan en la habitacion y se cargan via RPC al abrir el enlace

## Seguridad

- **XSS:** Se usa `textContent` (no `innerHTML`) para inyectar nombres, mensajes y contenidos, lo cual escapa automaticamente el HTML
- **Sanitizacion:** Los parametros URL y los contenidos de notas/regalos se sanitizan (se eliminan tags HTML y `javascript:` y se limita la longitud)
- **RLS + RPC:** El acceso a datos usa funciones `security definer` que exigen el codigo exacto de la habitacion; no hay acceso directo a las tablas desde el cliente
- **Ocultacion de datos:** El mensaje, remitente y zonas horarias navegan via RPC, no en la URL (enlaces ilegibles)
- **Sesion anonima:** Sin login; se autentica de forma anonima contra Supabase
- **Content Security Policy:** Se incluye meta CSP que restringe fuentes a `'self'` con excepciones para `*.supabase.co` y la CDN de `supabase-js`

## Responsive

La aplicacion se adapta a tres breakpoints:

| Breakpoint | Pollito | Caja | Objetos | Mensaje |
|------------|---------|------|---------|---------|
| < 480px | 216px | 180px | 100px | 2.3rem |
| 480-768px | 270px | 216px | 100px | 2.9rem |
| > 768px | 324px | 252px | 100px | 3.6rem |

## Despliegue

GitHub Pages sirve la rama `main` como sitio estatico. No se requiere paso de build. HTTPS es proporcionado automaticamente por GitHub.

URL de produccion: `https://lypaw.github.io/Shake-Love/`
