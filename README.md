# Portfolio — Ortzi Garaio

Static site with no build: HTML + CSS + JS, with Three.js, GSAP + ScrollTrigger and Lenis from a CDN.

```bash
cd ortzigaraio.github.io
python3 -m http.server 8000   # http://localhost:8000
```

## Editing content

Everything comes from `js/config.js` (`window.PORTFOLIO`):

- `owner`: name, role, bio, email and GitHub.
- `projects`: title, year, role, problem, solution, stack, metrics, `repo`, `live`, `cover` and `shots`.
  If `cover` or an item in `shots` is `null`, a procedural image is generated with the active effect.
- `skills`: groups with `[name, level 0–5]`.
- `palettes`, `fonts`, `effects`, `barrelBackgrounds`: the combinations in the **Lab** (menu *View → Lab*).
- `defaults`: the look the site starts with.

## Typography

The main typeface is **Stamp RSPK Three** (freeware), included as `fonts/StampRSPKThree-Regular.woff2`. If the file is missing, Archivo is used as the fallback.

## Structure

| File | What it does |
|---|---|
| `js/core.js` | Global state (`PF`), themes, palettes, Lenis + ScrollTrigger |
| `js/fx.js` | Glyph atlas and Canvas 2D version of the effects (covers) |
| `js/barrel.js` | Rifled barrel: scene shader (bore, muzzle and bullet via SDF) + ASCII / Braille / Dithering / Halftone / LED post-processing |
| `js/field.js` | Animated character background (WebGL) |
| `js/menu.js`, `js/music.js` | Menu bar, big index, windows, Lab and synthesized radio (WebAudio) |
| `js/gallery.js`, `js/detail.js` | 3D gallery, project index and detail view with FLIP transition |
| `js/about.js`, `js/contact.js` | Bio + skills matrix, contact form |

## Form

There is no backend. By default the form prepares the message and offers to open it in your email app.
To actually send it, set your service URL (Formspree, Getform…) in `FORM_ENDPOINT` at the top of `js/contact.js`.

## Single-file version

```bash
python3 tools/build_single.py   # generates dist/portfolio.html with CSS, JS and font inlined
```
