# Confere que cada linha exibida no site existe, identica, no arquivo do repo.
# Se eu tiver "melhorado" alguma linha, ela aparece aqui.
import html as H
import pathlib
import re
import urllib.request

RAIZ = pathlib.Path(r"c:\Users\luant\Documents\portfolio")

PARES = {
    "projeto-dub.html":
        "https://raw.githubusercontent.com/luantaraschi/seamless-ai-dub/main/dublador.py",
    "projeto-gesture.html":
        "https://raw.githubusercontent.com/luantaraschi/Hand-Gestures/main/backend/hold_manager.py",
}

for pagina, url in PARES.items():
    exibido = re.search(r"<pre[^>]*><code>([\s\S]*?)</code></pre>",
                        (RAIZ / pagina).read_text(encoding="utf-8")).group(1)
    exibido = H.unescape(re.sub(r"</?span[^>]*>", "", exibido))
    fonte = urllib.request.urlopen(url, timeout=30).read().decode("utf-8")
    fonte_linhas = {l.strip() for l in fonte.splitlines() if l.strip()}

    print(f"\n=== {pagina} ===")
    divergentes = []
    for linha in exibido.splitlines():
        s = linha.strip()
        if not s:
            continue
        # a linha que marca o corte do trecho e minha, e esta declarada como tal
        if s.startswith("# ...") or s.startswith("# o pydub"):
            continue
        if s not in fonte_linhas:
            divergentes.append(s)

    total = len([l for l in exibido.splitlines() if l.strip()])
    if divergentes:
        print(f"  {len(divergentes)} de {total} linhas NAO batem com o repo:")
        for d in divergentes:
            print(f"    ! {d}")
    else:
        print(f"  as {total} linhas batem exatamente com o repo")
