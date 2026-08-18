#!/usr/bin/env python3
"""Kokoaa Tavuritarin yhdeksi html-tiedostoksi.

    python3 kokoa_yksi_tiedosto.py

Tuloksena syntyy tavuritari-yksi-tiedosto.html, jossa tyylit ja koodi
ovat sisällä. Sitä voi jakaa yhtenä tiedostona tai julkaista missä
tahansa — huom. puheentunnistus vaatii silti https-osoitteen.
Yhden tiedoston versiossa ei ole offline-tukea eikä kuvat/-kansion
grafiikoita (peli piirtää hahmot itse).
"""

import os
import re

KANSIO = os.path.dirname(os.path.abspath(__file__))


def lue(polku: str) -> str:
    with open(os.path.join(KANSIO, polku), encoding="utf-8") as f:
        return f.read()


def main() -> None:
    html = lue("index.html")

    # Poistetaan PWA-rivit (manifest, ikonit) — eivät toimi yhdessä tiedostossa.
    html = re.sub(r'[ \t]*<link[^>]*data-pwa[^>]*>\n?', "", html)

    # Tyylit sisään.
    html = html.replace(
        '<link rel="stylesheet" href="tyyli.css">',
        "<style>\n" + lue("tyyli.css") + "\n</style>"
    )

    # Skriptit sisään; lippu kertoo pelille ettei service workeria käytetä.
    def upota(osuma: re.Match) -> str:
        return "<script>\n" + lue(osuma.group(1)) + "\n</script>"

    html = re.sub(r'<script src="(js/[a-z]+\.js)"></script>', upota, html)
    html = html.replace("<body>", "<body>\n<script>window.YKSITIEDOSTO = true;</script>", 1)

    kohde = os.path.join(KANSIO, "tavuritari-yksi-tiedosto.html")
    with open(kohde, "w", encoding="utf-8") as f:
        f.write(html)
    print("OK:", kohde, f"({os.path.getsize(kohde) / 1024:.0f} kt)")


if __name__ == "__main__":
    main()
