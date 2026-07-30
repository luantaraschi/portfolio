# brand-spec — Luan Taraschi

Extraído das duas referências enviadas (30/07/2026). Valores amostrados
pixel a pixel das imagens, não escolhidos de memória.

## Fontes

| # | Arquivo | O que carrega |
|---|---------|---------------|
| 1 | `ms7ra4qp-image.png` | Board de marca em painéis. Carvão + areia, logotipo em bloco de pixel, grid editorial, ilhós nos cantos dos painéis. |
| 2 | `ms7rb0cg-image.png` | Cavalo pixel em 3 estágios de erosão por dithering — 100% / ~50% / ~25% de cobertura. |

## Cores (amostradas)

| Token | Hex | OKLch | Origem |
|---|---|---|---|
| `--paper` (canvas) | `#1a1917` | `oklch(19% 0.004 75)` | ref 2, fundo dominante (`#1a1a1a`, 12213 amostras) |
| `--paper-2` (painel) | `#252420` | `oklch(24% 0.006 80)` | ref 1, painel escuro (`#252420`, 2434 amostras) |
| `--ink` (tinta) | `#fce4a6` | `oklch(92% 0.075 88)` | ref 1, painel claro (`#fce4a6`, 1656 amostras) |
| `--ink-2` (secundário) | `#9a948a` | `oklch(64% 0.010 85)` | derivado do cinza do pixel art (`#8c8c8c`, ref 2) |
| `--rule-soft` | `#413e37` | `oklch(32% 0.008 80)` | derivado |
| `--alert` (só erro) | `#ff6b3d` | `oklch(70% 0.185 40)` | derivado — não existe nas refs, entra só como sinal semântico |

Contraste verificado: areia sobre carvão **14.0:1**; secundário sobre
carvão **6.2:1**; alerta sobre carvão **6.2:1**. Todos passam 4.5:1.

**Não há terceira cor nas referências.** O acento do sistema é a própria
inversão de polaridade (painel areia dentro de página carvão), não um hue
novo. `--accent` aponta para `--ink` e vira sozinho dentro de `.invert`.

## Tipografia

- Display: `Silkscreen` — bitmap em caixa alta, `letter-spacing: 0.06em`.
  Casa com o logotipo em bloco de pixel da ref 1.
- Corpo: `Space Grotesk`, variável de 300 a 700. Grotesca de terminais
  quadrados e desenho técnico. O sans do sistema deixava o texto com cara de
  painel de configuração no meio de uma peça autoral.
- Metadados: `Space Mono`, que é a família de origem da Space Grotesk. Os dois
  combinam sem parecerem duas decisões separadas.
- Nunca a display no corpo do texto; a ref usa o bitmap só em título e marca.

Onde a bitmap cede lugar: os dez títulos de capítulo da `sobre.html` são Space
Grotesk 700 em caixa alta, `-0.02em`. Dez blocos de pixel seguidos brigavam
entre si, e um nome longo numa palavra só vazava a coluna. A bitmap fica no
`h1` da página, que é onde ela ainda é a marca.

A Space Mono é larga. Onde a linha de metadado é comprida (`.hero__role`) o
`letter-spacing` cai de `0.14em` para `0.08em` em vez de deixar quebrar em
duas. Os kickers curtos seguem em `0.14em`.

O `.lead` é o único texto em peso 300: corpo grande, `-0.012em`, entrada de
seção. É a parte ornamental da fonte aparecendo de propósito.

## Postura de layout (observada nas refs)

1. **Raio zero, borda de 2px, sombra dura deslocada.** Nada de elevação suave.
2. **Painéis alternam polaridade.** Escuro sobre claro e claro sobre escuro na
   mesma composição — é isso que dá o ritmo do board.
3. **Ilhós nos cantos.** Os painéis da ref 1 são "pendurados"; dois furos no
   topo. Usar no máximo em 2 painéis por tela.
4. **Dithering é textura, não decoração.** Bayer ordenado em 12% / 25% / 50%
   preenche blocos vazios no lugar de imagem.
5. **Erosão progressiva é o gesto assinatura.** A ref 2 mostra a mesma forma
   dissolvendo pela matriz de Bayer. No site isso vira a esfera do hero
   dissolvendo conforme o scroll avança.

## Direção de arte

Quatro decisões que separam "design system aplicado" de "peça autoral":

1. **O nome é a imagem.** O masthead sangra as duas bordas. Cada linha é medida
   em JS e recebe um corpo em pixel inteiro — fonte bitmap em corpo fracionário
   rende pixel sujo. `LUAN` e `TARASCHI` têm tamanhos diferentes porque cada uma
   é ajustada à própria contagem de letras; a diferença é o efeito, não um erro.
