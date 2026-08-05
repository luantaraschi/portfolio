// Verificação estrutural das páginas. Zero dependência: roda com `node tools/check.mjs`
// em qualquer máquina com Node 20+. Não é carregado pelo site.
//
// Cada checagem aqui nasceu de um problema real encontrado na revisão de
// 04/08/2026. Elas ficam depois de resolvidas: o custo de manter é zero e o
// custo de reintroduzir qualquer um deles é uma página quebrada em produção.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const PT = [
  'index.html', 'sobre.html', '404.html',
  'projeto-jvb.html', 'projeto-triagem.html', 'projeto-devtools.html',
  'projeto-gesture.html', 'projeto-dub.html', 'projeto-soms.html',
  'projeto-sus.html', 'projeto-pov.html',
];
// A versão em inglês tem os mesmos nomes de arquivo dentro de /en/. Isso não é
// preguiça: o seletor de idioma é "/en/ mais o nome do arquivo" e o módulo 21
// (o case que você já abriu) casa por nome de arquivo. Slug traduzido pediria
// uma tabela de-para em três lugares, e tabela de-para é onde as coisas
// divergem em silêncio.
const PAGINAS = [...PT, ...PT.map((p) => `en/${p}`)];

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
  // as duas home não têm nome de arquivo na URL: elas são / e /en/
  const HOME = { 'index.html': 'luantaraschi.dev/</loc>', 'en/index.html': 'luantaraschi.dev/en/</loc>' };
  for (const p of PAGINAS.filter((p) => !p.endsWith('404.html'))) {
    exigir(mapa.includes(HOME[p] ?? p), `sitemap.xml: não lista ${p}`);
  }

  // toda URL declara quando mudou, e a data existe de verdade. Sitemap com
  // lastmod errado é pior que sitemap sem lastmod: o Google aprende a não
  // confiar no campo e passa a ignorá-lo no arquivo inteiro. Data no futuro é
  // o sintoma clássico de campo escrito à mão. Quem gera é tools/gerar-sitemap.mjs.
  const urls = mapa.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  exigir(urls.length > 0, 'sitemap.xml: nenhuma <url>');
  const amanha = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  for (const u of urls) {
    const loc = u.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '?';
    const lastmod = u.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    if (!lastmod) { falhas.push(`sitemap.xml: ${loc} sem <lastmod>`); continue; }
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(lastmod),
      `sitemap.xml: ${loc} com lastmod fora do formato AAAA-MM-DD (${lastmod})`);
    exigir(lastmod < amanha, `sitemap.xml: ${loc} com lastmod no futuro (${lastmod})`);
  }
}

