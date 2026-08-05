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
//
// Sem os comentários: eles falam sobre autoplay justamente para explicar por que
// ele não está ali, e a primeira versão desta checagem acusava a explicação.
for (const [nome, src] of html) {
  const semComentario = src.replace(/<!--[\s\S]*?-->/g, '');
  exigir(!/\bautoplay\b/.test(semComentario),
    `${nome}: autoplay no HTML ignora prefers-reduced-motion`);
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
// Existir não basta: uma vírgula sobrando invalida o bloco inteiro, o Google
// descarta em silêncio e a página fica com a aparência de quem tem dado
// estruturado sem ter. Então aqui o JSON é realmente parseado.
for (const [nome, src] of html) {
  if (nome === '404.html') continue;
  const bloco = src.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!bloco) { falhas.push(`${nome}: sem JSON-LD`); continue; }
  try {
    const dados = JSON.parse(bloco[1]);
    exigir(dados['@context'] === 'https://schema.org', `${nome}: JSON-LD sem @context do schema.org`);
    exigir(typeof dados['@type'] === 'string', `${nome}: JSON-LD sem @type`);
  } catch (e) {
    falhas.push(`${nome}: JSON-LD não é JSON válido (${e.message})`);
  }
}

// --- 7. fontes auto-hospedadas ---
for (const [nome, src] of html) {
  exigir(!src.includes('fonts.googleapis.com'),
    `${nome}: ainda busca fonte no Google (domínio de terceiro no caminho crítico)`);
}

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

// --- 9. a caminhada entre os cases não tem beco sem saída ---
// Cada case aponta pro seguinte pelo nome, e por um tempo o Dev Tools apontava
// pra grade em vez do Gesture: quem lia na ordem nunca chegava no quarto e no
// quinto projeto. Nada quebra visivelmente quando isso acontece, e é por isso
// que ficou assim por tanto tempo.
{
  const CADEIA = [
    'projeto-jvb.html', 'projeto-triagem.html', 'projeto-devtools.html',
    'projeto-gesture.html', 'projeto-dub.html', 'projeto-soms.html',
    'projeto-sus.html', 'projeto-pov.html',
  ];
  CADEIA.forEach((pagina, i) => {
    const proximo = CADEIA[i + 1];
    if (!proximo) return;
    const nav = html.get(pagina).match(/<nav class="case__nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
    exigir(nav.includes(`href="${proximo}"`),
      `${pagina}: a navegação não leva ao próximo case (${proximo})`);
  });
}

// --- 10. todo bloco de código aponta para o arquivo de onde ele saiu ---
// A fidelidade linha a linha é conferida contra o GitHub por
// tools/conferir-codigo.py, que precisa de rede. Aqui fica o que dá para
// exigir offline: o bloco existe, tem nome de arquivo, tem link pro
// repositório, e é alcançável por teclado - `overflow-x` sem `tabindex`
// deixa quem não usa mouse sem chegar ao fim da linha.
for (const [nome, src] of html) {
  for (const bloco of src.match(/<figure class="codigo[\s\S]*?<\/figure>/g) ?? []) {
    exigir(/<span class="panel__title">[^<]+\.\w+<\/span>/.test(bloco),
      `${nome}: bloco de código sem nome de arquivo na barra`);
    // link pro repositório quando ele é público; quando é privado, a etiqueta
    // dizendo isso - o que não pode é o trecho aparecer sem procedência
    exigir(/class="codigo__repo"[^>]*href="https:\/\/github\.com\//.test(bloco)
        || /class="codigo__repo"[^>]*>[^<]*privado/.test(bloco),
      `${nome}: bloco de código sem procedência (link do repo ou aviso de privado)`);
    exigir(/<pre[^>]*\btabindex="0"/.test(bloco),
      `${nome}: bloco de código não alcançável por teclado (falta tabindex="0")`);
    exigir(/<pre[^>]*\baria-label="/.test(bloco),
      `${nome}: bloco de código sem aria-label dizendo o que ele mostra`);
  }
}

if (falhas.length) {
  console.error(`\n${falhas.length} falha(s):\n`);
  for (const f of falhas) console.error(`  x ${f}`);
  process.exit(1);
}
console.log(`OK: ${PAGINAS.length} páginas, nenhuma falha.`);
