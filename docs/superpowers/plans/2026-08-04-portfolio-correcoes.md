# Correções do Portfólio — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam checkbox (`- [ ]`) para rastreio.

**Objetivo:** Resolver os 12 problemas de interface e conteúdo levantados na análise de 04/08/2026, mantendo o site sem framework, sem build e sem dependência de runtime.

**Arquitetura:** O site é HTML/CSS/JS estático servido pela Vercel, sem etapa de build. As correções seguem essa restrição: nada que precise compilar para o site funcionar. Entram duas ferramentas **só de desenvolvimento** — `tools/check.mjs` (Node, zero dependências, verifica invariantes estruturais das 11 páginas) e `tools/otimizar-imagens.py` (Python + Pillow, roda uma vez e commita o resultado). Nenhuma das duas é carregada pelo navegador.

**Stack:** HTML5, CSS3 (custom properties, `@media`, `:has`), JavaScript ES5 em IIFE, Node 20+ (verificação), Python 3.13 + Pillow (imagens), Formspree (formulário).

## Restrições globais

- **Sem framework, sem build, sem dependência de runtime.** É a promessa do `README.md:3`. Ferramenta de desenvolvimento em `tools/` é permitida; dependência que o navegador baixe, não.
- **Todo movimento respeita `prefers-reduced-motion`.** O JS checa a variável `reduced` ([js/app.js:36](../../../js/app.js#L36)); o CSS tem o bloco em [css/style.css:1974](../../../css/style.css#L1974).
- **JS em ES5, dentro da IIFE existente.** Sem `const`, `let`, arrow function, template literal ou `for...of` em `js/app.js` — o arquivo inteiro é ES5 e misturar sintaxe quebra a consistência. `tools/*.mjs` é a exceção: roda em Node, pode ser ES2022.
- **Idioma do conteúdo: português do Brasil.** Comentários de código em português, como o resto do repositório.
- **Comentários explicam o porquê, não o quê.** É o padrão do repo inteiro; um comentário que narra o que a linha faz é ruído.
- **Um commit por tarefa**, mensagem em português, no imperativo, sem prefixo de convenção (`git log` do repo não usa `feat:`).
- **Não tocar em `assets/luan-taraschi-cv.pdf`, `brand-spec.md` nem `SHOTS.md`** salvo onde uma tarefa mandar explicitamente.
- **Cores sempre por token** (`var(--ink)`, `var(--paper)`, `var(--accent)`), nunca hex literal em componente novo.
- **Endpoint do Formspree:** o valor real será fornecido pelo Luan. Até lá, use exatamente `https://formspree.io/f/SUBSTITUIR` e deixe a Tarefa 2 sinalizada como pendente de dado externo.

## Mapa de arquivos

| Arquivo | Responsabilidade | Situação |
|---|---|---|
| `tools/check.mjs` | Verifica invariantes estruturais das 11 páginas. É a rede de segurança do plano inteiro. | Criar (T1) |
| `tools/otimizar-imagens.py` | Gera `.webp` ao lado de cada `.png` de `assets/shots/`. Roda uma vez. | Criar (T7) |
| `index.html` | Home. Concentra 8 das 12 correções. | Modificar (T2,T3,T4,T6,T8,T10,T11,T12,T13,T14) |
| `js/app.js` | Formulário, autoplay condicional. | Modificar (T2,T4) |
| `css/style.css` | Combinador do `.shot`, componente de depoimento. | Modificar (T7,T13) |
| `robots.txt`, `sitemap.xml` | Descoberta por crawler. | Criar (T9) |
| `404.html`, `sobre.html`, `projeto-*.html` (8) | JSON-LD, fontes locais, hreflang. | Modificar (T8,T10,T14) |
| `assets/fontes/` | 4 famílias auto-hospedadas em `.woff2`. | Criar (T8) |
| `README.md` | Documentar `tools/` e o endpoint do formulário. | Modificar (T1,T2) |

**As 11 páginas HTML** (usadas repetidamente abaixo): `index.html`, `sobre.html`, `404.html`, `projeto-jvb.html`, `projeto-triagem.html`, `projeto-devtools.html`, `projeto-gesture.html`, `projeto-dub.html`, `projeto-soms.html`, `projeto-sus.html`, `projeto-pov.html`.

**Ordem das tarefas é obrigatória.** A T1 cria a verificação que todas as outras usam.

---

## Fase 0 — rede de segurança

### Tarefa 1: Script de verificação

**Arquivos:**
- Criar: `tools/check.mjs`
- Modificar: `README.md` (seção Estrutura)

**Interfaces:**
- Produz: `node tools/check.mjs` sai com código 0 se tudo passa, 1 se algo falha, e imprime uma linha por falha. Toda tarefa seguinte roda esse comando.
- Consome: nada.

O script codifica o estado **desejado**, então ele começa falhando em 8 checagens. Cada tarefa seguinte apaga uma linha vermelha. Isso é o ciclo de teste deste plano — o projeto não tem framework de teste e não vai ganhar um.

- [ ] **Passo 1: Criar o script**

```javascript
// Verificação estrutural das páginas. Zero dependência: roda com `node tools/check.mjs`
// em qualquer máquina com Node 20+. Não é carregado pelo site.
//
// Cada checagem aqui nasceu de um problema real encontrado na revisão de
// 04/08/2026. Elas ficam depois de resolvidas: o custo de manter é zero e o
// custo de reintroduzir qualquer um deles é uma página quebrada em produção.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGINAS = [
  'index.html', 'sobre.html', '404.html',
  'projeto-jvb.html', 'projeto-triagem.html', 'projeto-devtools.html',
  'projeto-gesture.html', 'projeto-dub.html', 'projeto-soms.html',
  'projeto-sus.html', 'projeto-pov.html',
];

const falhas = [];
const exigir = (ok, msg) => { if (!ok) falhas.push(msg); };

const html = new Map();
for (const p of PAGINAS) html.set(p, await readFile(join(RAIZ, p), 'utf8'));

// --- 1. toda <img> declara width e height (evita CLS) ---
for (const [nome, src] of html) {
  for (const tag of src.match(/<img\b[^>]*>/g) ?? []) {
    exigir(/\bwidth=/.test(tag) && /\bheight=/.test(tag),
      `${nome}: <img> sem width/height -> ${tag.slice(0, 72)}...`);
  }
}

// --- 2. o formulário funciona sem JS ---
{
  const form = html.get('index.html').match(/<form\b[^>]*>/)?.[0] ?? '';
  exigir(/\baction=/.test(form), 'index.html: <form> sem action (submit sem JS perde o texto)');
  exigir(/\bmethod=["']post["']/i.test(form), 'index.html: <form> sem method="post"');
}

// --- 3. nenhum autoplay declarado no HTML ---
// O atributo é HTML puro: o bloco prefers-reduced-motion do CSS não alcança.
// Quem quiser vídeo tocando liga por JS, dentro da guarda de movimento.
for (const [nome, src] of html) {
  exigir(!/\bautoplay\b/.test(src), `${nome}: autoplay no HTML ignora prefers-reduced-motion`);
}

// --- 4. nenhum asset órfão em assets/shots ---
{
  const tudo = [...html.values()].join('\n');
  for (const arq of await readdir(join(RAIZ, 'assets', 'shots'))) {
    if (arq === '.gitkeep' || arq.endsWith('.webp')) continue;
    exigir(tudo.includes(arq), `assets/shots/${arq}: não é referenciado por nenhuma página`);
  }
}

// --- 5. descoberta por crawler ---
{
  exigir(existsSync(join(RAIZ, 'robots.txt')), 'robots.txt: não existe');
  const mapa = existsSync(join(RAIZ, 'sitemap.xml'))
    ? await readFile(join(RAIZ, 'sitemap.xml'), 'utf8') : '';
  exigir(mapa !== '', 'sitemap.xml: não existe');
  // o 404 fica de fora de propósito: página de erro não se indexa
  for (const p of PAGINAS.filter((p) => p !== '404.html')) {
    exigir(mapa.includes(p === 'index.html' ? 'luantaraschi.dev/</loc>' : p),
      `sitemap.xml: não lista ${p}`);
  }
}

// --- 6. dados estruturados ---
for (const [nome, src] of html) {
  if (nome === '404.html') continue;
  exigir(src.includes('application/ld+json'), `${nome}: sem JSON-LD`);
}

// --- 7. fontes auto-hospedadas ---
for (const [nome, src] of html) {
  exigir(!src.includes('fonts.googleapis.com'),
    `${nome}: ainda busca fonte no Google (domínio de terceiro no caminho crítico)`);
}

// --- 8. hreflang preparado para a versão em inglês ---
for (const [nome, src] of html) {
  if (nome === '404.html') continue;
  exigir(/hreflang=["']pt-BR["']/.test(src), `${nome}: sem <link hreflang="pt-BR">`);
  exigir(/hreflang=["']x-default["']/.test(src), `${nome}: sem <link hreflang="x-default">`);
}

if (falhas.length) {
  console.error(`\n${falhas.length} falha(s):\n`);
  for (const f of falhas) console.error(`  x ${f}`);
  process.exit(1);
}
console.log(`OK: ${PAGINAS.length} páginas, nenhuma falha.`);
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
node tools/check.mjs
```

Esperado: sai com código 1 e lista as falhas. Devem aparecer, entre outras: 8 `<img> sem width/height` (index.html), `<form> sem action`, `autoplay no HTML` (index.html e projeto-pov.html), 2 assets órfãos, `robots.txt: não existe`, 10 `sem JSON-LD`, 11 `ainda busca fonte no Google`, 20 de hreflang.

Se aparecer erro de sintaxe do Node em vez da lista de falhas, o script está errado — conserte antes de seguir.

- [ ] **Passo 3: Documentar no README**

Em `README.md`, dentro do bloco ` ``` ` da seção **Estrutura**, acrescente ao final:

```
tools/check.mjs         verificação estrutural das páginas (node tools/check.mjs)
```

E logo depois do bloco, acrescente o parágrafo:

```markdown
As ferramentas de `tools/` são de desenvolvimento e não vão para o navegador —
a promessa de "sem dependência" continua valendo para quem abre o site.
```

- [ ] **Passo 4: Commitar**

```bash
git add tools/check.mjs README.md
git commit -m "Adiciona verificação estrutural das páginas"
```

---

## Fase 1 — o que está quebrado

### Tarefa 2: Formulário que entrega a mensagem

**Arquivos:**
- Modificar: `index.html:611` (abertura do `<form>`), `index.html:618-632` (campos)
- Modificar: `js/app.js:34` (constante), `js/app.js:156-185` (ramo do mailto)
- Modificar: `README.md`

**Interfaces:**
- Consome: `node tools/check.mjs` da T1.
- Produz: `<form>` com `action`/`method` válidos e `FORM_ENDPOINT` preenchido. Nenhuma tarefa posterior depende disso.

**PENDENTE DE DADO EXTERNO.** O Luan precisa criar o formulário em formspree.io e passar o endpoint. Implemente com o literal `https://formspree.io/f/SUBSTITUIR` e avise ao entregar. O código fica correto; só a string troca.

- [ ] **Passo 1: Rodar a verificação e ver a falha específica**

```bash
node tools/check.mjs
```

Esperado, entre as linhas: `index.html: <form> sem action (submit sem JS perde o texto)`

- [ ] **Passo 2: Dar ao formulário um destino que funciona sem JS**

Em `index.html:611`, troque:

```html
        <form class="panel reveal" data-form novalidate>
```

por:

```html
        <!-- `action` e `method` de verdade: sem JS o navegador posta direto no
             Formspree e a pessoa vê a página de obrigado dele. O `data-form` faz
             o JS interceptar e enviar por fetch, sem sair da página. Os dois
             caminhos entregam no mesmo lugar; o de baixo é só mais bonito. -->
        <form class="panel reveal" data-form novalidate
              action="https://formspree.io/f/SUBSTITUIR" method="post">
```

- [ ] **Passo 3: Ajustar os campos e plantar a armadilha de robô**

Em `index.html`, dentro de `.panel__body`, troque o campo de e-mail (linha 625):

```html
              <input id="f-email" name="email" type="email" autocomplete="email" />
```

por:

```html
              <input id="f-email" name="email" type="email" autocomplete="email"
                     spellcheck="false" required />
```

Acrescente `required` também em `#f-nome` (625→620) e no `<textarea id="f-msg">` (630). O `novalidate` continua no form, então quem tem JS segue vendo as mensagens em português do `js/app.js`; o `required` só entra em cena quando o JS não roda.

E logo antes do `<button class="btn" type="submit">` (linha 633), acrescente:

```html
            <!-- Armadilha de robô: humano nunca vê este campo, robô de spam
                 preenche tudo que encontra. O Formspree descarta o envio quando
                 o campo com nome `_gotcha` vem preenchido. `hidden` e não CSS:
                 é um campo que não existe para ninguém, inclusive leitor de tela. -->
            <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" hidden />
```

- [ ] **Passo 4: Ligar o endpoint no JS e apagar o ramo morto**

Em `js/app.js:25-34`, troque o bloco inteiro do comentário mais a constante por:

```javascript
  // Endpoint do formulário. O mesmo valor está no `action` do <form> em
  // index.html: lá ele serve a quem está sem JS, aqui a quem tem.
  // Se os dois divergirem, metade dos envios some sem ninguém perceber.
  var FORM_ENDPOINT = 'https://formspree.io/f/SUBSTITUIR';
```

Depois, em `js/app.js`, apague o bloco inteiro do fallback de mailto — da linha `if (!FORM_ENDPOINT || !window.fetch) {` até o `}` que fecha logo depois de `dizer('› abri seu cliente de e-mail numa aba nova.'); return;`. São as linhas 156-185. O `mailto:` do link de contato em `index.html:583` **fica** — ele continua sendo o caminho certo para quem quer só copiar o endereço.

- [ ] **Passo 5: Verificar**

```bash
node tools/check.mjs
```

Esperado: as duas linhas do `<form>` sumiram da lista.

Depois, no navegador (`python -m http.server 8000`, abrir `http://localhost:8000`):
1. Enviar o formulário vazio → as três mensagens de erro em português aparecem e o foco vai para o campo Nome.
2. Preencher tudo e enviar → o botão trava em "enviando…" e volta. Com o endpoint ainda em `SUBSTITUIR`, a resposta será erro e a mensagem `› não consegui enviar…` é o comportamento **correto** neste momento.
3. Desligar o JS no DevTools (Settings → Debugger → Disable JavaScript), recarregar e enviar com campos vazios → o navegador barra pelo `required`. Isso prova que o caminho sem JS existe.

- [ ] **Passo 6: Documentar no README**

Depois do parágrafo **"Sem framework, de propósito."**, acrescente:

```markdown
**O formulário tem dois caminhos para o mesmo lugar.** O `action` do `<form>`
posta direto no Formspree quando não há JS; com JS, o `fetch` intercepta e a
pessoa não sai da página. O endpoint aparece nos dois lugares e precisa ser o
mesmo — se divergirem, metade dos envios some sem ninguém perceber.
```

- [ ] **Passo 7: Commitar**

```bash
git add index.html js/app.js README.md
git commit -m "Liga o formulário ao Formspree, com caminho sem JS e armadilha de robô"
```

---

### Tarefa 3: Dimensões nas capturas da home

**Arquivos:**
- Modificar: `index.html:260,273,286,299,315,365,378,394`

**Interfaces:**
- Consome: `node tools/check.mjs` da T1.
- Produz: nada que outra tarefa use.

Os valores abaixo são as dimensões reais dos arquivos, medidas em 04/08/2026. Não invente nem arredonde: o navegador usa a razão entre os dois para reservar a caixa, e um número errado desloca a página do mesmo jeito que nenhum número.

- [ ] **Passo 1: Rodar a verificação e ver as 8 falhas**

```bash
node tools/check.mjs
```

Esperado: 8 linhas `index.html: <img> sem width/height`.

- [ ] **Passo 2: Acrescentar width e height em cada uma**

Em `index.html`, acrescente os dois atributos logo depois do `src` de cada `<img class="card__shot">`, e no `<video class="card__shot">`:

| Linha | Arquivo | `width` | `height` |
|---|---|---|---|
| 260 | `jvb-painel.png` | `1440` | `900` |
| 273 | `triagem-conversa.png` | `1440` | `900` |
| 286 | `devtools-dash.png` | `1440` | `810` |
| 299 | `gesture-landmarks.png` | `688` | `516` |
| 315 | `dub-frame.png` | `960` | `542` |
| 365 | `soms-home.png` | `1200` | `900` |
| 378 | `sus-home.png` | `1200` | `900` |
| 394 | `pov-agulha.mp4` | `1100` | `930` |

Exemplo do primeiro, para não restar dúvida de formato:

```html
            <img class="card__shot" src="assets/shots/jvb-painel.png"
                 width="1440" height="900" alt="" loading="lazy" />
```

O `.card__thumb` tem `aspect-ratio: 4 / 3` ([css/style.css:689](../../../css/style.css#L689)) e a imagem preenche por `object-fit`, então os atributos **não** mudam o desenho — eles só dão ao navegador a razão para reservar a caixa antes do byte chegar. Confira que nada se moveu no passo 3.

- [ ] **Passo 3: Verificar**

```bash
node tools/check.mjs
```

Esperado: nenhuma linha `<img> sem width/height`.

No navegador, com a home aberta: DevTools → Lighthouse → rodar em modo Mobile. O **Cumulative Layout Shift** precisa estar em 0 ou muito perto. Anote o número antes e depois se quiser a prova.

Confira também a olho que a grade de projetos continua idêntica — mesma altura de card, mesmo recorte das capturas.

- [ ] **Passo 4: Commitar**

```bash
git add index.html
git commit -m "Declara as dimensões das capturas da home"
```

---

### Tarefa 4: Autoplay que respeita movimento reduzido

**Arquivos:**
- Modificar: `index.html:394-395`, `projeto-pov.html:97`, `projeto-dub.html:100`, `projeto-devtools.html:157`
- Modificar: `js/app.js` (novo módulo 23, no fim da IIFE)

**Interfaces:**
- Consome: a variável `reduced` já definida em [js/app.js:36](../../../js/app.js#L36).
- Produz: nada que outra tarefa use.

- [ ] **Passo 1: Rodar a verificação e ver as falhas**

```bash
node tools/check.mjs
```

Esperado: linhas `autoplay no HTML ignora prefers-reduced-motion` para cada página com vídeo.

- [ ] **Passo 2: Tirar o autoplay do markup**

Em `index.html:394-395`, troque:

```html
            <video class="card__shot" src="assets/shots/pov-agulha.mp4"
                   autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>
```

por:

```html
            <!-- sem `autoplay`: o atributo é HTML puro e o bloco de movimento
                 reduzido do CSS não alcança ele. Quem toca é o módulo 23, que
                 checa a preferência antes. `data-toca` é a marca que ele procura. -->
            <video class="card__shot" src="assets/shots/pov-agulha.mp4" data-toca
                   width="1100" height="930"
                   muted loop playsinline preload="metadata" aria-hidden="true"></video>
```

(Se a T3 já pôs `width`/`height` aqui, mantenha os valores dela e só troque `autoplay` por `data-toca`.)

Faça o mesmo nas três páginas de case: remova `autoplay`, acrescente `data-toca`, mantenha o resto dos atributos como está.

- [ ] **Passo 3: Escrever o módulo 23**

No fim de `js/app.js`, imediatamente antes do `})();` da última linha, acrescente:

```javascript
  /* ---- 23. o vídeo só toca para quem não pediu silêncio ------------------ */
  // O `autoplay` do HTML não tem como perguntar nada a ninguém: ele toca e
  // pronto. Aqui a pergunta vem antes, e de quebra o vídeo fora da tela não
  // gasta decodificação - mesma economia que o módulo 4 faz com os canvas.
  var videos = document.querySelectorAll('video[data-toca]');
  if (videos.length && !reduced) {
    if ('IntersectionObserver' in window) {
      var ioV = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            // play() devolve promessa e o navegador pode recusar (aba em
            // background, política de mídia). Sem o catch vira erro solto no
            // console de quem abriu o console - justo o público do módulo 17.
            var p = en.target.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            en.target.pause();
          }
        });
      }, { threshold: 0.2 });
      Array.prototype.forEach.call(videos, function (v) { ioV.observe(v); });
    } else {
      Array.prototype.forEach.call(videos, function (v) {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      });
    }
  }
```

- [ ] **Passo 4: Atualizar o índice do arquivo**

No cabeçalho de `js/app.js` (linhas 1-14), acrescente ao fim da lista de módulos, antes da linha de `====`:

```
   23. o vídeo só toca para quem não pediu silêncio
```

E em `README.md`, na linha da seção Estrutura que diz `js/app.js  17 módulos, todos com guarda de prefers-reduced-motion`, troque `17` por `23` — o número já estava desatualizado antes desta tarefa.

- [ ] **Passo 5: Verificar**

```bash
node tools/check.mjs
```

Esperado: nenhuma linha de `autoplay`.

No navegador:
1. Abrir a home e rolar até a grade de games → o vídeo do POV toca ao entrar na tela.
2. DevTools → Rendering → **Emulate CSS media feature prefers-reduced-motion: reduce** → recarregar → o vídeo **não** toca e mostra o primeiro quadro parado.
3. Rolar para longe da grade e voltar → ele pausa e retoma.

- [ ] **Passo 6: Commitar**

```bash
git add index.html projeto-pov.html projeto-dub.html projeto-devtools.html js/app.js README.md
git commit -m "Faz o autoplay dos vídeos respeitar movimento reduzido"
```

---

## Fase 2 — peso

### Tarefa 5: Apagar os assets órfãos

**Arquivos:**
- Apagar: `assets/shots/pov-home.png` (837 KB), `assets/shots/jvb-pessoas.png` (96 KB)
- Modificar: `SHOTS.md`

**Interfaces:**
- Consome: `node tools/check.mjs` da T1.
- Produz: nada.

Nenhuma das duas é referenciada por página alguma — confirmado por varredura em 04/08/2026. A `jvb-pessoas.png` está marcada no `SHOTS.md:72` como reserva descartada; a `pov-home.png` simplesmente sobrou.

- [ ] **Passo 1: Confirmar que são mesmo órfãs antes de apagar**

```bash
grep -rn "pov-home\|jvb-pessoas" --include=*.html --include=*.css --include=*.js .
```

Esperado: **nenhuma saída.** Se aparecer qualquer linha, pare e reavalie — a análise estava errada e o arquivo é usado.

- [ ] **Passo 2: Apagar**

```bash
git rm assets/shots/pov-home.png assets/shots/jvb-pessoas.png
```

`git rm` e não `rm`: o histórico guarda os arquivos, então isso é reversível com um `git revert`.

- [ ] **Passo 3: Atualizar o roteiro de capturas**

Em `SHOTS.md:72`, na linha da `jvb-pessoas.png`, troque o `✅` da última coluna por `🗑 removida em 04/08/2026 (nunca entrou em página)`. Faça o mesmo na linha da `pov-home.png`, se existir; se não existir linha para ela, acrescente uma no mesmo formato da tabela.

- [ ] **Passo 4: Verificar**

```bash
node tools/check.mjs
```

Esperado: as duas linhas `não é referenciado por nenhuma página` sumiram.

- [ ] **Passo 5: Commitar**

```bash
git add SHOTS.md
git commit -m "Remove duas capturas que nenhuma página usava"
```

---

### Tarefa 6: WebP com fallback

**Arquivos:**
- Criar: `tools/otimizar-imagens.py`
- Criar: `assets/shots/*.webp` (11 arquivos, gerados)
- Modificar: `css/style.css:1932,1943,1945` (combinador)
- Modificar: as 9 páginas com `<img>` de captura

**Interfaces:**
- Consome: Python 3.13 com Pillow 11.3 (confirmado instalado em 04/08/2026).
- Produz: cada `<img>` de captura envolvida em `<picture>`.

**O combinador do `.shot` é a armadilha desta tarefa.** [css/style.css:1932](../../../css/style.css#L1932) usa `.shot > img` — filho **direto**. Envolver a imagem em `<picture>` a torna neta do `.shot` e o estilo para de aplicar nas 8 páginas de case: as capturas perdem o filtro de dessaturação e aparecem coloridas o tempo todo. Corrija o CSS **antes** de mexer no HTML.

- [ ] **Passo 1: Corrigir o combinador primeiro**

Em `css/style.css`, nas linhas 1932-1946, troque os quatro seletores de filho direto por descendente:

```css
/* descendente, não filho direto: as capturas moram dentro de um <picture> para
   servir WebP a quem aceita e PNG a quem não aceita, e o `>` parava de alcançar
   a <img> no dia em que o <picture> entrou no meio. */
.shot img,
.shot video {
```

```css
.shot:hover img,
.shot:hover video,
.shot:focus-within img,
.shot:focus-within video { filter: none; }
```

A regra `.shot:not(:has(img, video))` das linhas 1929-1930 **não muda**: `:has()` já busca descendente.

- [ ] **Passo 2: Escrever o conversor**

```python
# Gera um .webp ao lado de cada .png de assets/shots/. Roda uma vez e o
# resultado vai commitado - o site não tem build, então nada disso acontece
# em deploy.
#
# qualidade 82 e method 6: a 82 o dithering de 1 bit não ganha artefato
# visível, e o method 6 é o compressor mais lento e mais eficiente do
# encoder. São 11 arquivos, ninguém tem pressa.
import pathlib
from PIL import Image

SHOTS = pathlib.Path(__file__).resolve().parent.parent / "assets" / "shots"

total_antes = total_depois = 0
for png in sorted(SHOTS.glob("*.png")):
    webp = png.with_suffix(".webp")
    with Image.open(png) as im:
        im.save(webp, "WEBP", quality=82, method=6)
    antes, depois = png.stat().st_size, webp.stat().st_size
    total_antes += antes
    total_depois += depois
    print(f"{png.name:28} {antes // 1024:5} KB -> {depois // 1024:5} KB"
          f"  ({100 - depois * 100 // antes:2}% menor)")

print(f"\ntotal: {total_antes // 1024} KB -> {total_depois // 1024} KB "
      f"({100 - total_depois * 100 // total_antes}% menor)")
```

- [ ] **Passo 3: Rodar e conferir o ganho**

```bash
python tools/otimizar-imagens.py
```

Esperado: 11 linhas e um total. A `sus-home.png` (616 KB) e a `dub-frame.png` (218 KB) devem encolher bastante. **Se algum `.webp` sair maior que o `.png`, não use `<picture>` naquela imagem** — mantenha o `<img>` puro e anote no commit. WebP nem sempre ganha de PNG em imagem de pouquíssimas cores, que é exatamente o caso de um site de 1 bit.

- [ ] **Passo 4: Envolver as imagens em `<picture>`**

Para **cada** `<img>` que aponte para um `.png` de `assets/shots/`, nas 9 páginas, aplique o padrão abaixo. Exemplo com `index.html:260`:

```html
            <picture>
              <source srcset="assets/shots/jvb-painel.webp" type="image/webp" />
              <img class="card__shot" src="assets/shots/jvb-painel.png"
                   width="1440" height="900" alt="" loading="lazy" />
            </picture>
```

Regras que valem para todas:
- O `<img>` **não muda** — mesma classe, mesmo `src`, mesmos `width`/`height`, mesmo `alt`, mesmo `loading`. Quem não entende WebP recebe exatamente o que recebia antes.
- O `<source>` vem **antes** do `<img>`; o navegador lê em ordem e para no primeiro que entende.
- `<picture>` não aceita `class` útil aqui: todo o estilo está na `<img>` e no pai.
- Os `<video>` **não** entram em `<picture>` — não existe fallback de formato para eles nesta tarefa.

São 20 ocorrências no total (8 na home, 12 nas páginas de case). Trabalhe página por página.

- [ ] **Passo 5: Verificar**

```bash
node tools/check.mjs
```

Esperado: continua sem falha nova (o check não olha `<picture>`, mas as regras de `width`/`height` seguem valendo e não podem quebrar).

No navegador, para cada uma das 9 páginas:
1. DevTools → Network → filtro Img → recarregar. As capturas devem chegar como `.webp`.
2. Passar o cursor sobre uma captura numa página de case → ela precisa **sair do cinza e aparecer em cor**. Se continuar cinza, o combinador do Passo 1 não foi corrigido direito.
3. Network → botão de throttling → conferir que o peso total da home caiu.

- [ ] **Passo 6: Commitar**

```bash
git add tools/otimizar-imagens.py assets/shots/*.webp css/style.css *.html
git commit -m "Serve WebP com fallback PNG nas capturas"
```

---

### Tarefa 7: Fontes auto-hospedadas

**Arquivos:**
- Criar: `assets/fontes/*.woff2`
- Modificar: `css/style.css` (bloco `@font-face` novo, antes de `:root`)
- Modificar: as 11 páginas + `assets/og-card.html`

**Interfaces:**
- Consome: `node tools/check.mjs` da T1.
- Produz: nenhuma página referencia `fonts.googleapis.com`.

As quatro famílias: **Silkscreen** (400, 700), **Pixelify Sans** (variável 400-700), **Space Grotesk** (variável 300-700), **Space Mono** (400, 700). As três primeiras são SIL Open Font License, a Space Mono também — todas podem ser hospedadas junto. Mantenha o arquivo de licença.

- [ ] **Passo 1: Baixar os arquivos**

Baixe os `.woff2` de [github.com/google/fonts](https://github.com/google/fonts) (pastas `ofl/silkscreen`, `ofl/pixelifysans`, `ofl/spacegrotesk`, `ofl/spacemono`) ou pelo [google-webfonts-helper](https://gwfh.mranftl.com/fonts), escolhendo charset **latin** e **latin-ext** (o site é em português: `ç`, `ã`, `ê` estão em latin-ext).

Salve em `assets/fontes/` com estes nomes exatos — o CSS do passo 2 depende deles:

```
silkscreen-400.woff2
silkscreen-700.woff2
pixelify-sans-var.woff2
space-grotesk-var.woff2
space-mono-400.woff2
space-mono-700.woff2
```

Salve também o `OFL.txt` de cada família como `assets/fontes/OFL-<familia>.txt`. A licença exige que ela acompanhe o arquivo redistribuído.

- [ ] **Passo 2: Declarar as fontes no CSS**

No topo de `css/style.css`, **antes** do bloco `:root`, acrescente:

```css
/* ---------- 0. FONTES ---------------------------------------------------- */
/* Auto-hospedadas: o Google Fonts punha um terceiro domínio no caminho crítico
   de todo carregamento, e o masthead do hero é medido em JS depois que a fonte
   chega (módulo 9) - ou seja, o maior elemento da tela esperava uma conexão
   externa para tomar o tamanho certo. São fontes bitmap, arquivos pequenos.
   Todas sob SIL Open Font License; as licenças estão em assets/fontes/. */
@font-face {
  font-family: 'Silkscreen';
  src: url('../assets/fontes/silkscreen-400.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Silkscreen';
  src: url('../assets/fontes/silkscreen-700.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Pixelify Sans';
  src: url('../assets/fontes/pixelify-sans-var.woff2') format('woff2-variations');
  font-weight: 400 700;
  font-display: swap;
}
@font-face {
  font-family: 'Space Grotesk';
  src: url('../assets/fontes/space-grotesk-var.woff2') format('woff2-variations');
  font-weight: 300 700;
  font-display: swap;
}
@font-face {
  font-family: 'Space Mono';
  src: url('../assets/fontes/space-mono-400.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Space Mono';
  src: url('../assets/fontes/space-mono-700.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
```

- [ ] **Passo 3: Trocar os `<link>` nas 11 páginas**

Em **cada** página, apague as três linhas de fonte (os dois `preconnect` e o `stylesheet` do Google) e ponha no lugar:

```html
<!-- só as duas do topo da página: a Space Grotesk é o corpo de texto e a
     Pixelify o nome do hero, então elas bloqueiam o primeiro desenho. As
     outras duas chegam pelo @font-face quando o CSS pedir. -->
<link rel="preload" href="assets/fontes/space-grotesk-var.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="assets/fontes/pixelify-sans-var.woff2" as="font" type="font/woff2" crossorigin />
```

Em `index.html` e `404.html`, use as duas linhas acima. Nas outras 9 páginas (que não carregam Pixelify), use **só** a linha da Space Grotesk, e no lugar da segunda ponha:

```html
<link rel="preload" href="assets/fontes/silkscreen-400.woff2" as="font" type="font/woff2" crossorigin />
```

Em `assets/og-card.html:22`, o caminho é relativo à própria pasta: troque o `<link>` do Google por nada e acrescente `<link rel="stylesheet" href="../css/style.css" />` se ele ainda não tiver. Esse arquivo não é servido a visitante, só usado para gerar a imagem de compartilhamento.

- [ ] **Passo 4: Verificar**

```bash
node tools/check.mjs
```

Esperado: nenhuma linha `ainda busca fonte no Google`.

No navegador, na home:
1. DevTools → Network → filtro Font → recarregar. Só devem aparecer requisições para `localhost`, nenhuma para `fonts.gstatic.com`.
2. O nome "Luan Taraschi" no hero precisa aparecer em Pixelify Sans, encostando nas duas bordas da coluna. Se aparecer em fonte de sistema ou com largura errada, o `@font-face` não casou com o `--font-title` — confira o `font-family` exato, com maiúsculas e tudo.
3. Recarregar com cache desligado e olhar se há salto de tipografia. Com `font-display: swap` um flash breve é esperado e aceitável.
4. Repetir o item 2 em `sobre.html` e numa página de case (lá o h1 usa Silkscreen).

- [ ] **Passo 5: Commitar**

```bash
git add assets/fontes css/style.css *.html assets/og-card.html
git commit -m "Auto-hospeda as quatro fontes e tira o Google do caminho crítico"
```

---

## Fase 3 — descoberta

### Tarefa 8: robots.txt e sitemap.xml

**Arquivos:**
- Criar: `robots.txt`, `sitemap.xml`

**Interfaces:**
- Consome: `node tools/check.mjs` da T1.
- Produz: nada.

- [ ] **Passo 1: Rodar a verificação**

```bash
node tools/check.mjs
```

Esperado: `robots.txt: não existe`, `sitemap.xml: não existe` e 10 linhas `sitemap.xml: não lista ...`.

- [ ] **Passo 2: Criar o robots.txt**

```
User-agent: *
Allow: /

Sitemap: https://luantaraschi.dev/sitemap.xml
```

- [ ] **Passo 3: Criar o sitemap.xml**

`404.html` fica de fora de propósito: página de erro não se indexa.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://luantaraschi.dev/</loc><priority>1.0</priority></url>
  <url><loc>https://luantaraschi.dev/sobre.html</loc><priority>0.8</priority></url>
  <url><loc>https://luantaraschi.dev/projeto-jvb.html</loc><priority>0.9</priority></url>
  <url><loc>https://luantaraschi.dev/projeto-triagem.html</loc><priority>0.9</priority></url>
  <url><loc>https://luantaraschi.dev/projeto-devtools.html</loc><priority>0.7</priority></url>
  <url><loc>https://luantaraschi.dev/projeto-gesture.html</loc><priority>0.7</priority></url>
  <url><loc>https://luantaraschi.dev/projeto-dub.html</loc><priority>0.7</priority></url>
  <url><loc>https://luantaraschi.dev/projeto-soms.html</loc><priority>0.6</priority></url>
  <url><loc>https://luantaraschi.dev/projeto-sus.html</loc><priority>0.6</priority></url>
  <url><loc>https://luantaraschi.dev/projeto-pov.html</loc><priority>0.6</priority></url>
</urlset>
```

Sem `<lastmod>`: data errada é pior que data ausente, e manter dez datas na mão a cada commit é promessa que ninguém cumpre.

- [ ] **Passo 4: Verificar**

```bash
node tools/check.mjs
```

Esperado: as 12 linhas de sitemap/robots sumiram.

```bash
python -c "import xml.dom.minidom; xml.dom.minidom.parse('sitemap.xml'); print('XML válido')"
```

Esperado: `XML válido`.

- [ ] **Passo 5: Commitar**

```bash
git add robots.txt sitemap.xml
git commit -m "Adiciona robots.txt e sitemap.xml"
```

---

### Tarefa 9: JSON-LD

**Arquivos:**
- Modificar: `index.html` (Person), `sobre.html` + 8 `projeto-*.html` (Article)

**Interfaces:**
- Consome: `node tools/check.mjs` da T1.
- Produz: nada.

- [ ] **Passo 1: Person na home**

Em `index.html`, logo antes de `</head>` (linha 44), acrescente:

```html
<!-- É o que liga o nome ao GitHub e ao LinkedIn na cabeça do buscador. Os
     dados repetem o que já está visível na página de propósito: dado
     estruturado que afirma o que a página não mostra é o que faz o Google
     desconfiar do resto. -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Luan Taraschi",
  "url": "https://luantaraschi.dev/",
  "image": "https://luantaraschi.dev/assets/og.png",
  "jobTitle": "Desenvolvedor Full Stack",
  "email": "mailto:luantaraschi@gmail.com",
  "telephone": "+5571984675555",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Salvador",
    "addressRegion": "BA",
    "addressCountry": "BR"
  },
  "alumniOf": {
    "@type": "CollegeOrUniversity",
    "name": "Universidade Católica do Salvador"
  },
  "knowsLanguage": ["pt-BR", "en"],
  "knowsAbout": [
    "React", "Next.js", "Node.js", "TypeScript", "Python",
    "PostgreSQL", "Docker", "LangGraph", "Agentes de IA", "Automação"
  ],
  "sameAs": [
    "https://github.com/luantaraschi",
    "https://www.linkedin.com/in/luantaraschi/",
    "https://www.instagram.com/luantaraschi/"
  ]
}
</script>
```

- [ ] **Passo 2: Article nas 9 páginas internas**

Em cada `projeto-*.html` e em `sobre.html`, logo antes de `</head>`, acrescente o bloco abaixo trocando os três valores marcados pelos da própria página — copie do `<title>`, da `<meta name="description">` e do `<link rel="canonical">` que já estão no `<head>` dela:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "COPIAR DO og:title DESTA PÁGINA",
  "description": "COPIAR DA meta description DESTA PÁGINA",
  "url": "COPIAR DO canonical DESTA PÁGINA",
  "image": "https://luantaraschi.dev/assets/og.png",
  "inLanguage": "pt-BR",
  "author": {
    "@type": "Person",
    "name": "Luan Taraschi",
    "url": "https://luantaraschi.dev/"
  }
}
</script>
```

Exemplo pronto, para `projeto-jvb.html`:

```json
  "headline": "JVB · ERP jurídico sob medida",
  "description": "Estudo de caso: ERP jurídico em produção construído por um desenvolvedor único. 124 tabelas, 881 endpoints tipados, 3.500 testes automatizados. TypeScript, React 19, tRPC, PostgreSQL, Railway.",
  "url": "https://luantaraschi.dev/projeto-jvb.html",
```

`404.html` **não** recebe JSON-LD.

- [ ] **Passo 3: Verificar**

```bash
node tools/check.mjs
```

Esperado: nenhuma linha `sem JSON-LD`.

Validar que cada bloco é JSON legítimo — vírgula sobrando passa despercebida a olho e invalida o bloco inteiro:

```bash
node -e "const fs=require('fs');for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.html')&&f!=='404.html')){const m=fs.readFileSync(f,'utf8').match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/);if(!m){console.log('SEM JSON-LD:',f);continue}try{JSON.parse(m[1]);console.log('ok',f)}catch(e){console.log('JSON INVÁLIDO:',f,e.message)}}"
```

Esperado: `ok` em todas as 10.

Depois do deploy, passar a home no [Rich Results Test](https://search.google.com/test/rich-results) do Google.

- [ ] **Passo 4: Commitar**

```bash
git add *.html
git commit -m "Adiciona dados estruturados Person e Article"
```

---

## Fase 4 — conteúdo

### Tarefa 10: Links "no ar" nos cards

**Arquivos:**
- Modificar: `index.html:293,385,402` (tags dos cards devtools, sus, pov)
- Modificar: `css/style.css` (nova regra `.tag--ar`, junto de `.tag--visto` na linha 812)

**Interfaces:**
- Consome: a classe `.tag` existente ([css/style.css:798](../../../css/style.css#L798)).
- Produz: nada.

**Problema de aninhamento:** o card inteiro **já é** um `<a>` ([index.html:284](../../../index.html#L284)). HTML não permite `<a>` dentro de `<a>` — o navegador desmonta o markup silenciosamente e o card para de funcionar. Então o link externo **não** pode ser um `<a>` dentro do card. A saída é uma tag visual que anuncia o link, com o URL real vivendo só na página do case.

- [ ] **Passo 1: Trocar as tags "no ar" pela versão que aponta**

Em `index.html:293`, troque:

```html
            <div class="card__tags"><span class="tag">Next.js 15</span><span class="tag">React 19</span><span class="tag">no ar</span></div>
```

por:

```html
            <div class="card__tags"><span class="tag">Next.js 15</span><span class="tag">React 19</span><span class="tag tag--ar">no ar · link no case</span></div>
```

Em `index.html:385` (SUS) e `index.html:402` (POV), faça o mesmo com a tag `no ar` de cada um.

Um `<a>` de verdade aqui quebraria o card, porque o card já é um link. A tag diz onde o link está e o case entrega ele em `<dt>Link</dt>` — que é onde ele já mora hoje, em [projeto-sus.html:92](../../../projeto-sus.html#L92), [projeto-pov.html:92](../../../projeto-pov.html#L92) e [projeto-devtools.html:92](../../../projeto-devtools.html#L92).

- [ ] **Passo 2: Dar destaque à tag**

Em `css/style.css`, logo depois do bloco `.tag--visto` (linha 812-816), acrescente:

```css
/* "no ar" é a única tag que promete uma coisa clicável, e ela não pode ser um
   <a>: o card inteiro já é um link e HTML não aninha âncora. Então ela ao menos
   se veste de link - borda cheia em vez do traço apagado das tecnologias ao
   lado, pra olho que varre a grade parar nela. */
.tag--ar {
  border-color: var(--ink);
  color: var(--ink);
}
```

- [ ] **Passo 3: Verificar**

```bash
node tools/check.mjs
```

Esperado: nenhuma falha nova.

No navegador, na home: as três tags precisam se destacar das tags de tecnologia vizinhas nos **dois** temas — clique no interruptor e confira. E clique num dos três cards: ele tem de continuar navegando normalmente para o case (a prova de que nenhum `<a>` foi aninhado).

- [ ] **Passo 4: Commitar**

```bash
git add index.html css/style.css
git commit -m "Sinaliza nos cards que o projeto tem link jogável no case"
```

---

### Tarefa 11: Copy do POV e numeração dos games

**Arquivos:**
- Modificar: `index.html:349` (kicker), `index.html:367,381,395` (índices), `index.html:401` (copy)

**Interfaces:**
- Consome: nada.
- Produz: nada.

Dois problemas na mesma seção. O card do POV ([index.html:401](../../../index.html#L401)) descreve o framework em vez do jogo — é o único dos oito que faz isso, e por isso lê como o mais fraco sem ser. E a numeração dos games segue 06, 07, 08 embaixo de um kicker que diz "03 itens".

- [ ] **Passo 1: Reescrever a descrição do POV**

**PENDENTE DE DADO EXTERNO:** o texto abaixo descreve um jogo de "point of view" genérico. Se a mecânica do POV for outra, o Luan corrige — mas o **formato** é o que importa e não muda: primeiro o que acontece quando você joga, depois a nota técnica.

Em `index.html:401`, troque:

```html
            <p class="mono">O mais recente da prateleira, e o único fora do React: Svelte com Convex atrás.</p>
```

por:

```html
            <p class="mono">Todo mundo responde a mesma pergunta achando que conhece o grupo, e o placar mostra quem errou feio sobre quem. O mais recente da prateleira, e o único fora do React.</p>
```

O padrão dos outros sete: o SOMS diz "toca um trecho e todo mundo corre pra acertar", o SUS diz "todo mundo recebe a mesma palavra, menos um". Primeiro a experiência, depois a stack — que aliás já está nas tags logo abaixo.

- [ ] **Passo 2: Reiniciar a numeração dos games**

Em `index.html`, troque os três `card__idx`:
- linha 367: `06` → `01`
- linha 381: `07` → `02`
- linha 395: `08` → `03`

A seção de games é uma prateleira própria — o texto do kicker em [index.html:353-358](../../../index.html#L353) diz isso com todas as letras ("eles não disputam com os projetos de produção"). Numeração contínua entre as duas contradiz a separação que o próprio bloco anuncia.

- [ ] **Passo 3: Verificar**

```bash
node tools/check.mjs
```

Esperado: nenhuma falha nova.

No navegador: a seção de games mostra 01, 02, 03 sob o kicker "games/ · 03 itens", e a de projetos segue 01 a 05 com o card `++` sem número. Leia os oito cards em sequência — nenhum deve destoar em formato.

- [ ] **Passo 4: Commitar**

```bash
git add index.html
git commit -m "Descreve o POV pelo jogo e reinicia a numeração dos games"
```

---

### Tarefa 12: Stack coerente com os cases

**Arquivos:**
- Modificar: `index.html:418-449` (os quatro cartões de skill)

**Interfaces:**
- Consome: nada.
- Produz: nada.

O bloco Stack lista Java, n8n, Agno e Hermes — que não aparecem em case nenhum. E **não** lista TypeScript, tRPC, Drizzle, Convex, Socket.IO nem Whisper — que são a espinha dos oito cases. **TypeScript ausente é o mais grave:** o case principal ([projeto-jvb.html:91](../../../projeto-jvb.html#L91)) é TypeScript de ponta a ponta com 881 procedures tipadas, e quem lê a home não fica sabendo.

O critério: **o que aparece em case fica; o que não aparece, ou sai, ou entra em uma linha à parte.** Nada de inflar a lista.

- [ ] **Passo 1: Reescrever os quatro cartões**

Em `index.html:418-449`, troque o conteúdo dos quatro `<p>` (o markup em volta não muda):

Front-end (linha 424):
```html
          <p>TypeScript · React · Next.js · Svelte · HTML · CSS</p>
```

Back-end (linha 432):
```html
          <p>Node.js · tRPC · Python · APIs REST e tempo real</p>
```

Dados &amp; infra (linha 440):
```html
          <p>PostgreSQL · Drizzle · Convex · Docker · Git · deploy em produção</p>
```

IA &amp; automação (linha 448):
```html
          <p>LangChain · LangGraph · Whisper · MCP · n8n · Claude Code</p>
```

O que saiu e por quê: **Java** (não aparece em case nenhum e você não se posiciona por ele), **Agno** e **Hermes** (mesma razão, e ninguém que contrata reconhece os nomes). O que entrou: **TypeScript**, **Svelte** (POV), **tRPC** e **Drizzle** (JVB), **Convex** (SUS e POV), **Whisper** (Dub), **MCP** (citado na timeline em [index.html:542](../../../index.html#L542)). O `Socket.IO` do SOMS ficou de fora para o cartão não virar lista de tudo — o card do projeto já o carrega.

- [ ] **Passo 2: Conferir a coerência de ponta a ponta**

Para cada tecnologia listada nos quatro cartões, confirme que ela aparece em pelo menos um case ou na timeline:

```bash
grep -o "TypeScript\|React\|Next\.js\|Svelte\|Node\.js\|tRPC\|Python\|PostgreSQL\|Drizzle\|Convex\|Docker\|LangChain\|LangGraph\|Whisper\|MCP\|n8n\|Claude Code" projeto-*.html index.html | sort -u
```

Esperado: toda tecnologia dos cartões aparece na saída. Se alguma só aparecer em `index.html` e em nenhum `projeto-*.html`, ela precisa estar na timeline — confira à mão. Se não estiver em lugar nenhum, tire do cartão.

- [ ] **Passo 3: Verificar**

```bash
node tools/check.mjs
```

Esperado: nenhuma falha nova. No navegador, os quatro cartões continuam com a mesma altura e nenhum texto quebra feio no celular (teste em 360px de largura no DevTools).

- [ ] **Passo 4: Commitar**

```bash
git add index.html
git commit -m "Alinha o bloco de stack com o que os cases realmente usam"
```

---

### Tarefa 13: Estrutura de depoimento

**Arquivos:**
- Modificar: `index.html` (bloco novo depois da seção de projetos, antes de `#games`)
- Modificar: `css/style.css` (componente `.prova`, depois do bloco `.tag--visto`)

**Interfaces:**
- Consome: os tokens `--ink`, `--paper`, `--rule-soft`, `--font-mono`; a classe `.reveal` do módulo 5 do JS; a classe `.slot` de [css/style.css:375](../../../css/style.css#L375) ("placeholder honesto").
- Produz: nada.

**PENDENTE DE DADO EXTERNO.** O Luan vai fornecer a citação real. Esta tarefa entrega o componente e deixa o bloco **comentado** no HTML — não publique depoimento inventado. `.slot` existe justamente para isso e já está no vocabulário do CSS.

- [ ] **Passo 1: Escrever o componente**

Em `css/style.css`, depois do bloco `.tag--ar` da T10, acrescente:

```css
/* 5.6b prova social
   Uma citação só, e larga. Duas ou três viravam parede de elogio, que é o
   formato que ninguém lê porque ninguém acredita. A moldura é a mesma dos
   cards - borda de 2px e sombra dura - pra não parecer widget colado de fora. */
.prova {
  border: 2px solid var(--ink);
  box-shadow: var(--shadow);
  background: var(--paper);
  padding: clamp(26px, 4vw, 44px);
  margin-top: clamp(34px, 5vw, 56px);
  max-width: 68ch;
}
.prova blockquote {
  margin: 0;
  font-size: clamp(18px, 2.2vw, 24px);
  line-height: 1.45;
  text-wrap: pretty;
}
.prova figcaption {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--rule-soft);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-2);
}
```

- [ ] **Passo 2: Plantar o bloco comentado**

Em `index.html`, entre o `</div>` que fecha a `.grid-projects` da seção de projetos (linha 339) e o `</div>` do `.wrap` (linha 340), acrescente:

```html
        <!-- PROVA SOCIAL - descomentar quando o depoimento chegar.
             Uma citação só: o site afirma "cinco clientes" em três lugares e
             não mostra ninguém dizendo nada. Uma frase de cliente vale mais que
             os três parágrafos de "como eu trabalho", porque é a única coisa da
             página que não sou eu falando de mim.
             Não publicar com texto inventado - se não houver citação real, o
             bloco fica comentado. Elogio fabricado é a única coisa aqui que
             custaria mais caro que a ausência dele.
        <figure class="prova reveal">
          <blockquote>
            <p>CITAÇÃO REAL DO CLIENTE, UMA A TRÊS FRASES.</p>
          </blockquote>
          <figcaption>NOME OU CARGO · ESCRITÓRIO OU EMPRESA</figcaption>
        </figure>
        -->
```

O `.reveal` entra na conta do módulo 5 do JS ([js/app.js:466](../../../js/app.js#L466)) automaticamente quando for descomentado — nenhuma mudança de JS é necessária.

- [ ] **Passo 3: Verificar o componente antes de guardar**

Descomente o bloco temporariamente, ponha um texto qualquer de teste e confira no navegador:
1. A moldura combina com os cards ao lado, nos **dois** temas.
2. A citação não passa de ~68 caracteres por linha no desktop.
3. Em 360px de largura o padding não engole o texto.
4. O bloco entra com a animação de revelação ao rolar.

Depois **comente de volta** e apague o texto de teste. O que vai para o commit é o bloco comentado.

```bash
node tools/check.mjs
```

Esperado: nenhuma falha nova.

- [ ] **Passo 4: Commitar**

```bash
git add index.html css/style.css
git commit -m "Prepara o bloco de depoimento, comentado até haver citação real"
```

---

## Fase 5 — fundação para a versão em inglês

### Tarefa 14: hreflang e estrutura

**Arquivos:**
- Modificar: as 10 páginas indexáveis (`<head>`)
- Criar: `docs/superpowers/plans/2026-08-04-versao-em-ingles.md` (esboço do próximo plano)

**Interfaces:**
- Consome: `node tools/check.mjs` da T1.
- Produz: `hreflang` apontando para `/en/` — os arquivos de destino ainda **não existem**.

**Esta tarefa não traduz nada.** Ela declara a intenção para o buscador e escreve o plano seguinte. A tradução das 10 páginas é um plano próprio, por decisão tomada em 04/08/2026.

**Atenção:** `hreflang` apontando para URL que dá 404 é pior que não ter `hreflang` — o Google reporta como erro no Search Console e ignora o par inteiro. Por isso o Passo 2 é obrigatório e não opcional.

- [ ] **Passo 1: Declarar os pares em cada página**

Em cada uma das 10 páginas indexáveis (todas menos `404.html`), logo **depois** do `<link rel="canonical">`, acrescente o bloco abaixo trocando `NOME.html` pelo nome do arquivo da própria página.

Na home, `NOME.html` some e sobra a barra: os três `href` viram `https://luantaraschi.dev/`, `https://luantaraschi.dev/en/` e `https://luantaraschi.dev/`. Em `projeto-jvb.html`, viram `https://luantaraschi.dev/projeto-jvb.html`, `https://luantaraschi.dev/en/projeto-jvb.html` e `https://luantaraschi.dev/projeto-jvb.html`.

```html
<!-- O par de idiomas. O /en/ ainda não existe: enquanto não existir, estas duas
     linhas ficam COMENTADAS. hreflang apontando para 404 é erro no Search
     Console e faz o Google descartar o par inteiro, o que é pior que o silêncio.
<link rel="alternate" hreflang="pt-BR" href="https://luantaraschi.dev/NOME.html" />
<link rel="alternate" hreflang="en" href="https://luantaraschi.dev/en/NOME.html" />
<link rel="alternate" hreflang="x-default" href="https://luantaraschi.dev/NOME.html" />
-->
```

- [ ] **Passo 2: Ajustar a verificação à realidade**

O check da T1 exige `hreflang` presente, mas o Passo 1 deixa tudo comentado — de propósito. Em `tools/check.mjs`, troque o bloco `--- 8. hreflang ---` inteiro por:

```javascript
// --- 8. hreflang preparado para a versão em inglês ---
// Enquanto /en/ não existe, o par fica comentado no HTML: hreflang apontando
// para 404 é erro no Search Console. O que se exige aqui é que o comentário
// exista com o caminho certo, pronto para descomentar em uma linha.
// Quando /en/ for ao ar, troque este bloco por uma exigência de <link> de
// verdade - e aí o comentário vira o que ele sempre foi, um lembrete cumprido.
for (const [nome, src] of html) {
  if (nome === '404.html') continue;
  const alvo = nome === 'index.html' ? 'luantaraschi.dev/en/"' : `en/${nome}"`;
  exigir(src.includes('hreflang="en"'), `${nome}: sem o par hreflang preparado`);
  exigir(src.includes(alvo), `${nome}: o hreflang de inglês não aponta para ${alvo}`);
}
```

- [ ] **Passo 3: Esboçar o plano seguinte**

Crie `docs/superpowers/plans/2026-08-04-versao-em-ingles.md`:

```markdown
# Versão em Inglês — Esboço

**Status:** não iniciado. Depende de decisão de conteúdo do Luan.

**Por que existe:** o site afirma "Inglês fluente" na ficha do hero e "Respondo
em português ou inglês" no contato, e é `lang="pt-BR"` de ponta a ponta. Para
vaga remota internacional, é o maior buraco do repositório — vale mais que
todos os itens de interface do plano de 04/08/2026 somados.

**Escopo:** 10 páginas em `/en/`, mesma estrutura de arquivos, `lang="en"`,
`hreflang` recíproco nos dois lados, e um seletor de idioma na barra de
navegação ao lado do interruptor de tema.

**Decisões pendentes antes de escrever o plano de verdade:**
1. Tradução ou reescrita? O texto em português tem voz muito própria
   ("Bora conversar", "cutuca", "feito por mim, com muito amor"). Tradução
   literal mata isso. Reescrever custa mais e é quase certamente o certo.
2. Os oito cases inteiros, ou só home + os dois de produção (JVB e triagem)?
3. O `sobre.html` é uma história pessoal de dez capítulos. Traduz, encurta,
   ou fica só em português com aviso?
4. O CV em PDF também ganha versão em inglês?

**Ao começar:** descomentar os três `<link rel="alternate">` das 10 páginas
(plantados na Tarefa 14 do plano de 04/08/2026) e atualizar o bloco 8 de
`tools/check.mjs` para exigir `<link>` de verdade em vez do comentário.
```

- [ ] **Passo 4: Verificar**

```bash
node tools/check.mjs
```

Esperado: **`OK: 11 páginas, nenhuma falha.`** — este é o momento em que o plano inteiro fecha. Se sobrar qualquer linha, alguma tarefa anterior ficou pela metade; volte nela antes de commitar.

- [ ] **Passo 5: Commitar**

```bash
git add *.html tools/check.mjs docs/
git commit -m "Prepara o par hreflang e esboça o plano da versão em inglês"
```

---

## Encerramento

- [ ] **Verificação final completa**

```bash
node tools/check.mjs
```

Esperado: `OK: 11 páginas, nenhuma falha.`

- [ ] **Passar as 11 páginas no navegador**, nos dois temas, em 360px e em 1440px. Cada uma precisa: carregar sem erro no console, trocar de tema sem piscar, e navegar por teclado com o anel de foco visível em todo elemento interativo.

- [ ] **Lighthouse na home**, modo Mobile. Anotar Performance, Accessibility, Best Practices e SEO. As correções deste plano atacam CLS (T3), peso (T5, T6), caminho crítico (T7) e SEO (T8, T9) — se algum desses quatro não subiu, investigue antes de dar por encerrado.

- [ ] **Pendências de dado externo**, todas do Luan:
  - **T2:** endpoint real do Formspree (substituir `SUBSTITUIR` em `index.html` e `js/app.js` — os dois).
  - **T11:** confirmar se a descrição do POV corresponde à mecânica real do jogo.
  - **T13:** citação de cliente para descomentar o bloco `.prova`.

- [ ] **Push**

```bash
git push origin main
```
