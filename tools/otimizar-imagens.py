# Gera um .webp ao lado de cada .png de assets/shots/. Roda uma vez e o
# resultado vai commitado - o site não tem build, então nada disso acontece
# em deploy.
#
# qualidade 82 e method 6: a 82 o dithering de 1 bit não ganha artefato
# visível, e o method 6 é o compressor mais lento e mais eficiente do
# encoder. São poucos arquivos, ninguém tem pressa.
import pathlib
from PIL import Image

SHOTS = pathlib.Path(__file__).resolve().parent.parent / "assets" / "shots"

total_antes = total_depois = 0
maiores = []
for png in sorted(SHOTS.glob("*.png")):
    webp = png.with_suffix(".webp")
    with Image.open(png) as im:
        im.save(webp, "WEBP", quality=82, method=6)
    antes, depois = png.stat().st_size, webp.stat().st_size
    total_antes += antes
    total_depois += depois
    if depois >= antes:
        maiores.append(png.name)
    print(f"{png.name:28} {antes // 1024:5} KB -> {depois // 1024:5} KB"
          f"  ({100 - depois * 100 // antes:3}% menor)")

print(f"\ntotal: {total_antes // 1024} KB -> {total_depois // 1024} KB "
      f"({100 - total_depois * 100 // total_antes}% menor)")

# WebP nem sempre ganha de PNG em imagem de pouquíssimas cores, que é
# exatamente o caso de um site de 1 bit. Onde ele perdeu, não vale <picture>.
if maiores:
    print("\nNAO USE <picture> nestes (o webp ficou maior ou igual):")
    for nome in maiores:
        print(f"  - {nome}")
