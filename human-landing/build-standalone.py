"""Genera landing_autocontenida.html: un solo archivo con CSS, JS y logo incrustados.
Uso (desde human-landing/):  python3 build-standalone.py
"""
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
cfg = (root / "config.js").read_text(encoding="utf-8")
app = (root / "app.js").read_text(encoding="utf-8")
svg = (root / "assets" / "isotipo_simplificado_oscuro.svg").read_text(encoding="utf-8").strip()

# Logo: un solo <symbol> reutilizado con <use> (sin archivos externos)
symbol = re.sub(r'^<svg [^>]*viewBox="([^"]+)"[^>]*>', r'<symbol id="hh-iso" viewBox="\1">', svg)
symbol = symbol.replace("</svg>", "</symbol>")
sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + symbol + "</svg>\n"
extra_css = (".iso{display:block;flex-shrink:0}.brand .iso{height:34px;width:31px}"
             ".foot .brand .iso{height:28px;width:25.5px}.person-ph .iso{height:48px;width:43.7px}\n")

html = html.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + css + extra_css + "</style>")
html = html.replace('<script src="config.js"></script>', "<script>\n" + cfg + "</script>")
html = html.replace('<script src="app.js"></script>', "<script>\n" + app + "</script>")
html = html.replace('<link rel="icon" type="image/svg+xml" href="assets/isotipo_simplificado_oscuro.svg">\n', "")
html = re.sub(r'<img src="assets/isotipo_simplificado_oscuro.svg" alt="" width="(\d+)" height="(\d+)">',
              r'<svg class="iso" width="\1" height="\2" aria-hidden="true"><use href="#hh-iso"/></svg>', html)
html = html.replace('<body class="hh-body">\n', '<body class="hh-body">\n' + sprite, 1)
assert "styles.css" not in html and 'src="app.js"' not in html and "assets/" not in html
(root / "landing_autocontenida.html").write_text(html, encoding="utf-8")
print("OK", len(html.encode()), "bytes")
