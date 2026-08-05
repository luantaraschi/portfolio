# Confere que cada linha de codigo exibida no site existe, identica, no arquivo
# de origem. Se alguem "melhorar" uma linha ao colar aqui, ela aparece na saida.
#
# Duas procedencias:
#   http  -> raw.githubusercontent, para os repositorios publicos
#   git   -> `git show <ref>:<caminho>` num clone local, para o repo privado do
#            cliente. Nao precisa de token e nao toca na arvore de trabalho.
#
# O bloco do JVB so e conferivel em maquina que tenha o clone. Onde ele nao
# existir, a checagem daquele par e pulada com aviso e o script nao falha: quem
# roda isto de fora nao tem (nem deve ter) o repositorio do cliente.
import html as H
import pathlib
import re
import subprocess
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CLONE_JVB = pathlib.Path.home() / "Documents" / "kanban" / "jvb-kanban"

PARES = [
    ("projeto-dub.html", "http",
     "https://raw.githubusercontent.com/luantaraschi/seamless-ai-dub/main/dublador.py"),
    ("projeto-gesture.html", "http",
     "https://raw.githubusercontent.com/luantaraschi/Hand-Gestures/main/backend/hold_manager.py"),
    ("projeto-jvb.html", "git",
     (CLONE_JVB, "origin/main", "server/businessDays.ts")),
]

# linhas que sao minhas e estao declaradas como corte de trecho
MARCADORES = ("# ...", "// ...", "# o pydub")


def fonte_http(url):
    return urllib.request.urlopen(url, timeout=30).read().decode("utf-8")


def fonte_git(alvo):
    repo, ref, caminho = alvo
    if not (repo / ".git").exists():
        return None
    return subprocess.run(
        ["git", "-C", str(repo), "show", f"{ref}:{caminho}"],
        capture_output=True, text=True, encoding="utf-8", check=True,
    ).stdout


falhou = False
for pagina, tipo, alvo in PARES:
    texto = (RAIZ / pagina).read_text(encoding="utf-8")
    bloco = re.search(r"<pre[^>]*><code>([\s\S]*?)</code></pre>", texto)
    print(f"\n=== {pagina} ===")
    if not bloco:
        print("  sem bloco de codigo, pulado")
        continue

    exibido = H.unescape(re.sub(r"</?span[^>]*>", "", bloco.group(1)))
    fonte = fonte_http(alvo) if tipo == "http" else fonte_git(alvo)
    if fonte is None:
        print(f"  clone nao encontrado em {alvo[0]} - checagem pulada")
        continue

    originais = {l.strip() for l in fonte.splitlines() if l.strip()}
    linhas = [l.strip() for l in exibido.splitlines() if l.strip()]
    divergentes = [l for l in linhas
                   if not l.startswith(MARCADORES) and l not in originais]

    if divergentes:
        falhou = True
        print(f"  {len(divergentes)} de {len(linhas)} linhas NAO batem com a origem:")
        for d in divergentes:
            print(f"    ! {d}")
    else:
        print(f"  as {len(linhas)} linhas batem exatamente com a origem")

raise SystemExit(1 if falhou else 0)
