#!/usr/bin/env python3
"""Empaqueta el portfolio en un único HTML autocontenido.

Inserta los CSS y JS locales y la fuente como data URI. Las librerías de CDN
(Three.js, GSAP, Lenis) y Google Fonts siguen siendo enlaces externos.

Uso:
  python3 tools/build_single.py                 -> dist/portfolio.html
  python3 tools/build_single.py --fragment out  -> sin <!doctype>/<html>/<head>/<body>
"""
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def inline_css(path: pathlib.Path) -> str:
    css = path.read_text(encoding="utf-8")

    def font(m):
        ref = (path.parent / m.group(1)).resolve()
        if not ref.exists():
            return m.group(0)
        data, mime = ref.read_bytes(), "font/otf"
        if ref.suffix == ".otf":
            # Los visores sandboxed cargan mejor woff2: se convierte solo para el HTML empaquetado.
            try:
                import io
                from fontTools.ttLib import TTFont
                f = TTFont(io.BytesIO(data)); f.flavor = "woff2"
                buf = io.BytesIO(); f.save(buf); data, mime = buf.getvalue(), "font/woff2"
            except Exception:
                pass
        b64 = base64.b64encode(data).decode()
        return f'url("data:{mime};base64,{b64}") format("{"woff2" if mime == "font/woff2" else "opentype"}")'

    return re.sub(r'url\("(\.\./fonts/[^"]+)"\)\s*format\("[^"]+"\)', font, css)


def build(fragment: bool) -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    html = re.sub(
        r'<link rel="stylesheet" href="(css/[^"]+)">',
        lambda m: "<style>\n" + inline_css(ROOT / m.group(1)) + "\n</style>",
        html,
    )
    html = re.sub(
        r'<script src="(js/[^"]+)"></script>',
        lambda m: "<script>\n" + (ROOT / m.group(1)).read_text(encoding="utf-8") + "\n</script>",
        html,
    )
    if fragment:
        html = re.sub(r"<!doctype html>\s*", "", html, flags=re.I)
        html = re.sub(r"</?(html|head|body)[^>]*>\s*", "", html)
        html = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', "", html)
        # <title> primero para que se detecte en los primeros 8 KB.
        m = re.search(r"<title>.*?</title>\s*<meta name=\"claude:viewport-fit-sides\"[^>]*>", html, re.S)
        if m:
            html = m.group(0) + "\n" + html.replace(m.group(0), "")
    return html


if __name__ == "__main__":
    fragment = "--fragment" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out = pathlib.Path(args[0]) if args else ROOT / "dist" / "portfolio.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build(fragment), encoding="utf-8")
    print(f"{out} ({out.stat().st_size / 1024:.0f} KB)")
