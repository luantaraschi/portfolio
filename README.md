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
js/app.js               25 módulos, todos com guarda de prefers-reduced-motion
en/                     as mesmas 11 páginas em inglês, mesmos nomes de arquivo
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

**Todo token que pinta detalhe precisa existir nos quatro escopos.** Já mordeu
três vezes, sempre igual: uma cor lida do escopo errado vira a cor do fundo em
que ela está e o componente some inteiro, sem erro nenhum em lugar nenhum. Foi
a barrinha de paciência do retrato (`--ink` sobre `--face-paper`), os pontos
dos cards de skill (`--ink` de fundo com texto em `--ink-2`) e os pontos da
linha do tempo, que eram `#fce4a6` sobre `#fce4a6` porque os `--pop-*` nunca
tinham sido declarados para dentro do `.invert`. Ao criar um token novo:
declare em `:root`, em `:root[data-theme='light']`, em `.invert` e em
`:root[data-theme='light'] .invert` — e sempre com literal, porque `var()`
dentro de custom property resolve no elemento que declara.

**E quem pede mais contraste no sistema não recebe o cinza do meio.** O
`--ink-2` existe só para baixar hierarquia; sob `prefers-contrast: more` ele
deixa de existir e a régua fina vira a régua cheia. Está redeclarado nos quatro
escopos de tema e não só no `:root`, porque `var()` dentro de custom property
resolve no elemento que declara — se morasse só no `:root`, o painel invertido
herdaria a tinta da página em vez da dele e o texto sumiria lá dentro.

**As fontes são hospedadas aqui.** O Google Fonts punha um terceiro domínio no
caminho crítico de todo carregamento, e o nome do hero é medido em JS depois que
a fonte chega — ou seja, o maior elemento da tela esperava uma conexão externa
para tomar o tamanho certo. São 145 kB em doze arquivos: um por subset, como o
Google mesmo serve, com o `unicode-range` segurando o latin-ext até aparecer um
"ç". Para atualizar: `python tools/baixar-fontes.py`, que rebaixa tudo e regera
o `assets/fontes/fontes.css`. As quatro famílias são SIL Open Font License e as
licenças estão ao lado dos arquivos.

**Os lugares onde o navegador pinta por cima do sistema.** O cursor, a cortina
e a retícula são escolha; a seleção de texto, a barra de rolagem e o
preenchimento automático não são — vêm do sistema operacional, cada um com uma
cor que não existe na paleta. Numa página de duas cores isso aparece muito. A
seleção passou a ser a inversão de polaridade, a barra de rolagem lê os mesmos
tokens do tema, e o campo autopreenchido do Chrome é coberto por uma sombra
interna de 100px, que é o único jeito: o `background` dele o navegador não
entrega, com `!important` e tudo.

A barra de rolagem tem duas implementações e só uma vale por vez. As duas
linhas padrão (`scrollbar-width` e `scrollbar-color`) atendem Chrome 121+,
Firefox e Safari 18.2+; o bloco `::-webkit-scrollbar` fica dentro de um
`@supports not` porque, onde a propriedade padrão existe, ela desliga esses
pseudo-elementos. Medido: com as duas juntas a barra sai com 10px e o
`width: 13px` do bloco webkit é ignorado. Sem o `@supports`, aquilo seria
código morto se passando por regra viva.

**A captura abre em tamanho de verdade, e o índice do case se escreve sozinho.**
Seis dos oito cases têm uma captura só, numa coluna de 42% de largura onde
nenhum texto de interface se lê — clicar para ampliar é o gesto mais automático
que existe e não acontecia nada. O `<dialog>` nativo entrega Escape, foco preso
e página inerte sem uma linha disso escrita. Só imagem: dois dos três vídeos são
laço mudo e o terceiro tem controle nativo, e uma camada de clique por cima
roubaria o play deles.

O índice (`nesta página`) nasce dos próprios `<h2>`, porque são oito páginas com
títulos diferentes e a lista escrita à mão seria oito cópias de uma coisa que o
documento já diz. Ele não marca em que bloco você está, e isso é decisão: a
partir de 820px o corpo do case vira grade de duas colunas, então dois blocos
dividem a mesma altura — no JVB, "O problema" e "A decisão" começam os dois em
y=1492. Marcar um seria errar o outro em metade da rolagem. Quem responde
"quanto falta" é a barra em ASCII do topo, que é linear e não tem como errar.

Os dois nascem em JS de propósito: sem JS não existe ampliação nem índice, e
markup morto no HTML seria pior que a falta dele. O que o índice cria são ids
que não existiam durante a análise do HTML, então um link copiado dele abriria
a página no topo — o módulo 25 refaz o pulo depois de criar os ids, com o
`scroll-behavior` desligado por um instante na raiz. `behavior: 'auto'` na
chamada não resolve: "auto" quer dizer "o que o CSS mandar", e o CSS aqui manda
`smooth`.

**O site existe em duas línguas, com os mesmos nomes de arquivo.** `/en/` tem
as mesmas onze páginas, e `sobre.html` continua se chamando `sobre.html` lá
dentro. Slug traduzido seria mais bonito na barra de endereço e pediria uma
tabela de-para em três lugares: no seletor de idioma, no `hreflang` e no
módulo 21, que casa o case já visitado por nome de arquivo. Tabela de-para é
onde as coisas divergem em silêncio, e o preço aqui seria uma página em inglês
apontando para uma âncora que só existe em português.

O que **não** foi duplicado é o `app.js`: um arquivo serve as duas línguas e a
língua vem do `<html lang>`, que já é a fonte da verdade para leitor de tela e
para buscador. Só entra na tabela de strings o que o JS escreve na tela; tudo
que está no HTML foi traduzido no HTML, porque texto que o servidor manda
pronto é texto que o Google lê e que aparece mesmo se o JS falhar.

Os comentários de código continuam em português - eles são para quem mantém, e
quem mantém é ele. E os trechos de código dos cases ficam **verbatim**,
comentários em português inclusive: são recortes reais de um sistema real, e
traduzir ali seria falsificar o documento.

A checagem 8 exige o par nos dois sentidos. hreflang que só um lado declara o
Google descarta inteiro, e o sintoma disso é nenhum: as duas páginas continuam
indexadas, cada uma por conta própria, competindo entre si.

**O tema é aplicado antes da primeira pintura.** Um script inline no `<head>` de
cada página lê o `localStorage` e marca o `<html>` antes do CSS carregar, para o
modo claro não piscar preto ao abrir.

**A contagem dos números do case roda em JS, e a da página "sobre" roda em CSS.**
Não é inconsistência: `counter()` do CSS não sabe escrever "3.500" com ponto de
milhar nem "~1.000".

## Licença

Código aberto para leitura e estudo. O conteúdo — textos, retrato e identidade
visual — é meu e não é livre para reuso.
