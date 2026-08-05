# Portfólio · Luan Taraschi

Site pessoal em HTML, CSS e JavaScript. Sem framework, sem build, sem
dependência: `git clone`, abre o `index.html` e acabou.

Sistema visual de 1 bit — duas cores por tema e dithering no lugar de imagem.
A esfera do topo e o redemoinho da linha do tempo não são arquivos: são canvas
pintados pixel a pixel com uma matriz de Bayer 8×8 ordenada, com a direção da
luz seguindo o cursor. Depois de vinte segundos parada, a esfera dorme e vai
ficando rala; qualquer movimento na página acorda ela.

## Rodar

```
python -m http.server 8000    # ou qualquer servidor estático
```

Abrir direto pelo `file://` também funciona — só o cache das fontes do Google
muda de comportamento.

## Estrutura

```
index.html              home: hero, sobre, projetos, games, stack, timeline, contato
sobre.html              a versão longa da história
404.html                página de erro
projeto-*.html          os oito cases: jvb, triagem, devtools, gesture, dub,
                        soms, sus, pov
css/style.css           tokens, componentes, seções, responsivo, acessibilidade
js/app.js               23 módulos, todos com guarda de prefers-reduced-motion
assets/shots/           prints e capturas dos projetos
brand-spec.md           paleta, tipografia e as referências que originaram o sistema
SHOTS.md                roteiro de captura dos prints
vercel.json             headers de produção: CSP, cache dos assets, hardening
tools/check.mjs         verificação estrutural das páginas (node tools/check.mjs)
tools/gerar-sitemap.mjs regera o sitemap com o lastmod tirado do git
tools/gerar-favicon.py  assa o monograma nos tamanhos que o Google aceita
```

As ferramentas de `tools/` são de desenvolvimento e não vão para o navegador —
a promessa de "sem dependência" continua valendo para quem abre o site.

## Decisões que valem uma linha

**Sem framework, de propósito.** Não tem nada aqui que precise de um: o site é
estático, o estado cabe em duas classes e o custo de um build seria maior que o
código que ele substituiria.

**O formulário tem dois caminhos para o mesmo lugar.** O `action` do `<form>`
posta direto no Formspree quando não há JS; com JS, o `fetch` intercepta e a
pessoa não sai da página. O endpoint aparece nos dois lugares e precisa ser o
mesmo — se divergirem, metade dos envios some sem ninguém perceber.

**A CSP libera o script inline por hash, não por `'unsafe-inline'`.** Isso só é
possível porque o site não busca nada de fora: sem CDN, sem analytics e sem fonte
de terceiro, dá para escrever `default-src 'self'` de verdade. A política é a
consequência da decisão de não ter dependência, não um enfeite por cima dela.

Existe uma armadilha aí, e o `vercel.json` não pode explicá-la porque JSON não
aceita comentário: **mexer no script de tema invalida o hash**. Aí o navegador
bloqueia o script, o site passa a abrir sempre no escuro com um pisca, e nada
disso aparece em teste local — só em produção, sem erro nenhum no build. A
checagem 11 do `check.mjs` recalcula o hash das onze páginas e compara com o que
está na CSP, então o descasamento vira falha antes do commit. Ela normaliza CRLF
para LF de propósito: os arquivos aqui estão em CRLF, o git guarda em LF, e é o
LF que vai ao ar. O hash tem que ser o dos bytes servidos.

**O favicon é arquivo, não `data:` URI.** O desenho vivia embutido no `<head>`,
funcionava em todo navegador, e por isso ninguém percebeu: o Googlebot não busca
`data:` URI para favicon. Ele quer endereço rastreável, quadrado, em múltiplo de
48px. O ícone existia e o único que precisava vê-lo nunca via, então o resultado
de busca mostrava o globo genérico. Para mudar o desenho: edite `GLIFO` em
`tools/gerar-favicon.py` e rode. A checagem 12 recusa o retorno do `data:` URI e
confere que cada arquivo referenciado existe.

**O cache é longo só onde o nome do arquivo é promessa.** Os `.woff2` levam um
ano com `immutable` porque nunca mudam sem mudar de nome. As capturas levam trinta
dias. O CSS, o JS, o HTML, o PDF do currículo e o `fontes.css` seguem revalidando
a cada visita: eles mudam mantendo o mesmo endereço, e `immutable` neles deixaria
quem já visitou preso na versão velha por um ano.

**Tudo respeita `prefers-reduced-motion`.** Os vinte e três módulos de JS checam
antes de animar, e o CSS tem um bloco que zera duração e atraso — inclusive o
atraso, senão a escada de entrada deixaria elemento invisível por meio segundo
mesmo com a animação já cortada.

**As fontes são hospedadas aqui.** O Google Fonts punha um terceiro domínio no
caminho crítico de todo carregamento, e o nome do hero é medido em JS depois que
a fonte chega — ou seja, o maior elemento da tela esperava uma conexão externa
para tomar o tamanho certo. São 145 kB em doze arquivos: um por subset, como o
Google mesmo serve, com o `unicode-range` segurando o latin-ext até aparecer um
"ç". Para atualizar: `python tools/baixar-fontes.py`, que rebaixa tudo e regera
o `assets/fontes/fontes.css`. As quatro famílias são SIL Open Font License e as
licenças estão ao lado dos arquivos.

**O tema é aplicado antes da primeira pintura.** Um script inline no `<head>` de
cada página lê o `localStorage` e marca o `<html>` antes do CSS carregar, para o
modo claro não piscar preto ao abrir.

**A contagem dos números do case roda em JS, e a da página "sobre" roda em CSS.**
Não é inconsistência: `counter()` do CSS não sabe escrever "3.500" com ponto de
milhar nem "~1.000".

## Licença

Código aberto para leitura e estudo. O conteúdo — textos, retrato e identidade
visual — é meu e não é livre para reuso.