2. **A erosão é a transição.** A faixa entre seções não é um filete: são três
   bandas de densidade (50% → 25% → 12%) esmaecendo uma dentro da outra. O mesmo
   gesto da ref 2, agora estrutural. Os thumbs repetem: no hover os pontos se
   afastam e a forma rala.
3. **Um acidente por vez.** A cada 22–46 s, uma linha do masthead sofre falha de
   registro: duas bandas deslocam em sentidos opostos por 220 ms. Raro de
   propósito — se aparecer demais vira enfeite, e a graça é a dúvida.
4. **O cursor é do sistema.** Seta 1-bit desenhada em SVG, com contorno. Sobre
   qualquer clicável ela inverte a polaridade, exatamente como a seleção.

## Movimento

Nada interpola. Tudo que se move usa `steps()`, porque um sistema de 1 bit não
tem meio-tom nem meio-quadro. A escala é fixa — reutilizar, não inventar:

| Duração | Curva | Onde |
|---|---|---|
| 90 ms | `steps(2, end)` | pancada de botão, chip, lâmpada |
| 110 ms | `steps(2, end)` | levantada de card e do retrato |
| 140 ms | `steps(2/4, end)` | preenchimento de link, fundo de linha, cutucada |
| 160 ms | `steps(4, end)` | cursor da lâmpada atravessando o trilho |
| 240 ms | `steps(4, end)` | textura de dither "andando" no hover |
| 760 ms | `steps(22, jump-none)` | os óculos entrando ou saindo |

Só três coisas usam curva contínua, e as três são **entradas**, não reações: a
subida do `.reveal` ao rolar, `.pop` na troca de filtro (escada de 40 ms por
card) e o fade da retícula acesa. Todas em `ease-out`. A *opacidade* do
`.reveal` não entra nessa lista: ela pula em `steps(4, end)`, porque um fade
liso era a única coisa no site que desmentia o 1 bit.

### A entrada por rolagem

Rolar a primeira vez tem que valer alguma coisa, mas nada aqui é decoração
nova: cada entrada é um gesto que o site já fazia, agora disparado pelo
`IntersectionObserver` do módulo 6.

| Elemento | O que faz |
|---|---|
| qualquer `.reveal` | sobe 18 px; opacidade em 4 degraus |
| irmãos do mesmo pai | escada de 60 ms pelo `--i`, com teto de 5 |
| kicker e `h2` de seção | varridos por `clip-path`, no sentido da cortina do tema |
| item da timeline | entra pela esquerda, no sentido do próprio trilho |
| trilho da timeline | uma tira de papel recua de baixo para cima e a linha aparece atrás |
| marcadores | nascem em `scale(0)` logo depois de o trilho passar por eles |
| thumb e amostra de stack | entram erodindo, na mesma keyframe `erodir` da rampa |

O trilho é **cobertura, não a linha**: sem JS a borda continua inteira. E o
`.tl` só entra no observador para disparar isso; quem aparece são os itens.

Com `prefers-reduced-motion` os atrasos são zerados junto com as durações. Sem
isso a escada do `--i` deixaria um elemento invisível por meio segundo mesmo
com a animação já cortada.

Toda reação a clique tem `:active` que afunda o elemento e apaga a sombra —
sem isso o botão fica com cara de imagem.

## No celular

A consulta é `(hover: none)`, por capacidade e não por largura: um notebook de
tela estreita continua com o site inteiro, e um tablet largo não. Três decisões
moram lá:

1. A retícula acesa some do DOM. Ela nunca acende sem ponteiro fino (o módulo 9
   já não roda), mas ficava de camada fixa em cima do fundo.
2. `-webkit-tap-highlight-color: transparent` em tudo que é clicável. O realce
   azul do sistema por cima do `:active` desmancha a pancada 1-bit.
3. O thumb entrega no `:active` a textura ralada que entregava no `:hover` —
   o dedo mora onde o cursor passaria, e o hover nunca vai chegar.

Os alvos de toque já vinham dos componentes: `.btn` tem 48 px de altura mínima,
`.chip` e `.nav__toggle` têm 44. No painel do menu o `padding-block` sobe para
17 px, que é o que fecha os 48.

## A órbita da stack

Fecha a seção de ferramentas: a esfera do hero reaparece pequena no centro e
três anéis de retícula giram em volta, com oito chips da stack pendurados.

A primeira versão cortava tudo na borda de baixo da caixa para virar horizonte,
como na referência. Não funcionou: três arcos finos sobre uma meia-cúpula leem
como nascer do sol, não como órbita. Círculo inteiro resolveu.