// --- 6. dados estruturados ---
// Existir não basta: uma vírgula sobrando invalida o bloco inteiro, o Google
// descarta em silêncio e a página fica com a aparência de quem tem dado
// estruturado sem ter. Então aqui o JSON é realmente parseado.
for (const [nome, src] of html) {
  if (nome.endsWith('404.html')) continue;
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

// --- 8. o par de idiomas fecha nos dois sentidos ---
// O /en/ está no ar, então o hreflang deixou de ser comentário e virou <link>.
// A regra que importa é a reciprocidade: hreflang que só um lado declara o
// Google descarta inteiro, e o sintoma disso é nenhum - as duas páginas
// continuam indexadas, cada uma por conta própria, competindo entre si.
//
// Também se exige aqui que a página em inglês declare `lang="en"` e que a
// portuguesa declare `lang="pt-BR"`: o par hreflang certo com o lang errado é
// contradição, e é o `lang` que o leitor de tela obedece.
for (const [nome, src] of html) {
  const ehEn = nome.startsWith('en/');
  const base = ehEn ? nome.slice(3) : nome;
  const raiz = base === 'index.html' ? '' : base;
  // sem os comentários: o bloco que explica o par fala de hreflang justamente
  // para explicá-lo, e a primeira versão desta checagem acusava a explicação
  const semComentario = src.replace(/<!--[\s\S]*?-->/g, '');

  exigir(new RegExp(`<html lang="${ehEn ? 'en' : 'pt-BR'}"`).test(src),
    `${nome}: <html lang> não corresponde à língua da pasta`);

  if (base === '404.html') {
    // o seletor de idioma da 404 tem `hreflang` como atributo e isso é certo;
    // o que ela não pode ter é <link rel="alternate">, que é o que indexa
    exigir(!semComentario.includes('rel="alternate"'),
      `${nome}: página de erro não entra em par de idiomas`);
    continue;
  }
  const pt = `href="https://luantaraschi.dev/${raiz}"`;
  const en = `href="https://luantaraschi.dev/en/${raiz}"`;
  exigir(semComentario.includes(`hreflang="pt-BR" ${pt}`), `${nome}: hreflang pt-BR não aponta para /${raiz}`);
  exigir(semComentario.includes(`hreflang="en" ${en}`), `${nome}: hreflang en não aponta para /en/${raiz}`);
  exigir(semComentario.includes(`hreflang="x-default" ${pt}`), `${nome}: x-default deveria apontar para o português`);

  // o seletor tem que levar para a página equivalente, e não para a home da
  // outra língua: quem está lendo um case e troca de idioma quer o mesmo case
  const destino = ehEn ? `/${raiz}` : `/en/${raiz}`;
  exigir(src.includes(`<a class="lang" href="${destino}"`),
    `${nome}: o seletor de idioma não aponta para ${destino}`);
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

  // Toda página de case tem saída para a grade nas DUAS pontas. Seis das oito
  // só tinham "anterior" e "próximo" no rodapé: quem entrava por um case do
  // meio (link direto, busca, compartilhamento) só voltava pela barra do topo,
  // e no começo da leitura não havia saída nenhuma. Um case é uma folha da
  // árvore, e folha sem caminho de volta é beco.
  for (const pagina of CADEIA) {
    const src = html.get(pagina);
    exigir(/<a class="case__voltar" href="index\.html#projetos"/.test(src),
      `${pagina}: sem o link de volta no topo do case`);
    const nav = src.match(/<nav class="case__nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
    exigir(nav.includes('href="index.html#projetos"'),
      `${pagina}: o rodapé não oferece caminho de volta para a grade`);
  }
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
        || /class="codigo__repo"[^>]*>[^<]*(privado|private)/.test(bloco),
      `${nome}: bloco de código sem procedência (link do repo ou aviso de privado)`);
    exigir(/<pre[^>]*\btabindex="0"/.test(bloco),
      `${nome}: bloco de código não alcançável por teclado (falta tabindex="0")`);
    exigir(/<pre[^>]*\baria-label="/.test(bloco),
      `${nome}: bloco de código sem aria-label dizendo o que ele mostra`);
  }
}

// --- 11. o hash da CSP corresponde ao script de tema que está nas páginas ---
// A CSP do vercel.json libera o único script inline do site por hash, e não por
// 'unsafe-inline'. Isso é o que faz a política valer alguma coisa, e é também
// uma armadilha: mexer uma vírgula no script de tema invalida o hash, o
// navegador bloqueia o script, e o site passa a abrir sempre no tema escuro com
// um pisca ao carregar. Nada quebra no build, nada aparece em teste local sem
// os headers - só em produção, e discretamente.
//
// A normalização de CRLF para LF não é detalhe: os arquivos aqui estão em CRLF
// (Windows), o git guarda em LF por causa do core.autocrlf, e é o LF que a
// Vercel entrega. O hash tem que ser o dos bytes servidos, não o dos bytes em
// disco. Foi isso que decidiu tirar o hash de produção quando ele foi gerado.
{
  const conf = existsSync(join(RAIZ, 'vercel.json'))
    ? JSON.parse(await readFile(join(RAIZ, 'vercel.json'), 'utf8')) : null;
  if (!conf) {
    falhas.push('vercel.json: não existe (sem ele o site vai ao ar sem CSP e sem cache)');
  } else {
    const csp = conf.headers
      ?.flatMap((r) => r.headers ?? [])
      .find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    exigir(csp !== '', 'vercel.json: sem Content-Security-Policy');
    exigir(!/script-src[^;]*'unsafe-inline'/.test(csp),
      "vercel.json: script-src com 'unsafe-inline' anula a proteção da CSP");

    const declarados = new Set(
      [...csp.matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)].map((m) => m[1]),
    );
    for (const [nome, src] of html) {
      // o script de tema é o único <script> sem atributo nenhum
      const corpo = src.match(/<script>([\s\S]*?)<\/script>/)?.[1];
      if (corpo === undefined) { falhas.push(`${nome}: sem o script de tema`); continue; }
      const hash = 'sha256-' + createHash('sha256')
        .update(corpo.replace(/\r\n/g, '\n'), 'utf8').digest('base64');
      exigir(declarados.has(hash),
        `${nome}: o script de tema (${hash}) não está liberado na CSP do vercel.json`);
    }
  }
}

