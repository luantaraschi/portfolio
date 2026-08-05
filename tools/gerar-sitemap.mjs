// Gera o sitemap.xml com a data real de cada página. Rode com
// `node tools/gerar-sitemap.mjs` antes de commitar quando alguma página mudar.
//
// O lastmod sai do git, não da mão: sitemap com data errada é pior que sitemap
// sem data nenhuma, porque o Google aprende a não confiar no arquivo inteiro e
// passa a ignorar o campo em todas as URLs. Escrito à mão, ele envelhece na
// primeira edição e ninguém percebe.
//
// Arquivo com mudança ainda não commitada recebe a data de hoje, e não a do
// último commit: ele vai ser modificado hoje, e é essa a data que vai valer
// quando o commit sair. Sem isso, gerar e commitar no mesmo movimento sempre
// gravaria a data anterior.
import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// A prioridade é editorial e por isso mora aqui, não no git: diz ao buscador
// quais páginas eu considero a porta de entrada. O 404 fica de fora de
// propósito, página de erro não se indexa.
const PAGINAS = [
  ['index.html', '/', '1.0'],
  ['sobre.html', '/sobre.html', '0.8'],
  ['projeto-jvb.html', '/projeto-jvb.html', '0.9'],
  ['projeto-triagem.html', '/projeto-triagem.html', '0.9'],
  ['projeto-devtools.html', '/projeto-devtools.html', '0.7'],
  ['projeto-gesture.html', '/projeto-gesture.html', '0.7'],
  ['projeto-dub.html', '/projeto-dub.html', '0.7'],
  ['projeto-soms.html', '/projeto-soms.html', '0.6'],
  ['projeto-sus.html', '/projeto-sus.html', '0.6'],
  ['projeto-pov.html', '/projeto-pov.html', '0.6'],
];

// A versão em inglês entra com a mesma prioridade e o mesmo nome de arquivo.
// Prioridade igual e não menor de propósito: as duas são a página, cada uma na
// sua língua, e é o hreflang que diz isso ao buscador - rebaixar o inglês aqui
// contradiria o par que as duas declaram lá.
const EN = PAGINAS.map(([arquivo, caminho, prioridade]) => [
  `en/${arquivo}`,
  caminho === '/' ? '/en/' : `/en${caminho}`,
  prioridade,
]);
PAGINAS.push(...EN);

const git = (...args) =>
  execFileSync('git', ['-C', RAIZ, ...args], { encoding: 'utf8' }).trim();

const hoje = new Date().toISOString().slice(0, 10);

function dataDe(arquivo) {
  // `--` separa revisão de caminho: sem ele um arquivo com nome de branch
  // deixaria o git em dúvida sobre o que foi pedido.
  const sujo = git('status', '--porcelain', '--', arquivo) !== '';
  if (sujo) return hoje;
  // %cs = data do commit em YYYY-MM-DD, que é o formato que o sitemap aceita
  const commitado = git('log', '-1', '--format=%cs', '--', arquivo);
  return commitado || hoje;
}

const linhas = PAGINAS.map(([arquivo, caminho, prioridade]) => {
  const loc = `https://luantaraschi.dev${caminho}`;
  return `  <url><loc>${loc}</loc><lastmod>${dataDe(arquivo)}</lastmod><priority>${prioridade}</priority></url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${linhas.join('\n')}
</urlset>
`;

await writeFile(join(RAIZ, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml: ${PAGINAS.length} URLs com lastmod do git.`);
