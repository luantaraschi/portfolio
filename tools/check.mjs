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
