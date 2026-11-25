#!/usr/bin/env python3
"""Gera os ícones do PWA a partir do código, não de um binário perdido no repo.

    python3 scripts/gerar-icones.py

Desenho: fundo escuro do app e uma lâmpada — bulbo em branco quente (a mesma
cor "quente" do deslizador de temperatura) e rosca em ardósia. Lê como "luz"
de longe e continua legível a 16px.
"""

from pathlib import Path

from PIL import Image, ImageDraw

PUBLICO = Path(__file__).resolve().parent.parent / "public"

FUNDO = (6, 9, 16)  # --fundo escuro (#060910)
BULBO = (255, 180, 107)  # branco quente (#ffb46b)
ROSCA = (51, 65, 85)  # --borda-forte escuro (#334155)
ROSCA_CLARA = (100, 116, 139)  # --texto-tenue (#64748b)

# Desenha grande e reduz: antialiasing de graça, sem depender de rasterizador SVG.
ESCALA = 8


def desenhar(lado: int, margem_segura: float) -> Image.Image:
    """margem_segura: fração das bordas deixada livre (ícone maskable é cortado
    em círculo por alguns launchers do Android)."""
    px = lado * ESCALA
    img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, px - 1, px - 1], radius=px * 0.22, fill=FUNDO)

    util = px * (1 - 2 * margem_segura)
    x0 = px * margem_segura
    y0 = px * margem_segura
    cx = px / 2

    # bulbo: círculo na parte de cima + pescoço que afina até a rosca
    r = util * 0.30
    cy = y0 + util * 0.34
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BULBO)
    pescoco_topo = cy + r * 0.45
    pescoco_base = y0 + util * 0.70
    d.polygon(
        [
            (cx - r * 0.86, pescoco_topo),
            (cx + r * 0.86, pescoco_topo),
            (cx + r * 0.50, pescoco_base),
            (cx - r * 0.50, pescoco_base),
        ],
        fill=BULBO,
    )

    # rosca: duas faixas e o contato
    larg = r * 1.0
    alt = util * 0.075
    vao = util * 0.03
    y = pescoco_base + vao
    for cor in (ROSCA_CLARA, ROSCA):
        d.rounded_rectangle([cx - larg, y, cx + larg, y + alt], radius=alt / 2, fill=cor)
        y += alt + vao
    d.rounded_rectangle([cx - larg * 0.45, y, cx + larg * 0.45, y + alt * 0.9], radius=alt / 2, fill=ROSCA)

    return img.resize((lado, lado), Image.LANCZOS)


def main() -> None:
    PUBLICO.mkdir(exist_ok=True)

    # 192/512: o manifest usa o mesmo arquivo como 'any' e 'maskable', então a
    # margem precisa servir aos dois — daí 18%, e não zero.
    for lado in (192, 512):
        desenhar(lado, 0.18).save(PUBLICO / f"icon-{lado}.png")

    # apple-touch-icon nunca é mascarado e fica sobre o fundo do iOS: margem menor.
    desenhar(180, 0.14).save(PUBLICO / "apple-touch-icon.png")

    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#060910"/>
  <circle cx="50" cy="38" r="20" fill="#ffb46b"/>
  <path d="M32.8 47h34.4L60 66H40z" fill="#ffb46b"/>
  <rect x="40" y="68.5" width="20" height="5" rx="2.5" fill="#64748b"/>
  <rect x="40" y="75.5" width="20" height="5" rx="2.5" fill="#334155"/>
  <rect x="45" y="82.5" width="10" height="4.5" rx="2.25" fill="#334155"/>
</svg>
"""
    (PUBLICO / "favicon.svg").write_text(svg, encoding="utf-8")

    for f in sorted(PUBLICO.iterdir()):
        print(f"  {f.name}  {f.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
