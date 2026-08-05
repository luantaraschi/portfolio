# Baixa as fontes do Google e gera o CSS que as serve daqui.
#
# Roda uma vez e o resultado vai commitado: os .woff2 em assets/fontes/ e o
# bloco @font-face em assets/fontes/fontes.css, que o style.css importa. O site
# nao tem build - nada disso acontece em deploy.
#
# Um arquivo por subset, e nao por peso: e assim que o Google serve, com
# unicode-range decidindo qual baixar. Espelhar isso significa que o navegador
# so puxa o latin-ext quando a pagina tiver um "ç" ou um "ã" - que e o caso
# aqui, mas em outra pagina pode nao ser.
#
# Rodar de novo quando quiser atualizar a versao das fontes:
#   python tools/baixar-fontes.py
import pathlib
import re
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "assets" / "fontes"

# UA de navegador moderno: com o UA padrao do urllib o Google devolve TTF em
# vez de WOFF2, que e tres vezes maior.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

FAMILIAS = {
    "silkscreen": "Silkscreen:wght@400;700",
    "pixelify-sans": "Pixelify+Sans:wght@400..700",
    "space-grotesk": "Space+Grotesk:wght@300..700",
    "space-mono": "Space+Mono:wght@400;700",
}

# O site e em portugues: "ç", "ã" e "ê" vivem no latin-ext, entao os dois
# subsets entram. O resto (cirilico, vietnamita) fica de fora.
SUBSETS = {"latin", "latin-ext"}

BLOCO = re.compile(
    r"/\* (?P<subset>[\w-]+) \*/\s*@font-face \{(?P<corpo>[^}]*)\}", re.DOTALL)


def buscar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def campo(corpo, nome):
    m = re.search(rf"{nome}:\s*([^;]+);", corpo)
    return m.group(1).strip() if m else ""


DESTINO.mkdir(parents=True, exist_ok=True)
saida = [
    "/* Gerado por tools/baixar-fontes.py - nao editar na mao.",
    "   Os mesmos @font-face que o Google serve, com os arquivos hospedados aqui.",
    "   Um por subset: o unicode-range decide qual o navegador baixa. */",
    "",
]
baixados = 0

for slug, consulta in FAMILIAS.items():
    css = buscar(f"https://fonts.googleapis.com/css2?family={consulta}&display=swap").decode()
    for m in BLOCO.finditer(css):
        subset, corpo = m.group("subset"), m.group("corpo")
        if subset not in SUBSETS:
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", corpo)
        if not url:
            continue
        peso = campo(corpo, "font-weight").replace(" ", "-")
        arquivo = f"{slug}-{peso}-{subset}.woff2"
        (DESTINO / arquivo).write_bytes(buscar(url.group(1)))
        baixados += 1
        print(f"  {arquivo:44} {(DESTINO / arquivo).stat().st_size // 1024:4} KB")

        saida += [
            "@font-face {",
            f"  font-family: {campo(corpo, 'font-family')};",
            f"  font-style: {campo(corpo, 'font-style')};",
            f"  font-weight: {campo(corpo, 'font-weight')};",
            "  font-display: swap;",
            f"  src: url('{arquivo}') format('woff2');",
            f"  unicode-range: {campo(corpo, 'unicode-range')};",
            "}",
            "",
        ]

(DESTINO / "fontes.css").write_text("\n".join(saida), encoding="utf-8")
total = sum(f.stat().st_size for f in DESTINO.glob("*.woff2"))
print(f"\n{baixados} arquivos, {total // 1024} KB no total")
print(f"CSS gerado em {(DESTINO / 'fontes.css').relative_to(RAIZ)}")