O aro mora num `::before`, não no próprio anel. `mask-image` recorta o elemento
**e todos os descendentes**, então a máscara que fazia a casca do aro comia os
chips junto e só deixava a lasca de cada um que cruzava a faixa de 3 px.

**Textura em rotação não sobrevive.** A primeira versão do aro era uma grade
quadrada de 3 px girando junto com o anel: a cada quadro os pontos caíam entre
pixels, o browser reamostrava, e o tracejado virava um cinza que num sistema de
1 bit não existe. O conserto foi trocar a grade quadrada por um tracejado
**angular** — `repeating-conic-gradient` medido em graus — com o período sempre
dividindo os 6 graus de cada degrau do `steps(60)`: 6°, 3° e 2°, do anel de
dentro para fora, o que também deixa o traço com comprimento parecido nos três.
Cada degrau fecha um número inteiro de períodos, então o aro é redesenhado
idêntico a si mesmo toda vez. Quem mostra o movimento são os chips, e o aro
volta a ser uma linha dura. A faixa subiu de 3 px para 4 px pelo mesmo motivo:
com 3 px mal cabia um traço e o aro lia como poeira.

O globo levou `image-rendering: pixelated` e perdeu o `border-radius`. O canvas
é pintado num buffer de ~40×40 e esticado para uns 120 px: sem `pixelated` o
browser interpola e a esfera embaça, e o recorte redondo do CSS só somava uma
borda suavizada por cima de pixels que já eram duros. A silhueta redonda vem
pintada no próprio canvas.

O globo **é** o canvas do módulo 5, não um segundo desenho: mesma matriz de
Bayer, mesma paleta pelo tema, mesma erosão por rolagem, mesma pausa fora da
tela. Reescrever partícula ali seria manter dois sistemas dizendo a mesma coisa.

Nada gira liso. Os anéis andam em `steps(60)`, um pulo de 6 graus por vez, em
22 s / 30 s / 40 s — o do meio ao contrário dos outros dois, porque dois
sentidos já leem como mecanismo e três leem como bagunça. Cada chip roda ao
contrário na mesma cadência, senão o rótulo passaria metade da volta de cabeça
para baixo. O ângulo fixo do braço mora na propriedade `rotate` e o giro na
`transform`: são independentes e se compõem, o que dispensa guardar o ângulo
inicial numa variável só para a keyframe somá-lo de volta.

São treze animações infinitas, então o módulo 16 as deixa em
`animation-play-state: paused` e só libera com a órbita em cena. Esse
observador não solta o alvo, ao contrário do módulo 6: aqui a saída de cena
importa tanto quanto a entrada.

**Os glifos são símbolos de ofício, não logos.** Cilindro de dados, contêiner,
grafo de nós, prompt de terminal, hexágono, átomo, escada, triângulo — oito
desenhos num grid de 16, traço de 2 px com `shape-rendering: crispEdges`, sem
antialias, herdando `currentColor`. Marca colorida de terceiro num sistema de
1 bit briga com a paleta inteira, e logo de 24 px reduzido a duas cores vira
borrão. O nome em Space Mono vem ao lado do glifo porque um cilindro sozinho
não diz "PostgreSQL" — o glifo dá caráter, o texto dá a informação.

Cuidado ao mexer: `fill` como atributo do SVG **perde** para o `fill: none` da
classe. Quem precisa de miolo cheio usa um círculo minúsculo traçado.

## Custo por quadro

O visual é barato de olhar e caro de desenhar, então três regras valem para
qualquer efeito novo:

1. **O que se move, move por `transform`.** A retícula acesa era um elemento do
   tamanho da tela com a máscara centrada numa variável; mover o centro de uma
   máscara é pintura, e a área pintada era o viewport inteiro a cada quadro de
   ponteiro. Hoje é uma caixa de 320 px que anda em `translate3d`, travada em
   múltiplos de 10 px para não sair de fase com a retícula do fundo — o salto
   não aparece num borrão que só é sólido no miolo, e a maioria dos quadros
   nem chega a escrever estilo.
2. **Nada de `backdrop-filter` em elemento fixo.** A barra do topo tinha um
   `blur(8px)`, o que obriga o browser a recortar e borrar o que está atrás
   dela a cada quadro de rolagem. Por cima de um fundo 90 % sólido o borrão era
   invisível: custo alto, efeito nenhum. A barra é opaca.
3. **Medir só quando mudou.** A esfera lia `getBoundingClientRect` a cada
   quadro para saber quanto já tinha erodido, o que força um layout síncrono
   por quadro. A erosão só depende da rolagem, então a medida agora é marcada
   pelo próprio listener de `scroll` e o resto dos quadros não toca no layout.

O canvas já se protegia sozinho: pausa por `IntersectionObserver` fora da tela
e o buffer é limitado a 220×220 pixels lógicos.

