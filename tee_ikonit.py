#!/usr/bin/env python3
"""Piirtää Tavuritari-pelin ikonit (icons/*.png).

Aja tämä vain jos haluat muuttaa ikonin ulkonäköä:
    python3 tee_ikonit.py
Vaatii Pillow-kirjaston: pip install pillow

Huom: jos teet omat ikonit (esim. kuvageneraattorilla), korvaa vain
tiedostot icons/ikoni-180.png, ikoni-192.png ja ikoni-512.png — tätä
skriptiä ei silloin tarvita. Kts. GRAFIIKKA.md.
"""

from PIL import Image, ImageDraw
import os


def piirra(koko: int) -> Image.Image:
    kuva = Image.new("RGBA", (koko, koko))
    p = ImageDraw.Draw(kuva)
    s = koko / 512.0  # skaala 512-pohjaisesta suunnitelmasta

    # Tumma areenatausta + hehku alhaalla
    p.rounded_rectangle([0, 0, koko - 1, koko - 1], radius=int(96 * s),
                        fill=(43, 35, 80, 255))
    p.ellipse([-80 * s, 330 * s, 592 * s, 700 * s], fill=(82, 68, 127, 255))

    # Sarvet
    p.polygon([(150 * s, 150 * s), (196 * s, 96 * s), (222 * s, 172 * s)],
              fill=(239, 230, 216, 255))
    p.polygon([(362 * s, 150 * s), (316 * s, 96 * s), (290 * s, 172 * s)],
              fill=(239, 230, 216, 255))

    # Vihreä hirviö
    p.ellipse([90 * s, 130 * s, 422 * s, 452 * s], fill=(95, 158, 47, 255))
    p.ellipse([110 * s, 145 * s, 330 * s, 340 * s], fill=(140, 198, 90, 255))

    # Silmät
    for cx in (200, 312):
        p.ellipse([(cx - 46) * s, 180 * s, (cx + 46) * s, 272 * s],
                  fill=(255, 255, 255, 255), outline=(30, 26, 40, 255),
                  width=max(1, int(8 * s)))
        p.ellipse([(cx - 18) * s, 214 * s, (cx + 18) * s, 250 * s],
                  fill=(25, 22, 32, 255))

    # Vihaiset kulmakarvat
    p.polygon([(140 * s, 178 * s), (252 * s, 208 * s), (252 * s, 176 * s),
               (146 * s, 148 * s)], fill=(30, 24, 40, 255))
    p.polygon([(372 * s, 178 * s), (260 * s, 208 * s), (260 * s, 176 * s),
               (366 * s, 148 * s)], fill=(30, 24, 40, 255))

    # Suu + torahampaat
    p.rounded_rectangle([196 * s, 316 * s, 316 * s, 384 * s],
                        radius=int(30 * s), fill=(61, 31, 31, 255))
    p.polygon([(214 * s, 318 * s), (248 * s, 318 * s), (231 * s, 360 * s)],
              fill=(255, 255, 255, 255))
    p.polygon([(264 * s, 318 * s), (298 * s, 318 * s), (281 * s, 360 * s)],
              fill=(255, 255, 255, 255))

    # Liekehtivä tavumiekka oikeassa alakulmassa
    # Liekki terän ympärillä
    p.polygon([(534 * s, 194 * s), (486 * s, 284 * s), (520 * s, 276 * s),
               (454 * s, 356 * s), (486 * s, 348 * s), (402 * s, 422 * s),
               (364 * s, 382 * s), (486 * s, 236 * s), (478 * s, 240 * s)],
              fill=(245, 158, 66, 230))
    # Terä
    p.polygon([(486 * s, 222 * s), (522 * s, 258 * s), (410 * s, 370 * s),
               (374 * s, 334 * s)], fill=(226, 232, 240, 255),
              outline=(100, 116, 139, 255))
    # Väistin ja kahva
    p.line([352 * s, 392 * s, 430 * s, 314 * s], fill=(180, 83, 9, 255),
           width=max(2, int(26 * s)))
    p.line([326 * s, 366 * s, 394 * s, 434 * s], fill=(146, 64, 14, 255),
           width=max(2, int(20 * s)))

    return kuva


def main() -> None:
    kansio = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
    os.makedirs(kansio, exist_ok=True)
    for koko in (180, 192, 512):
        piirra(koko).save(os.path.join(kansio, f"ikoni-{koko}.png"))
        print(f"icons/ikoni-{koko}.png OK")


if __name__ == "__main__":
    main()
