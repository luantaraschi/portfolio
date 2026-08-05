# Gera os arquivos de favicon a partir do mesmo desenho que estava embutido em
# data: URI no <head>. Rode com `python tools/gerar-favicon.py`.
#
# Por que existir: o Googlebot NAO busca data: URI para favicon. Ele exige
# arquivo de verdade, num endereco rastreavel, em quadrado multiplo de 48px.
# Enquanto o icone morava no data: URI o resultado de busca mostrava o globo
# generico - o desenho existia e o Google nunca o via.
#
# O desenho e o mesmo monograma LT de sempre, em grade de 16, so que assado
# numa tela de 20 com 2px de margem: o Google recorta favicon em circulo, e no
# quadrado cheio as pontas do glifo encostavam na borda do recorte.
#
# Ampliacao em NEAREST de proposito: e pixel art de 1 bit, qualquer
# interpolacao vira borrao.
import pathlib

from PIL import Image, ImageDraw

RAIZ = pathlib.Path(__file__).resolve().parent.parent

FUNDO = (26, 25, 23)        # --paper do tema escuro
TINTA = (252, 228, 166)     # --ink do tema escuro

GRADE = 16                  # a grade original do desenho
TELA = 20                   # com margem para o recorte circular do Google
DESLOC = (TELA - GRADE) // 2

# x, y, largura, altura - o L e o T, iguais aos <rect> do SVG antigo
GLIFO = [
    (2, 4, 2, 8),           # haste do L
    (2, 10, 5, 2),          # pe do L
    (9, 4, 6, 2),           # barra do T
    (11, 4, 2, 8),          # haste do T
]

def desenhar():
    im = Image.new("RGB", (TELA, TELA), FUNDO)
    d = ImageDraw.Draw(im)
    for x, y, w, h in GLIFO:
        d.rectangle(
            [x + DESLOC, y + DESLOC, x + DESLOC + w - 1, y + DESLOC + h - 1],
            fill=TINTA,
        )
    return im

def svg():
    rects = "\n".join(
        f'  <rect x="{x + DESLOC}" y="{y + DESLOC}" width="{w}" height="{h}"/>'
        for x, y, w, h in GLIFO
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TELA} {TELA}">\n'
        f'  <rect width="{TELA}" height="{TELA}" fill="#1a1917"/>\n'
        f'  <g fill="#fce4a6" shape-rendering="crispEdges">\n{rects}\n  </g>\n'
        f"</svg>\n"
    )

base = desenhar()

# 96 e 192: multiplos de 48, que e o que a documentacao do Google pede.
# 180: o tamanho que o iOS usa para icone de tela de inicio.
for lado, destino in [
    (96, RAIZ / "assets" / "favicon-96.png"),
    (192, RAIZ / "assets" / "favicon-192.png"),
    (180, RAIZ / "assets" / "favicon-180.png"),
]:
    base.resize((lado, lado), Image.NEAREST).save(destino, optimize=True)
    print(f"  {destino.relative_to(RAIZ)}: {lado}x{lado}")

# o .ico na raiz e o que navegador velho e rastreador pedem sem perguntar
ico = RAIZ / "favicon.ico"
base.resize((64, 64), Image.NEAREST).save(
    ico, sizes=[(16, 16), (32, 32), (48, 48)]
)
print(f"  favicon.ico: 16, 32 e 48")

alvo_svg = RAIZ / "assets" / "favicon.svg"
alvo_svg.write_text(svg(), encoding="utf-8")
print(f"  {alvo_svg.relative_to(RAIZ)}: vetor, para quem prefere escalar")