## O modo claro é solarized

O retrato dithered que o Luan mandou (`ms7uqgui-diethehehet.png`) é solarized
puro — amostragem confirmou `#fdf6e3`, `#eee8d5`, `#002b36`, `#073642`,
`#93a1a1`, mais os sete acentos. O modo claro passou a ser isso: cinza quente
no lugar da areia, tinta ardósia no lugar do carvão.

| Token | Claro | Origem |
|---|---|---|
| `--paper` | `#eee8d5` | base2 |
| `--paper-2` | `#e3ddc7` | derivado |
| `--ink` | `#073642` | base02 — 10.6:1 |
| `--ink-2` | `#4c6068` | base01 escurecido até 5.4:1 (o base01 original dá 4.4) |
| `--rule-soft` | `#cfc8b0` | derivado |

Os acentos entram como `--pop-1/2/3` — vermelho `#dc322f`, azul `#268bd2`,
ciano `#2aa198` — e **existem só no modo claro**. No escuro os três apontam
para a areia, então o carvão continua estritamente 1-bit: a cor é o que
distingue os dois modos, e vazar acento para o escuro apaga essa diferença.

**Regra:** pop nunca pinta texto, só detalhe — as três bandas da rampa, o
sublinhado da letra sob o cursor, os marcadores da timeline, a retícula acesa,
o rastro do clique e o confete na fronteira do dither *dentro* da esfera
(no chiado do vazio ele virava confete solto na tela toda). Assim nenhum
contraste de leitura depende de cor, e apagar os pops devolve um site 1-bit
funcionando.

## A cortina

Trocar o tema não é um corte seco, mas também não é um blecaute: uma faixa de
22vw da cor que está entrando cruza a tela da direita para a esquerda em
420 ms, 7 degraus. Frente sólida, rastro em retícula de 50% — a página aparece
por trás enquanto ela sai. Aos 210 ms, com a faixa no meio do caminho, o
`data-theme` vira debaixo dela; o retrato reage no mesmo instante, porque a
faixa ainda está do lado direito e não tapa o canto onde ele mora.

## Os dois temas

O sistema tem duas paletas, não uma paleta e uma variação. `:root` é carvão,
`:root[data-theme='light']` é areia. A classe `.invert` significa sempre **o
contrário da página**, então ela troca de lado sozinha quando o interruptor
troca o tema — o ritmo alternado do board se mantém nos dois modos.

Tema padrão: **o que o sistema do visitante pedir**. O script inline no
`<head>` lê `localStorage['lt-tema']` primeiro; se nunca houve escolha, cai em
`prefers-color-scheme`. Roda antes da primeira pintura, para não piscar.

A marca no topo da home aponta para `#inicio`, não para `index.html`: recarregar
recomeçava o tema do zero e, em contexto sem `localStorage`, devolvia o
visitante ao escuro no meio da navegação.

## O retrato (`assets/luan-film.png`)

Tira de sprites de 22 frames, 120×200 px cada, 39 KB — extraída do GIF de
360 KB que o Luan mandou. Pipeline: recorte 216×360 do frame original →
redução bicúbica para 120×200 → ganho de contraste de 1.15 → Bayer 8×8
ordenado → duas cores.

- Mora no canto inferior esquerdo do painel do hero, sobre a esfera — visível
  desde a primeira dobra. **É o interruptor escondido**: cinco cutucadas em até
  700 ms trocam o tema, e uma barrinha embaixo dele mostra o progresso. Não há
  seção, título nem rótulo anunciando isso. O interruptor anunciado — a lâmpada
  no topo, rotulada e alcançável por teclado — existe em paralelo, para que
  ninguém dependa do easter egg.
- Frame 0 = **de óculos**. Frame 21 = **sem óculos**.
- Claro→escuro toca a tira para frente (ele tira). Escuro→claro toca ao
  contrário (a luz incomoda, ele põe). 760 ms, `steps(22, jump-none)`.
- Janela de frames escolhida por medição de diff entre frames do GIF
  (origem 62→112): fora dela o vídeo é parado e desperdiçaria peso.
- **O retrato não inverte com o tema, mas troca de cor.** A tira que o site
  carrega é `luan-film-mask.png`: as mesmas 22 poses guardadas só no canal
  alfa (tinta opaca, papel furado), pintadas por `--face-ink` sobre
  `--face-paper`. Inverter uma foto de rosto dá um negativo ilegível, então a
  polaridade é fixa — cabelo escuro sobre fundo claro nos dois modos — mas o
  par de cores acompanha a paleta: carvão sobre areia no escuro, ardósia
  sobre osso no claro. O `luan-film.png` original fica no repositório como
  fonte para reassar, não é mais carregado.
