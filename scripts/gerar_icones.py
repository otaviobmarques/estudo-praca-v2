"""Gera os ícones do PWA (public/icones). Ícone neutro, sem marca: o aplicativo atende Auto Visão e Royal.
Fundo grafite da tela de login (#2B2F36) com três barras crescentes (potencial da praça). Requer Pillow.
Uso: python3 scripts/gerar_icones.py"""
from PIL import Image, ImageDraw

FUNDO, BARRA = (43, 47, 54), (255, 255, 255)


def icone(lado: int, margem: float, cantos: bool) -> Image.Image:
    g = 4  # desenha em escala maior e reduz (bordas suaves)
    L = lado * g
    im = Image.new("RGBA", (L, L), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if cantos:
        d.rounded_rectangle((0, 0, L - 1, L - 1), radius=int(L * 0.22), fill=FUNDO)
    else:
        d.rectangle((0, 0, L, L), fill=FUNDO)  # maskable: o sistema recorta
    area = L * (1 - 2 * margem)
    x0, base = L * margem, L * margem + area
    larg, esp = area * 0.22, area * 0.17
    for k, alt in enumerate((0.42, 0.66, 0.92)):
        x = x0 + area * 0.055 + k * (larg + esp)
        d.rounded_rectangle((x, base - area * alt, x + larg, base), radius=int(larg * 0.28), fill=BARRA)
    return im.resize((lado, lado), Image.LANCZOS)


if __name__ == "__main__":
    icone(192, 0.2, True).save("public/icones/icone-192.png")
    icone(512, 0.2, True).save("public/icones/icone-512.png")
    icone(512, 0.3, False).save("public/icones/icone-maskable-512.png")
    icone(180, 0.2, False).convert("RGB").save("public/icones/apple-touch-icon.png")  # o iOS arredonda sozinho
    icone(32, 0.16, True).save("public/icones/favicon-32.png")
    print("ok")
