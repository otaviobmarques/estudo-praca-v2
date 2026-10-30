"""Gera os ícones do PWA (public/icones). Ícone neutro, sem marca: o aplicativo atende Auto Visão e Royal.
Fundo grafite da tela de login (#2B2F36) com três barras crescentes (potencial da praça). Requer Pillow.
Uso: python3 scripts/gerar_icones.py"""
from PIL import Image, ImageDraw

FUNDO, BARRA = (43, 47, 54), (255, 255, 255)
# Mesmo desenho em vetor (favicon nítido em qualquer tamanho), na grade de 100 × 100 com margem de 16.
SVG = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#2B2F36"/>'
       '<g fill="#fff"><rect x="19.7" y="56.3" width="14.9" height="27.7" rx="4.2"/><rect x="46.1" y="40.1" width="14.9" height="43.9" rx="4.2"/>'
       '<rect x="72.4" y="22.4" width="14.9" height="61.6" rx="4.2"/></g></svg>')


def icone16() -> Image.Image:
    """16 px desenhado pixel a pixel (a redução do desenho grande borra as barras)."""
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, 15, 15), radius=3, fill=FUNDO)
    for x, topo in ((3, 9), (7, 6), (11, 3)):  # barras de 2 px, espaço de 2 px, base na linha 12
        d.rectangle((x, topo, x + 1, 12), fill=BARRA)
    return im


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
    # favicon: margem menor nos tamanhos pequenos, para as barras continuarem legíveis em 16 px
    ico = {n: icone(n, 0.16, True) for n in (32, 48)}
    ico[16] = icone16()
    ico[48].save("public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[ico[16], ico[32]])
    open("public/icones/icone.svg", "w").write(SVG)
    print("ok")