// --- 12. o favicon é arquivo de verdade, não data: URI ---
// O desenho vivia embutido no <head> como data: URI. Funcionava em todo
// navegador e por isso ninguém percebeu o problema: o Googlebot NÃO busca
// data URI para favicon, e o resultado de busca mostrava o globo genérico.
// O ícone existia e o único que precisava vê-lo nunca via.
// Quem gera os arquivos é tools/gerar-favicon.py.
for (const [nome, src] of html) {
  const icones = src.match(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g) ?? [];
  exigir(icones.length > 0, `${nome}: sem <link rel="icon">`);
  for (const tag of icones) {
    exigir(!/href="data:/.test(tag),
      `${nome}: favicon em data: URI - o Google não busca, cai no globo genérico`);
    const href = tag.match(/href="([^"]+)"/)?.[1] ?? '';
    exigir(existsSync(join(RAIZ, href.replace(/^\//, ''))),
      `${nome}: o favicon ${href} não existe no repositório`);
  }
}

// --- 13. o <head> só contém o que pode morar no <head> ---
// Nasceu de um estrago real: a troca do favicon foi feita com uma regex que
// terminava em `.*?/>`, e o data: URI que ela devia remover tinha `/>` DENTRO
// dele, nos <rect> do SVG. O corte caiu no lugar errado e o resto do desenho
// ficou solto no <head>. O navegador, ao encontrar um <g> ali, fecha o head e
// abre o body: o resto do SVG virou conteúdo e um `" />` apareceu escrito no
// topo de todas as páginas.
//
// Nada acusou. As checagens olhavam as tags que deviam existir, e o problema
// era uma tag que não devia. Esta olha o avesso: a lista do HTML é fechada, e
// qualquer coisa fora dela é vazamento.
{
  const NO_HEAD = new Set([
    'base', 'link', 'meta', 'noscript', 'script', 'style', 'template', 'title',
  ]);
  for (const [nome, src] of html) {
    const head = src.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
    if (head === undefined) { falhas.push(`${nome}: sem <head>`); continue; }
    // o conteúdo de script e style é texto livre (JSON-LD, CSS): não é markup
    const limpo = head
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    for (const [, tag] of limpo.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) {
      exigir(NO_HEAD.has(tag.toLowerCase()),
        `${nome}: <${tag}> dentro do <head> - o navegador fecha o head ali e o resto vaza para a página`);
    }
  }
}

// --- 14. link entre páginas com âncora aponta para âncora que existe ---
// A home manda o leitor para o postmortem dentro do case do JVB. Âncora entre
// arquivos é o tipo de link que apodrece calado: quem edita o case não tem
// como saber que alguém lá de fora aponta para um id dele, e o navegador não
// reclama de #âncora inexistente - ele só abre a página no topo, e o visitante
// acha que o link era decorativo.
//
// Só ids escritos à mão contam. Os que o módulo 25 gera a partir dos <h2> não
// existem no HTML, então um link para eles passaria aqui e falharia no ar: é
// justamente por isso que o alvo do postmortem ganhou id fixo no arquivo.
{
  for (const [nome, src] of html) {
    for (const [, alvo, ancora] of src.matchAll(/href="([\w.-]+\.html)#([\w-]+)"/g)) {
      const destino = html.get(alvo);
      if (!destino) { falhas.push(`${nome}: link para ${alvo}, que não é uma página do site`); continue; }
      exigir(new RegExp(`id="${ancora}"`).test(destino),
        `${nome}: aponta para ${alvo}#${ancora} e esse id não existe lá - ` +
        `o link abre a página no topo, sem erro nenhum`);
    }
  }
}

if (falhas.length) {
  console.error(`\n${falhas.length} falha(s):\n`);
  for (const f of falhas) console.error(`  x ${f}`);
  process.exit(1);
}
console.log(`OK: ${PAGINAS.length} páginas, nenhuma falha.`);
