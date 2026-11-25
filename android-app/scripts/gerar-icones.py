#!/usr/bin/env python3
"""Generates the Android launcher icons and splash from the site's favicon.

    python3 scripts/gerar-icones.py

Source: ../public/favicon.svg (dark rounded square + lamp). Requires Pillow and cairosvg.
- ic_launcher.png / ic_launcher_round.png: legacy icons (square and circle crop).
- ic_launcher_foreground.png: adaptive-icon foreground (lamp only, inside the 66dp safe zone);
  the background is @color/ic_launcher_background (#060910).
- splash.png: lamp centred on the app background, at the size of each existing splash file.
"""

import io
import re
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
SVG = (RAIZ.parent / "public" / "favicon.svg").read_text(encoding="utf-8")
RES = RAIZ / "android" / "app" / "src" / "main" / "res"
FUNDO = (6, 9, 16, 255)

DENSIDADES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

# Lamp only: drop the background rect and re-frame it around its centre (50, 52.5).
CORPO = re.search(r"<svg[^>]*>(.*)</svg>", SVG, re.S).group(1)
CORPO = re.sub(r"<rect[^>]*fill=\"#060910\"\s*/>", "", CORPO, count=1)


def lampada(lado_viewbox: float) -> str:
    x = 50 - lado_viewbox / 2
    y = 52.5 - lado_viewbox / 2
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {lado_viewbox} {lado_viewbox}">{CORPO}</svg>'


def render(svg: str, lado: int) -> Image.Image:
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=lado, output_height=lado)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def main() -> None:
    for nome, f in DENSIDADES.items():
        pasta = RES / f"mipmap-{nome}"
        lado = round(48 * f)
        render(SVG, lado).save(pasta / "ic_launcher.png")

        redondo = render(lampada(104), lado)
        fundo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
        mascara = Image.new("L", (lado * 4, lado * 4), 0)
        ImageDraw.Draw(mascara).ellipse([0, 0, lado * 4 - 1, lado * 4 - 1], fill=255)
        fundo.paste(Image.new("RGBA", (lado, lado), FUNDO), (0, 0), mascara.resize((lado, lado), Image.LANCZOS))
        fundo.alpha_composite(redondo)
        fundo.save(pasta / "ic_launcher_round.png")

        # 108dp canvas; lamp about 58dp tall so it stays inside the 66dp safe circle.
        render(lampada(128.6), round(108 * f)).save(pasta / "ic_launcher_foreground.png")

    for splash in RES.glob("drawable*/splash.png"):
        w, h = Image.open(splash).size
        img = Image.new("RGBA", (w, h), FUNDO)
        lado = round(min(w, h) * 0.35)
        img.alpha_composite(render(lampada(84), lado), ((w - lado) // 2, (h - lado) // 2))
        img.convert("RGB").save(splash)

    print("icons and splash written under", RES)


if __name__ == "__main__":
    main()
