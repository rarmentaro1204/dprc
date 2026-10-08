#!/usr/bin/env python3
"""Impacchetta index.html + css/ + js/ in UN SOLO file HTML autonomo (come il generatore Dupuy).
Uso: python3 tools/build_single_html.py [--embed-images]  ->  dist/Generatore_Offerte_DEPURECO_2026[_con_immagini].html
Restano esterni (CDN, serve internet): font Google (Lato, Bebas Neue) e libreria SheetJS per leggere gli Excel."""
import argparse, base64, hashlib, json, re
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--embed-images", action="store_true", help="incorpora le immagini di images/ (file piu' pesante, funziona senza cartella images/)")
args = ap.parse_args()
radice = Path(__file__).resolve().parent.parent
html = (radice / "index.html").read_text(encoding="utf8")

def css(m):
    return "<style>\n" + (radice / m.group(1)).read_text(encoding="utf8").strip() + "\n</style>"

def js(m):
    corpo = (radice / m.group(1)).read_text(encoding="utf8").strip().replace("</script", "<\\/script")
    return "<script>\n" + corpo + "\n</script>"

html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', css, html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', js, html)
# favicon: SVG incorporato
logo = (radice / "assets" / "depureco-logo.svg").read_text(encoding="utf8").strip()
import urllib.parse
html = html.replace('<link rel="icon" href="assets/depureco-logo.svg" type="image/svg+xml">',
                    '<link rel="icon" href="data:image/svg+xml,%s" type="image/svg+xml">' % urllib.parse.quote(logo))
if args.embed_images:
    embed, alias = {}, {}
    for f in sorted((radice / "images").glob("*")):
        dati = f.read_bytes()
        h = hashlib.sha1(dati).hexdigest()[:12]
        mime = {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp", "gif": "image/gif"}.get(f.suffix[1:].lower(), "image/png")
        embed.setdefault(h, f"data:{mime};base64," + base64.b64encode(dati).decode())
        alias[f.name] = h
    blocco = "<script>\nObject.assign(IMAGES_EMBED, %s);\nObject.assign(IMAGES_ALIAS, %s);\n</script>\n" % (json.dumps(embed), json.dumps(alias))
    marker = "<script>\n/* Generatore Offerte Depureco — modulo \"core\" */"
    assert marker in html
    html = html.replace(marker, blocco + marker, 1)
assert 'src="js/' not in html and 'href="css/' not in html and 'assets/' not in html
out = radice / "dist" / ("Generatore_Offerte_DEPURECO_2026_con_immagini.html" if args.embed_images else "Generatore_Offerte_DEPURECO_2026.html")
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf8")
print(f"{out} · {out.stat().st_size/1024:.0f} KB")
