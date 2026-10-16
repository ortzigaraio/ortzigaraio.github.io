# Portfolio — Ortzi Garaio

Sitio estático sin build: HTML + CSS + JS, con Three.js, GSAP + ScrollTrigger y Lenis desde CDN.

```bash
cd ortzigaraio.github.io
python3 -m http.server 8000   # http://localhost:8000
```

## Editar contenido

Todo sale de `js/config.js` (`window.PORTFOLIO`):

- `owner`: nombre, rol, bio, email y GitHub.
- `projects`: título, año, rol, problema, solución, stack, métricas, `repo`, `live`, `cover` y `shots`.
  Si `cover` o un elemento de `shots` es `null`, se genera una imagen procedural con el efecto activo.
- `skills`: grupos con `[nombre, nivel 0–5]`.
- `palettes`, `fonts`, `effects`, `barrelBackgrounds`: las combinaciones del **Laboratorio** (menú *Ver → Laboratorio*).
- `defaults`: el aspecto con el que arranca la web.

## Tipografía

La fuente principal es **Stamp RSPK Three** (comercial), que no está incluida en el repositorio.
Copia tu archivo con licencia en `fonts/StampRSPKThree-Regular.woff2` (está en `.gitignore`). Mientras no esté, se usa Archivo como fuente de reserva.

## Estructura

| Archivo | Qué hace |
|---|---|
| `js/core.js` | Estado global (`PF`), temas, paletas, Lenis + ScrollTrigger |
| `js/fx.js` | Atlas de glifos y versión Canvas 2D de los efectos (portadas) |
| `js/barrel.js` | Cañón estriado: shader de escena (ánima, boca y bala por SDF) + post-procesado ASCII / Braille / Dithering / Halftone / LED |
| `js/field.js` | Fondo animado de caracteres (WebGL) |
| `js/menu.js`, `js/music.js` | Barra de menú, índice grande, ventanas, Laboratorio y radio sintetizada (WebAudio) |
| `js/gallery.js`, `js/detail.js` | Galería 3D, índice de proyectos y vista de detalle con transición FLIP |
| `js/about.js`, `js/contact.js` | Bio + matriz de skills, formulario de contacto |

## Formulario

No hay backend. Por defecto el formulario prepara el mensaje y ofrece abrirlo en tu app de correo.
Para enviarlo de verdad, pon la URL de tu servicio (Formspree, Getform…) en `FORM_ENDPOINT` al principio de `js/contact.js`.

## Versión en un solo archivo

```bash
python3 tools/build_single.py   # genera dist/portfolio.html con CSS, JS y fuente incrustados
```
