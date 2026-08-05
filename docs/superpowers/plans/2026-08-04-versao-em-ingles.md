# Versão em Inglês — Esboço

**Status:** FEITO em 05/08/2026. As onze páginas estão no ar em `/en/`, com
hreflang recíproco, seletor de idioma na barra e sitemap com as vinte URLs.
As cinco decisões foram respondidas: reescrita (não tradução), as onze páginas
(não um recorte), sobre.html inteiro, CV em inglês pendente do Luan (o botão
de download não aparece no /en/ enquanto o arquivo não existir), e a URL como
única fonte da verdade, sem localStorage.

O que sobrou deste plano fica abaixo, como registro do que foi decidido.

**Por que existe:** o site afirma "Inglês fluente" na ficha do hero e "Respondo
em português ou inglês" no contato, e é `lang="pt-BR"` de ponta a ponta. Para
vaga remota internacional, é o maior buraco do repositório — vale mais que
todos os itens de interface do plano de 04/08/2026 somados.

**Escopo:** 10 páginas em `/en/`, mesma estrutura de arquivos, `lang="en"`,
`hreflang` recíproco nos dois lados, e um seletor de idioma na barra de
navegação ao lado do interruptor de tema.

**Decisões pendentes antes de escrever o plano de verdade:**

1. **Tradução ou reescrita?** O texto em português tem voz muito própria
   ("Bora conversar", "cutuca", "feito por mim, com muito amor", "coisa que
   nasceu de curiosidade às duas da manhã"). Tradução literal mata isso.
   Reescrever custa mais e é quase certamente o certo.
2. **Os oito cases inteiros, ou só home + os dois de produção** (JVB e triagem)?
   Os seis restantes são projeto pessoal; um recrutador internacional
   provavelmente lê a home e um case.
3. **O `sobre.html` é uma história pessoal de dez capítulos**, do mod de
   Minecraft aos dez anos até hoje. Traduz inteiro, encurta para três
   parágrafos, ou fica só em português com aviso?
4. **O CV em PDF também ganha versão em inglês?** Se sim, o link do hero e o da
   seção de contato precisam apontar para o arquivo certo em cada idioma.
5. **Como o seletor de idioma se comporta?** Guardar a escolha em
   `localStorage` como o tema faz, ou deixar a URL ser a única fonte da
   verdade? A segunda é mais simples e não surpreende quem chega por link
   compartilhado.

**Trabalho técnico já feito (plano de 04/08/2026, Tarefa 14):**

- Os três `<link rel="alternate">` estão plantados e **comentados** nas 10
  páginas indexáveis, com os caminhos `/en/` corretos. Descomentar é uma linha
  por página.
- `tools/check.mjs`, bloco 8, verifica que o comentário existe e aponta para o
  caminho certo. Quando `/en/` for ao ar, trocar por uma exigência de `<link>`
  de verdade.

**Ao começar:**

1. Responder as cinco decisões acima.
2. Descomentar os `<link rel="alternate">` nas 10 páginas.
3. Atualizar o bloco 8 de `tools/check.mjs`.
4. Acrescentar as páginas `/en/` ao `sitemap.xml`.
5. Trocar `inLanguage` para `"en"` no JSON-LD das páginas traduzidas.
