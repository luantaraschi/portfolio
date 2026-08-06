/* ============================================================================
   Luan Taraschi - portfólio 1-bit
   1 menu mobile · 2 copiar e-mail · 3 formulário
   4 esfera com dithering Bayer 8x8 · 5 revelação ao rolar
   6 interruptor claro/escuro + retrato que põe e tira os óculos
   7 cinco cutucadas no retrato · 8 retícula do fundo acesa pelo cursor
   9 masthead sangrado ajustado à largura · 10 falha de registro periódica
   11 rastro do clique · 12 o cursor rala o dither do thumb
   13 kicker virando barra de rolagem em ASCII · 14 números da sobre contando
   15 a órbita da stack só gira em cena · 16 números do case subindo
   17 o recado de quem abre o console · 18 a guia lateral de seção
   19 o card se transformando na página do case · 20 o CV avisando que baixou
   21 o case que você já abriu · 22 o dedo ralando o dither onde encostou
   23 o vídeo só toca para quem não pediu silêncio
   24 a captura abre em tamanho de verdade · 25 o índice do case
   ========================================================================== */
(function () {
  'use strict';

  // scrollRestoration = 'manual' mora no <script> inline do <head> das três
  // páginas, junto com o tema. Aqui seria tarde: este arquivo tem `defer` e o
  // browser já teria restaurado o offset antes de ele rodar.

  // ponytail: fonte única do e-mail - o link, o botão copiar e o form leem daqui.
  var EMAIL = 'luantaraschi@gmail.com';

  // Endpoint do formulário. O mesmo valor está no `action` do <form> em
  // index.html: lá ele serve a quem está sem JS, aqui a quem tem.
  // Se os dois divergirem, metade dos envios some sem ninguém perceber.
  var FORM_ENDPOINT = 'https://formspree.io/f/SUBSTITUIR';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Um arquivo de JS serve as duas línguas: /en/ é a mesma página com o mesmo
  // comportamento, e duplicar o arquivo seria duplicar vinte e cinco módulos
  // para trocar dezoito frases. A língua vem do <html lang>, que já existe e
  // já é a fonte da verdade para leitor de tela e para o buscador.
  //
  // Só entra aqui o que o JS escreve na tela. Tudo que está no HTML foi
  // traduzido no HTML - texto que o servidor manda pronto é texto que o Google
  // lê e que aparece mesmo se o JS falhar.
  var EN = document.documentElement.lang.slice(0, 2) === 'en';
  function diz(pt, en) { return EN ? en : pt; }

  var T = {
    copiado:      diz('copiado ✓', 'copied ✓'),
    copieManual:  diz('copie manualmente', 'copy it manually'),
    corrija:      diz('› corrija os campos marcados acima.', '› please fix the fields marked above.'),
    enviando:     diz('enviando…', 'sending…'),
    enviandoStatus: diz('› enviando…', '› sending…'),
    recebido:     diz('› recebido. Respondo em até um dia útil.', '› got it. I answer within one business day.'),
    falhou:       diz('› não consegui enviar. Me escreva direto em ', '› could not send it. Write to me directly at '),
    salvo:        diz('salvo ✓', 'saved ✓'),
    visto:        diz('visto ✓', 'seen ✓'),
    fechar:       diz('fechar ✕', 'close ✕'),
    fecharCap:    diz('Fechar a captura', 'Close the screenshot'),
    capAnterior:  diz('Captura anterior', 'Previous screenshot'),
    capProxima:   diz('Próxima captura', 'Next screenshot'),
    ampliar:      diz('Ampliar: ', 'Enlarge: '),
    aproximar:    diz('1:1', '1:1'),
    aproximarCap: diz('Ver no tamanho real e arrastar', 'View at real size and drag'),
    afastarCap:   diz('Ver a captura inteira', 'Fit the whole screenshot'),
    arraste:      diz('arraste para ler', 'drag to read'),
    captura:      diz('captura', 'screenshot'),
    nestaPagina:  diz('nesta página', 'on this page'),
    blocos:       diz(' blocos', ' sections'),
    indice:       diz('Índice desta página', 'Index of this page'),
    semOculos:    diz('Retrato de Luan Taraschi em 1 bit, sem óculos escuros.',
                      'Portrait of Luan Taraschi in 1 bit, without sunglasses.'),
    comOculos:    diz('Retrato de Luan Taraschi em 1 bit, de óculos escuros por causa da luz.',
                      'Portrait of Luan Taraschi in 1 bit, wearing sunglasses because of the light.'),
    console:      diz('Sem framework, sem build, sem dependência.\nA esfera é dithering Bayer 8×8 pintado em canvas, um pixel por vez.\n\nProcurando dev? ',
                      'No framework, no build step, no dependency.\nThe sphere is Bayer 8×8 dithering painted on canvas, one pixel at a time.\n\nLooking for a dev? ')
  };

  /* ---- 1. menu mobile --------------------------------------------------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var panel = document.querySelector('[data-nav-panel]');
  if (toggle && panel) {
    function fecharMenu(devolverFoco) {
      panel.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
      // só no Escape: quem clicou num link está indo pra âncora, e roubar o
      // foco de volta pro botão desfaria a navegação que a pessoa pediu.
      if (devolverFoco) toggle.focus();
    }
    toggle.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (!open) return fecharMenu(false);
      panel.removeAttribute('hidden');
      toggle.setAttribute('aria-expanded', 'true');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') fecharMenu(false);
    });
    // sem armadilha de foco: o painel é irmão do botão na ordem do DOM, então
    // Tab já sai dele pelo caminho natural. O que faltava era a saída sem Tab.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hasAttribute('hidden')) fecharMenu(true);
    });
  }

  /* ---- 2. copiar e-mail -------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var done = function () {
        btn.textContent = T.copiado;
        btn.style.borderColor = 'var(--accent)';
        setTimeout(function () { btn.textContent = label; btn.style.borderColor = ''; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(done, function () { btn.textContent = T.copieManual; });
      } else {
        // fallback para contextos sem clipboard API
        var tmp = document.createElement('textarea');
        tmp.value = EMAIL;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); done(); } catch (_) { btn.textContent = T.copieManual; }
        document.body.removeChild(tmp);
      }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-email]'), function (el) {
    el.textContent = EMAIL;
    if (el.tagName === 'A') el.setAttribute('href', 'mailto:' + EMAIL);
  });

  /* ---- 3. formulário de contato ------------------------------------------ */
  var form = document.querySelector('[data-form]');
  if (form) {
    var status = form.querySelector('[data-status]');
    var rules = {
      nome: function (v) { return v.trim().length >= 2 ? '' : 'Escreve o nome: 2 letras ou mais.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'E-mail inválido, olha o formato.'; },
      mensagem: function (v) { return v.trim().length >= 10 ? '' : 'Conta um pouco mais: 10 letras.'; }
    };

    function validateField(input) {
      var rule = rules[input.name];
      if (!rule) return '';
      var msg = rule(input.value);
      var err = form.querySelector('[data-err="' + input.name + '"]');
      if (err) err.textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      // o campo também fala quando dá certo, e não só quando erra. O ✓ é uma
      // classe no .field, nunca texto dentro do [role=alert]: escrever ali faria
      // o leitor de tela anunciar "certo" a cada tecla corrigida.
      if (input.parentNode && input.parentNode.classList) {
        input.parentNode.classList.toggle('is-ok', !msg && input.value.trim() !== '');
      }
      return msg;
    }

    Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (input) {
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
    });

    // a barra do painel é uma janela de sistema; então ela mostra o tamanho do
    // arquivo que está sendo escrito. Decorativo: quem usa leitor de tela já
    // ouve o conteúdo do campo, e contagem a cada tecla seria ruído.
    var conta = form.querySelector('[data-conta-msg]');
    var campoMsg = form.querySelector('textarea');
    if (conta && campoMsg) {
      campoMsg.addEventListener('input', function () {
        var n = campoMsg.value.length;
        conta.textContent = n ? '[ ' + n + ' car. ]' : '';
      });
    }

    var botao = form.querySelector('button[type="submit"]');
    var rotuloBotao = botao ? botao.textContent : '';

    function dizer(texto) { if (status) status.textContent = texto; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (input) {
        if (validateField(input) && !firstBad) firstBad = input;
      });
      if (firstBad) {
        firstBad.focus();
        dizer(T.corrija);
        return;
      }
      var data = new FormData(form);

      // Sem fetch (navegador muito antigo), entrega pelo caminho nativo: o
      // `action` do <form> leva ao mesmo endpoint, só trocando de página.
      // form.submit() e não `return`: o preventDefault lá em cima já cancelou o
      // envio, e um return seco aqui deixaria o botão sem fazer nada. O submit
      // programático também não dispara este listener de novo, então não gira.
      if (!window.fetch) { form.submit(); return; }

      // trava o botão: dois cliques no envio viram duas mensagens iguais na
      // caixa de entrada, e quem clicou não tem como saber que mandou duas
      if (botao) { botao.disabled = true; botao.textContent = T.enviando; }
      dizer(T.enviandoStatus);

      function soltar() {
        if (botao) { botao.disabled = false; botao.textContent = rotuloBotao; }
      }
      // o e-mail vai no corpo, então a resposta do Formspree chega já com o
      // remetente certo em vez de cair como "sem assunto" de um anônimo
      data.append('_subject', 'Contato do portfólio: ' + data.get('nome'));

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) {
          f.classList.remove('is-ok');
        });
        var conta = form.querySelector('[data-conta-msg]');
        if (conta) conta.textContent = '';
        soltar();
        // [role=status] no HTML: o leitor de tela anuncia sozinho, sem foco
        dizer(T.recebido);
      }).catch(function () {
        soltar();
        dizer(T.falhou + EMAIL + '.');
      });
    });
  }

  /* ---- 4. esfera com dithering Bayer 8x8 --------------------------------- */
  // Um pintor por canvas [data-dither]. O valor do atributo escolhe a forma:
  // vazio = a esfera do hero, "swirl" = o redemoinho da página de detalhe.
  // Tudo o mais (paleta do tema, erosão, sono, órbita) é compartilhado.
  Array.prototype.forEach.call(document.querySelectorAll('[data-dither]'), pintarDither);

  function pintarDither(canvas) {
    if (!canvas.getContext) return;
    var ctx = canvas.getContext('2d', { alpha: false });
    var forma = canvas.dataset.dither === 'swirl' ? 'swirl' : 'esfera';

    // matriz de Bayer 8x8 ordenada - o coração do visual 1-bit
    var BAYER = [
       0, 32,  8, 40,  2, 34, 10, 42,
      48, 16, 56, 24, 50, 18, 58, 26,
      12, 44,  4, 36, 14, 46,  6, 38,
      60, 28, 52, 20, 62, 30, 54, 22,
       3, 35, 11, 43,  1, 33,  9, 41,
      51, 19, 59, 27, 49, 17, 57, 25,
      15, 47,  7, 39, 13, 45,  5, 37,
      63, 31, 55, 23, 61, 29, 53, 21
    ];

    var PIXEL = 5;                 // tamanho de um "pixel lógico" na tela
    var W = 0, H = 0, img = null;
    var lx = -0.45, ly = -0.5;     // direção da luz (segue o cursor)
    var tx = lx, ty = ly;          // alvo suavizado
    var erode = 0;                 // 0 = sólida, 1 = dissolvida no vazio
    // a esfera dorme: ponteiro parado por 20 s e a densidade vai ralando de 50%
    // até uns 12%. Qualquer movimento na página acorda. SONO_MAX abaixo de 1 de
    // propósito - dormir não é sumir, é ficar rala.
    var OCIO = 20000, SONO_MAX = 0.62;
    var sono = 0, ultimoToque = 0;
    // fase acumulada do redemoinho: mudar de velocidade no meio não pula quadro
    var giro = 0, ultimoT = 0;
    var running = false, raf = 0, t0 = 0;

    // as duas cores saem dos tokens, então a esfera acompanha o interruptor
    var VOID = [26, 25, 23], LIT = [252, 228, 166], POPS = [];
    function hex(v) {
      v = v.trim().replace('#', '');
      return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
    }
    function readPalette() {
      // lê do próprio canvas, não da raiz: dentro de .invert os tokens são
      // outros, e um canvas com a paleta da página apareceria trocado ali
      var cs = getComputedStyle(canvas);
      VOID = hex(cs.getPropertyValue('--paper'));
      LIT = hex(cs.getPropertyValue('--ink'));
      POPS = ['--pop-1', '--pop-2', '--pop-3'].map(function (n) {
        return hex(cs.getPropertyValue(n));
      });
    }
    readPalette();
    document.addEventListener('themechange', function () {
      readPalette();
      draw(performance.now());
    });

    // erosão progressiva: o gesto da referência 2 amarrado ao scroll.
    // conforme o hero sobe, a esfera se desfaz pixel a pixel pela matriz.
    // Só remede quando a página rolou: getBoundingClientRect a cada quadro
    // força um layout síncrono para, quase sempre, descobrir que nada mudou.
    var precisaMedir = true;
    function measureErode() {
      var r = canvas.getBoundingClientRect();
      var p = (window.innerHeight * 0.55 - r.bottom) / (r.height * 0.9);
      erode = p < 0 ? 0 : p > 1 ? 1 : p;
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(40, Math.min(220, Math.round(r.width / PIXEL)));
      H = Math.max(40, Math.min(220, Math.round(r.height / PIXEL)));
      canvas.width = W;
      canvas.height = H;
      img = ctx.createImageData(W, H);
    }

    function draw(time) {
      if (!img) return;
      var d = img.data;
      var k = reduced ? 1 : 0.08;
      lx += (tx - lx) * k;
      ly += (ty - ly) * k;

      // normaliza a direção da luz com um z fixo - dá o brilho de esfera
      var lz = 0.78;
      var len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
      var nx = lx / len, ny = ly / len, nz = lz / len;
      var drift = reduced ? 0 : Math.sin(time / 2600) * 0.06;
      var aspecto = H ? W / H : 1;
      // o olho do redemoinho é puxado pelo cursor (lx/ly já vêm suavizados, os
      // mesmos que giram a luz da esfera) e ele acelera com o ponteiro em cima
      var olhoX = lx * 0.34, olhoY = ly * 0.34;
      var dt = ultimoT ? Math.min(64, time - ultimoT) : 16;
      ultimoT = time;
      if (!reduced) giro += dt * (canvas.dataset.hot ? 0.0018 : 0.0009);

      for (var y = 0; y < H; y++) {
        var py = ((y + 0.5) / H) * 2 - 1;
        for (var x = 0; x < W; x++) {
          var px = ((x + 0.5) / W) * 2 - 1;
          var r2 = px * px + py * py;
          var lum, dentro;

          if (forma === 'swirl') {
            // braços de redemoinho: a fase é ângulo + raio, girando no tempo. O
            // envelope radial esvazia o miolo e esgarça a borda, como na ref.
            var ax = (px - olhoX) * aspecto, ay = py - olhoY;
            var rr = Math.sqrt(ax * ax + ay * ay);
            var fase = Math.atan2(ay, ax) * 3 + rr * 5.2 - giro;
            var env = Math.min(1, Math.max(0, (rr - 0.20) / 0.22)) *
                      Math.min(1, Math.max(0, (0.98 - rr) / 0.30));
            lum = (0.5 + 0.5 * Math.sin(fase)) * env * (1 - sono * SONO_MAX);
            dentro = env > 0.02;
          } else if (r2 <= 0.82) {
            dentro = true;
            // dentro da esfera: iluminação lambert + realce especular
            var sz = Math.sqrt(Math.max(0, 0.82 - r2)) / 0.906;
            var sx = px / 0.906, sy = py / 0.906;
            var lam = sx * nx + sy * ny + sz * nz;
            if (lam < 0) lam = 0;
            lum = Math.pow(lam, 1.5) + Math.pow(lam, 26) * 0.55;
            if (lum > 1) lum = 1;
            lum = (0.06 + lum * 0.92) * (1 - erode) * (1 - sono * SONO_MAX);
          } else {
            // fora: chiado esparso de tinta no vazio, mais denso perto da borda
            dentro = false;
            var dd = Math.sqrt(r2);
            lum = 0.09 - (dd - 0.906) * 0.1 + drift * 0.35;
            if (lum > 0.13) lum = 0.13;
            if (lum < 0) lum = 0;
          }

          var thr = (BAYER[(y & 7) * 8 + (x & 7)] + 0.5) / 64;
          var on = lum < thr;                 // vazio onde a luz não chega
          var c;
          if (on) {
            c = VOID;
          } else if (dentro && lum - thr < 0.06 && ((x * 5 + y * 3) & 7) === 0) {
            // confete só na fronteira do dither dentro da esfera - no chiado do
            // vazio ele virava confete solto na tela toda. Mesmo gesto do
            // retrato solarizado, que satura a borda do cabelo e da barba.
            // hash de x,y: fica preso ao pixel, então não cintila entre frames.
            c = POPS[(x + y * 3) % POPS.length];
          } else {
            c = LIT;
          }
          var i = (y * W + x) * 4;
          d[i]     = c[0];
          d[i + 1] = c[1];
          d[i + 2] = c[2];
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    function loop(time) {
      if (!t0) t0 = time;
      if (precisaMedir) { precisaMedir = false; measureErode(); }
      if (!reduced) {
        // órbita lenta quando o ponteiro não está em cima
        if (!canvas.dataset.hot) {
          var a = (time - t0) / 3400;
          tx = Math.cos(a) * 0.6;
          ty = Math.sin(a * 0.7) * 0.45 - 0.15;
        }
      }
      // adormece devagar (uns 4 s até o fundo), acorda em 3 quadros
      if (!reduced) {
        var alvo = (time - ultimoToque) > OCIO ? 1 : 0;
        sono += (alvo - sono) * (alvo ? 0.004 : 0.3);
        if (sono < 0.002) sono = 0;
      }
      draw(time);
      if (running) raf = requestAnimationFrame(loop);
    }

    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      // a área de escuta é maior que o canvas na órbita, então isto passa de 1.
      // Um teto largo mantém a luz rasante sem deixar a normal degenerar.
      tx = trava((cx / r.width) * 2 - 1);
      ty = trava((cy / r.height) * 2 - 1);
      canvas.dataset.hot = '1';
    }
    function trava(v) { return v < -1.6 ? -1.6 : v > 1.6 ? 1.6 : v; }

    // O globo da órbita ouve o container inteiro, não só a si mesmo: ele ocupa
    // 30% de uma área de 500px, e exigir o cursor em cima dele fazia a esfera
    // ignorar quem já estava dentro dos anéis. Nos outros canvas a área de
    // escuta continua sendo o próprio canvas.
    var area = canvas.closest('[data-orb]') || canvas;
    area.addEventListener('pointermove', pointer);
    area.addEventListener('touchmove', function (e) { pointer(e); }, { passive: true });
    area.addEventListener('pointerleave', function () { delete canvas.dataset.hot; });

    // qualquer sinal de vida na página acorda a esfera, não só sobre o canvas
    function acordar(e) {
      ultimoToque = performance.now();
      if (!e || e.type === 'scroll') precisaMedir = true;
    }
    ['pointermove', 'pointerdown', 'keydown', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, acordar, { passive: true });
    });
    acordar();

    window.addEventListener('resize', function () {
      precisaMedir = true;
      resize();
      draw(performance.now());
    });
    resize();

    if (reduced) {
      draw(0);
    } else if ('IntersectionObserver' in window) {
      // não gasta frames com o canvas fora da tela
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !running) { running = true; raf = requestAnimationFrame(loop); }
          else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
        });
      }, { threshold: 0.05 }).observe(canvas);
    } else {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  }

  /* ---- 5. revelação ao rolar --------------------------------------------- */
  // A home marca no HTML; as internas ganham os alvos aqui, para não repetir
  // class="reveal" em cinquenta linhas de markup. Na sobre o alvo é o texto do
  // bloco, nunca o bloco: o h2 dele é sticky, e transform no pai mata sticky.
  var alvosAuto = document.querySelector('.bloco__n')
    ? '.case__head, .bloco__txt, .cursos, .fecho, .case__nav'
    : '.case__head, .case__shot, .case__block, .case__gallery > div, .case__nav, .tl';
  Array.prototype.forEach.call(document.querySelectorAll(alvosAuto), function (el) {
    el.classList.add('reveal');
  });

  var reveals = document.querySelectorAll('.reveal');
  // escada de entrada: cada elemento recebe a própria posição entre os irmãos
  // revelados do mesmo pai. Teto de 5 porque seis cards em fila já dariam
  // 360 ms de espera e o último parecia esquecido.
  Array.prototype.forEach.call(reveals, function (el) {
    var pai = el.parentNode, n = pai.ltIndice || 0;
    pai.ltIndice = n + 1;
    el.style.setProperty('--i', n > 5 ? 5 : n);
  });
  if (reveals.length && !reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  }

  /* ---- 6. interruptor de luz + retrato que reage ------------------------- */
  var root = document.documentElement;
  var toggles = document.querySelectorAll('[data-theme-toggle]');
  var film = document.querySelector('[data-film]');
  var stage = document.querySelector('[data-stage]');
  var STORE = 'lt-tema';

  var LEGENDA = { dark: T.semOculos, light: T.comOculos };

  function paintToggles(theme) {
    Array.prototype.forEach.call(toggles, function (b) {
      if (b.getAttribute('role') === 'switch') {
        b.setAttribute('aria-checked', String(theme === 'light'));
      }
    });
    if (film) film.setAttribute('aria-label', LEGENDA[theme]);
  }

  function replay(el, cls) {
    el.classList.remove('play-on', 'play-off', 'flinch', 'poke', 'espia');
    void el.offsetWidth;                 // reflow forçado: reinicia a animação
    el.classList.add(cls);
  }

  // os mesmos dois --paper que o <head> escreve na primeira pintura. Literais
  // aqui e lá: getComputedStyle na hora da troca leria a cor antiga, porque o
  // atributo data-theme só acabou de mudar.
  var BARRA = { dark: '#1a1917', light: '#eee8d5' };

  // `semGravar` só é usado pelo módulo 27, quando quem trocou foi o sistema
  // operacional e não a pessoa: gravar ali carimbaria uma escolha que ninguém
  // fez, e a partir da primeira troca automática o site pararia de acompanhar
  // o sistema para sempre. A chave no localStorage significa "ele clicou".
  function setTheme(theme, semGravar) {
    root.setAttribute('data-theme', theme);
    if (!semGravar) { try { localStorage.setItem(STORE, theme); } catch (_) {} }
    var metaBarra = document.querySelector('meta[name="theme-color"]');
    if (metaBarra) metaBarra.setAttribute('content', BARRA[theme]);
    paintToggles(theme);
    document.dispatchEvent(new CustomEvent('themechange'));
  }

  function reagir(theme) {
    if (reduced || !film) return;
    // claro = a luz incomoda, ele põe os óculos; escuro = tira
    replay(film, theme === 'light' ? 'play-on' : 'play-off');
    if (theme === 'light' && stage) replay(stage, 'flinch');
  }

  // A faixa cruza a tela e o tema vira quando ela está no meio do caminho,
  // debaixo dela. O retrato reage no mesmo instante: a faixa é estreita e
  // ainda está do lado direito, então a piada dos óculos aparece inteira.
  // BEAT: a reação dele saiu de dentro da cortina e virou um evento separado,
  // 160ms depois que ela sai de cena. Antes os dois aconteciam no mesmo
  // instante e a cortina, que é o objeto que cruza a tela inteira, roubava o
  // olho justamente no quadro em que os óculos entravam: a troca de tema era
  // vista e a piada não. Separados, a luz acende, dá um tempo, e aí ele
  // reage - que é o tempo de comédia certo e ainda por cima é movimento
  // isolado, que é o gatilho de atenção mais forte que existe.
  var CORTINA = 420, METADE = 210, BEAT = 160;
  var wipeEl = document.querySelector('[data-wipe]');
  var cortinando = false;
  var volta = false;             // a faixa alterna o sentido a cada troca
  // a cortina libera em CORTINA e a reação só sai em CORTINA+BEAT: nessa fresta
  // dá pra clicar de novo. Sem o carimbo, a reação atrasada da troca anterior
  // chegaria depois da nova e poria os óculos no tema errado.
  var vez = 0;

  function trocar(theme, semGravar) {
    if (reduced || !wipeEl || cortinando) {
      if (cortinando) return;
      setTheme(theme, semGravar);
      reagir(theme);
      return;
    }
    cortinando = true;
    var minha = ++vez;
    // O quadro de repouso do retrato vem do tema (--parado). Com a reação
    // atrasada, os 160ms entre a troca e a animação deixavam o repouso pular
    // sozinho para o quadro final: os óculos apareciam de estalo e logo depois
    // ele tocava a animação de colocá-los, contando a piada duas vezes e
    // estragando as duas. `congelado` prende o retrato no quadro do tema ANTIGO
    // durante essa fresta, e sai quando a animação assume.
    var anterior = root.getAttribute('data-theme') === 'light' ? '0%' : '100%';
    wipeEl.className = 'wipe ' + (theme === 'light' ? 'wipe--claro' : 'wipe--escuro') +
                       (volta ? ' wipe--volta' : '');
    volta = !volta;
    void wipeEl.offsetWidth;              // reinicia a animação da faixa
    wipeEl.classList.add('is-on');
    setTimeout(function () {
      if (film) {
        film.style.setProperty('--congela', anterior);
        film.classList.add('congelado');
      }
      setTheme(theme, semGravar);
    }, METADE);
    setTimeout(function () {
      wipeEl.classList.remove('is-on');
      cortinando = false;
    }, CORTINA);
    setTimeout(function () {
      if (minha !== vez) return;          // trocou de novo no meio: esta não vale
      if (film) film.classList.remove('congelado');
      reagir(theme);
    }, CORTINA + BEAT);
  }

  if (film) {
    film.addEventListener('animationend', function () {
      // solta a animação e devolve o controle à regra estática do tema
      film.classList.remove('play-on', 'play-off', 'espia');
    });
  }

  // A primeira vez que o retrato entra na tela, ele espia sozinho: a mão sobe
  // três quadros e volta. É o mesmo gesto do hover, só que sem precisar de
  // cursor - resolve o celular, onde hover não existe, e resolve quem passa
  // reto sem levar o mouse até lá. Uma vez só por visita: repetido viraria
  // tique, e tique a gente aprende a ignorar.
  if (stage && film && !reduced && 'IntersectionObserver' in window) {
    var ioRosto = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        ioRosto.disconnect();
        // espera a entrada do painel assentar antes de mexer
        setTimeout(function () { replay(film, 'espia'); }, 520);
      });
    }, { threshold: 0.6 });
    ioRosto.observe(stage);
  }
  if (stage) {
    stage.addEventListener('animationend', function (e) {
      if (e.animationName === 'flinch' || e.animationName === 'poke') {
        stage.classList.remove(e.animationName);
      }
    });
  }

  Array.prototype.forEach.call(toggles, function (b) {
    b.addEventListener('click', function () {
      trocar(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
  });

  // o <head> já aplicou o tema salvo antes da primeira pintura; aqui só sincroniza
  paintToggles(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  /* ---- 7. cutucar o retrato ---------------------------------------------- */
  // O botão do topo troca a luz num clique. Aqui é o caminho longo: cinco
  // cutucadas seguidas. A barra embaixo do retrato mostra a paciência acabando
  // e esvazia sozinha se você parar no meio.
  var POKES = 5, JANELA = 700, pokes = 0, relogio = 0;
  if (stage) {
    stage.addEventListener('click', function () {
      clearTimeout(relogio);
      stage.classList.remove('esvaziando');   // voltou a cutucar: enche seco de novo
      pokes += 1;
      if (pokes >= POKES) {
        pokes = 0;
        stage.style.setProperty('--pokes', 0);
        trocar(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
        return;
      }
      stage.style.setProperty('--pokes', pokes);
      if (!reduced) replay(stage, 'poke');
      relogio = setTimeout(function () {
        pokes = 0;
        stage.classList.add('esvaziando');
        stage.style.setProperty('--pokes', 0);
      }, JANELA);
    });
  }

  /* ---- 8. a retícula do fundo acende sob o cursor ------------------------ */
  var glow = document.querySelector('[data-glow]');
  if (glow && !reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // trava em múltiplos de 10 - o passo da retícula. Assim a grade acesa cai
    // sempre em cima da grade do fundo, e de quebra a maioria dos quadros não
    // escreve nada: mexer o mouse um pixel não é motivo para tocar no estilo.
    var gx = 0, gy = 0, ux = -500, uy = -500, pedido = 0;
    window.addEventListener('pointermove', function (e) {
      gx = Math.round(e.clientX / 10) * 10;
      gy = Math.round(e.clientY / 10) * 10;
      if (pedido) return;            // um update por frame, não por evento
      pedido = requestAnimationFrame(function () {
        pedido = 0;
        glow.classList.add('is-lit');
        if (gx === ux && gy === uy) return;
        ux = gx; uy = gy;
        glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
      });
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () {
      glow.classList.remove('is-lit');
    });
  }

  /* ---- 9. masthead ------------------------------------------------------ */
  // Mede a linha com um corpo de prova e reescala pra encostar nas duas bordas
  // da coluna (o .wrap, não a tela).
  var fitLines = document.querySelectorAll('[data-fit]');
  var PROVA = 200;
  var TRACK = 0.04;   // igual ao letter-spacing de .masthead; a última letra
                      // também recebe tracking, e essa sobra viraria buraco à
                      // direita. Mexeu num, mexe no outro.
  var nome = document.querySelector('.masthead');
  var argumento = document.querySelector('.hero__cta');
  var PISO = 0.48;    // o bloco do nome não encolhe além disto da coluna.
                      // 0.48 é onde 1366x768 - notebook comum por aqui - ainda
                      // fecha os botões dentro da janela. Abaixo disso o nome
                      // vira um bloco pequeno no canto e o remédio fica pior.

  function preencher() {
    Array.prototype.forEach.call(fitLines, function (el) {
      var largura = el.parentElement.clientWidth;
      if (!largura) return;
      el.style.fontSize = PROVA + 'px';
      var glifos = el.getBoundingClientRect().width - PROVA * TRACK;
      if (glifos <= 0) return;
      // px inteiro: fonte bitmap em corpo fracionário rende pixel sujo
      el.style.fontSize = Math.floor(PROVA * largura / glifos) + 'px';
    });
  }

  // O nome só obedecia à largura, e no notebook isso engolia a tela de
  // abertura: medido em 1440x900, o masthead tomava 618px de altura e a linha
  // "Desenvolvedor full stack" nascia em y=884, dezesseis pixels abaixo da
  // dobra. Quem abria via barra, kicker e nome - o argumento inteiro ficava
  // atrás do primeiro rolar. No celular sempre coube; o problema era só o
  // desktop, que é onde o recrutador abre.
  //
  // Então o bloco do nome também responde à altura: ele se estreita até os
  // botões encostarem no fim da janela. O JS continua fazendo uma coisa só,
  // encher o pai - quem muda de tamanho é o pai. As duas linhas encolhem
  // juntas e continuam encostando nas bordas do bloco, então o retângulo
  // sólido do nome se mantém; ele só deixa de sangrar a coluna inteira em
  // tela baixa, que é exatamente onde sangrar custava a primeira frase.
  function encaixar() {
    if (nome) nome.style.maxWidth = '';
    preencher();
    if (!nome || !argumento) return;
    var coluna = nome.clientWidth;
    if (!coluna) return;
    var atual = coluna;
    // Estreitar muda a altura, e a altura nova muda o quanto ainda falta. A
    // relação é linear, então três passadas sobram - o `break` sai antes.
    for (var i = 0; i < 3; i++) {
      var sobra = argumento.getBoundingClientRect().bottom
                + window.scrollY - window.innerHeight;
      if (sobra <= 0) break;
      var alto = nome.getBoundingClientRect().height;
      if (alto <= 0) break;
      var proximo = Math.max(Math.floor(coluna * PISO),
                             Math.floor(atual * (alto - sobra) / alto));
      if (proximo >= atual) break;
      atual = proximo;
      nome.style.maxWidth = atual + 'px';
      preencher();
    }
  }

  if (fitLines.length) {
    encaixar();
    // a fonte chega depois do primeiro layout e muda a medida
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(encaixar);
    var reflow = 0;
    window.addEventListener('resize', function () {
      clearTimeout(reflow);
      reflow = setTimeout(encaixar, 120);
    });
  }

  /* ---- 10. o acidente ---------------------------------------------------- */
  // Uma falha de registro a cada ~30s. Raro de propósito: se aparecer demais
  // vira enfeite, e a graça é a pessoa não ter certeza se viu.
  var glitches = document.querySelectorAll('[data-glitch]');
  if (glitches.length && !reduced) {
    (function tique() {
      setTimeout(function () {
        var alvo = glitches[Math.floor(Math.random() * glitches.length)];
        alvo.classList.add('tear');
        setTimeout(function () { alvo.classList.remove('tear'); }, 220);
        tique();
      }, 22000 + Math.random() * 24000);
    })();
  }

  /* ---- 11. o rastro do clique ------------------------------------------- */
  // Um quadrado só, reposicionado e reanimado a cada pointerdown. O :active do
  // CSS já troca a seta pela versão menor; isto é o eco dela no papel.
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var fx = document.createElement('div');
    fx.className = 'click-fx';
    fx.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fx);

    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;   // no toque o dedo já é o feedback
      fx.classList.remove('on');
      void fx.offsetWidth;                     // reinicia a animação no clique seguido
      fx.style.left = e.clientX + 'px';
      fx.style.top = e.clientY + 'px';
      fx.classList.add('on');
    }, { passive: true });
  }

  /* ---- 12. o cursor rala o dither do thumb ------------------------------- */
  // Mesma ideia do módulo 9, em escala de card: o ponteiro vira coordenada local
  // e o CSS derrama papel num raio em volta dele. Um listener na grade inteira,
  // não seis; um update por quadro, não por evento.
  var grade = document.querySelector('.grid-projects');
  if (grade && !reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var ax = 0, ay = 0, thumb = null, pedidoThumb = 0;
    grade.addEventListener('pointermove', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      thumb = card ? card.querySelector('.card__thumb') : null;
      ax = e.clientX; ay = e.clientY;
      if (pedidoThumb || !thumb) return;
      pedidoThumb = requestAnimationFrame(function () {
        pedidoThumb = 0;
        if (!thumb) return;
        var r = thumb.getBoundingClientRect();
        thumb.style.setProperty('--cx', (ax - r.left) + 'px');
        thumb.style.setProperty('--cy', (ay - r.top) + 'px');
      });
    }, { passive: true });
  }

  /* ---- 13. o kicker vira barra de rolagem -------------------------------- */
  // [####······] em dez casas. ponytail: dez casas é o que cabe ao lado do
  // kicker sem quebrar a linha no celular; se virar barra maior, muda PASSOS.
  var barra = document.querySelector('[data-progresso]');
  if (barra) {
    var PASSOS = 10, pedidoBarra = 0, ultimoCheios = -1;
    function pintarBarra() {
      pedidoBarra = 0;
      var alcance = document.documentElement.scrollHeight - window.innerHeight;
      var p = alcance > 0 ? window.scrollY / alcance : 0;
      var cheios = Math.round((p < 0 ? 0 : p > 1 ? 1 : p) * PASSOS);
      if (cheios === ultimoCheios) return;
      ultimoCheios = cheios;
      barra.textContent = '[' + Array(cheios + 1).join('#') +
                          Array(PASSOS - cheios + 1).join('·') + ']';
    }
    window.addEventListener('scroll', function () {
      if (!pedidoBarra) pedidoBarra = requestAnimationFrame(pintarBarra);
    }, { passive: true });
    window.addEventListener('resize', pintarBarra);
    pintarBarra();
  }

  /* ---- 14. os números da sobre contam ------------------------------------ */
  // O CSS faz a contagem; aqui só entra o valor de destino e a classe, e só onde
  // @property existe (registerProperty como proxy da mesma geração de browser).
  var numeros = document.querySelectorAll('.bloco__n');
  if (numeros.length && !reduced && 'IntersectionObserver' in window &&
      window.CSS && typeof CSS.registerProperty === 'function') {
    var ioN = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-contando');
        ioN.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(numeros, function (el, i) {
      el.style.setProperty('--n', i + 1);
      ioN.observe(el);
    });
  }

  /* ---- 15. a órbita só gira em cena -------------------------------------- */
  // Treze animações infinitas rodando atrás de quem já rolou a página é gasto
  // sem plateia. Este observador não solta o alvo de propósito - ao contrário
  // do módulo 6, aqui a saída de cena importa tanto quanto a entrada.
  var orb = document.querySelector('[data-orb]');
  if (orb && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        orb.classList.toggle('is-girando', en.isIntersecting);
      });
    }, { threshold: 0.05 }).observe(orb);
  }

  /* ---- 16. os números do case sobem ao entrar em cena -------------------- */
  // O texto escrito no HTML é a fonte da verdade: sem JS, sem IntersectionObserver
  // ou com movimento reduzido, o número já está lá e certo. Aqui ele só é
  // desmontado em prefixo/valor/sufixo para subir até o que já estava escrito.
  //
  // ponytail: contagem em JS aqui, e não no @property que a sobre usa, porque
  // counter() do CSS não sabe escrever "3.500" com ponto de milhar nem "~1.000".
  var placas = document.querySelectorAll('.case__num b');
  if (placas.length && !reduced && 'IntersectionObserver' in window) {
    var ioP = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        ioP.unobserve(en.target);
        subirNumero(en.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(placas, function (el) { ioP.observe(el); });
  }

  function subirNumero(el) {
    var fim = el.textContent;
    // aceita o separador de milhar das duas línguas: 3.500 em português e
    // 3,500 em inglês. Os dois viram dígito puro antes do parseInt - sem a
    // vírgula no grupo, "3,500" no /en/ seria lido como 3 e a placa contaria
    // até três antes de fechar no texto original, que é 3.500.
    var m = fim.trim().match(/^(\D*)([\d.,]+)(\D*)$/);
    if (!m) return;                       // placa sem número: fica como está
    var alvo = parseInt(m[2].replace(/[.,]/g, ''), 10);
    // zero não sobe de lugar nenhum, e "1" não é contagem, é o número
    if (!alvo || alvo < 2) return;
    var pre = m[1], pos = m[3];
    var DEGRAUS = 14, DUR = 620, t0 = 0;
    requestAnimationFrame(function passo(t) {
      if (!t0) t0 = t;
      var p = (t - t0) / DUR;
      if (p >= 1) { el.textContent = fim; return; }   // fecha no texto original
      var degrau = Math.ceil(p * DEGRAUS) / DEGRAUS;
      // a contagem formata na língua da página: ponto de milhar em português,
      // vírgula em inglês, senão o número tremeria de formato ao subir e
      // fecharia num terceiro, que é o do texto original
      el.textContent = pre + Math.round(alvo * degrau).toLocaleString(EN ? 'en-US' : 'pt-BR') + pos;
      requestAnimationFrame(passo);
    });
  }

  /* ---- 17. quem abre o console ------------------------------------------- */
  // Quem vem ver como a esfera foi feita é exatamente quem eu quero que ache isto.
  try {
    console.log(
      '%c██░░\n░░██  LUAN TARASCHI\n\n' +
      '%c' + T.console + EMAIL,
      'font-family:monospace;font-size:15px;line-height:1.15;font-weight:700',
      'font-family:monospace;font-size:12px;line-height:1.5'
    );
  } catch (_) {}

  /* ---- 18. a guia lateral ------------------------------------------------ */
  // Um traço por seção, encostado na direita, na altura do meio da tela.
  //
  // A seção ativa é a última cujo topo já passou da linha do meio, e não a de
  // maior área visível: com seções de alturas muito diferentes o critério de
  // área troca de vencedor no meio da rolagem e a guia fica pulando pra trás.
  // A linha é a mesma altura em que a guia mora, então o traço aceso sempre
  // aponta pro que está literalmente ao lado dele.
  var guia = document.querySelector('[data-guia]');
  if (guia) {
    var elos = Array.prototype.slice.call(guia.querySelectorAll('a'));
    var secoes = elos.map(function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    });
    var pedidoGuia = 0, ativoAntes = -1;

    var pintarGuia = function () {
      pedidoGuia = 0;
      var linha = window.innerHeight * 0.5;
      var i = 0;
      for (var n = 0; n < secoes.length; n++) {
        if (secoes[n] && secoes[n].getBoundingClientRect().top <= linha) i = n;
      }
      var sec = secoes[i];
      if (!sec) return;

      // o traço aceso não é só posição, é régua: enche conforme a seção passa
      var r = sec.getBoundingClientRect();
      var p = r.height > 0 ? (linha - r.top) / r.height : 0;
      elos[i].style.setProperty('--p',
        Math.round((p < 0 ? 0 : p > 1 ? 1 : p) * 100) + '%');

      if (i === ativoAntes) return;
      if (elos[ativoAntes]) {
        elos[ativoAntes].removeAttribute('aria-current');
        elos[ativoAntes].style.removeProperty('--p');
      }
      elos[i].setAttribute('aria-current', 'true');
      ativoAntes = i;
      // a guia é fixa e atravessa seções de polaridades opostas: ela veste os
      // tokens da que está passando por baixo dela, senão some no fundo areia
      guia.classList.toggle('guia--inv', sec.classList.contains('invert'));
    };

    window.addEventListener('scroll', function () {
      if (!pedidoGuia) pedidoGuia = requestAnimationFrame(pintarGuia);
    }, { passive: true });
    window.addEventListener('resize', pintarGuia);
    pintarGuia();
  }

  /* ---- 19. o card que se transforma na página do case -------------------- */
  // O CSS já ligou a transição entre documentos e já batizou o alvo do outro
  // lado (.case__head + .shot). Aqui só falta dizer qual dos seis cards é o par
  // dessa vez: o nome tem que ser único durante a captura, e marcar os seis de
  // antemão faria o browser desistir da transição inteira por nome repetido.
  Array.prototype.forEach.call(document.querySelectorAll('.grid-projects .card'), function (card) {
    card.addEventListener('click', function () {
      var thumb = card.querySelector('.card__thumb');
      if (!thumb) return;
      // limpa antes de marcar: voltando pelo botão do browser a página pode vir
      // do cache com o nome de antes ainda colado, e aí dois thumbs carregariam
      // o mesmo nome no clique seguinte
      Array.prototype.forEach.call(document.querySelectorAll('.card__thumb'), function (t) {
        t.style.removeProperty('view-transition-name');
      });
      thumb.style.setProperty('view-transition-name', 'case-capa');
    });
  });

  /* ---- 20. o CV avisa que baixou ----------------------------------------- */
  // `download` entrega o arquivo sem carregar página nenhuma, então a tela não
  // se mexe e fica a dúvida de "cliquei?" - bem no momento em que a pessoa está
  // decidindo se te chama. Mesmo gesto do botão de copiar: troca o rótulo e
  // volta sozinho. ponytail: nada de barra de progresso, o arquivo tem 200kB.
  Array.prototype.forEach.call(document.querySelectorAll('a[download]'), function (link) {
    var rotulo = link.textContent, relogio = 0;
    link.addEventListener('click', function () {
      clearTimeout(relogio);
      link.textContent = T.salvo;
      relogio = setTimeout(function () { link.textContent = rotulo; }, 1800);
    });
  });

  /* ---- 21. o case que você já abriu -------------------------------------- */
  // Voltar pra grade e cair numa parede de seis cards iguais, sem saber qual já
  // leu, é o tipo de coisa que ninguém reclama e todo mundo sente.
  //
  // sessionStorage e não localStorage de propósito: a pergunta é "onde eu estava
  // nesta visita". Semana que vem a etiqueta seria memória de elefante sobre uma
  // coisa que a pessoa não lembra de ter feito.
  var VISTOS = 'lt-vistos';
  function lerVistos() {
    try { return JSON.parse(sessionStorage.getItem(VISTOS)) || []; } catch (_) { return []; }
  }
  function arquivoDe(caminho) { return (caminho || '').split('/').pop().split('#')[0]; }

  // numa página de case: anota que passou por aqui
  if (document.querySelector('.case__head')) {
    var aqui = arquivoDe(location.pathname);
    var lista = lerVistos();
    if (aqui && lista.indexOf(aqui) < 0) {
      lista.push(aqui);
      try { sessionStorage.setItem(VISTOS, JSON.stringify(lista)); } catch (_) {}
    }
  }

  // na home: etiqueta os cards correspondentes
  function marcarVistos() {
    var vistos = lerVistos();
    if (!vistos.length) return;
    Array.prototype.forEach.call(document.querySelectorAll('.grid-projects .card'), function (card) {
      if (vistos.indexOf(arquivoDe(card.getAttribute('href'))) < 0) return;
      var tags = card.querySelector('.card__tags');
      if (!tags || tags.querySelector('.tag--visto')) return;
      var marca = document.createElement('span');
      marca.className = 'tag tag--visto';
      // elemento de verdade com texto de verdade, não ::content: quem usa leitor
      // de tela também quer saber que já esteve ali
      marca.textContent = T.visto;
      tags.insertBefore(marca, tags.firstChild);
    });
  }
  marcarVistos();

  // e de novo ao voltar pelo botão do browser: aí a página vem inteira do
  // bfcache e nada deste arquivo roda de novo. Sem isto a etiqueta só aparecia
  // num recarregamento manual - ou seja, nunca, porque voltar de um case é
  // exatamente o momento para o qual ela foi feita.
  window.addEventListener('pageshow', function (e) { if (e.persisted) marcarVistos(); });

  /* ---- 22. o dedo rala o dither onde encostou ---------------------------- */
  // O módulo 12 faz isto com o ponteiro e está trancado em `pointer: fine`. No
  // toque o que existia era o thumb inteiro deslocando 6px, que é resposta de
  // card, não de onde a pessoa tocou. Aqui o par --cx/--cy é o mesmo, e o CSS
  // do @media (hover: none) acende a mesma camada.
  //
  // ponytail: pointerdown e não pointermove - no toque o pointermove só existe
  // com o dedo apoiado, que é justamente o gesto de rolar a página. Disputar
  // com a rolagem por causa de um efeito é trocar o site por um enfeite.
  var gradeToque = document.querySelector('.grid-projects');
  if (gradeToque && !reduced && window.matchMedia('(hover: none)').matches) {
    gradeToque.addEventListener('pointerdown', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      var thumb = card && card.querySelector('.card__thumb');
      if (!thumb) return;
      var r = thumb.getBoundingClientRect();
      thumb.style.setProperty('--cx', (e.clientX - r.left) + 'px');
      thumb.style.setProperty('--cy', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

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
            // play() devolve promessa e o browser pode recusar (aba em segundo
            // plano, política de mídia). Sem o catch vira erro solto no console
            // de quem abriu o console - justo o público do módulo 17.
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

  /* ---- 24. a captura abre em tamanho de verdade -------------------------- */
  // Seis dos oito cases têm uma captura só, e ela é a única prova visual de que
  // o produto existe - numa coluna de 42% de largura, onde nenhum texto de
  // interface se lê. Clicar pra ver grande é o gesto mais automático que existe
  // e até aqui não acontecia nada.
  //
  // O <dialog> nativo dá Escape, foco preso e página inerte de graça. O botão
  // que abre nasce aqui e não no HTML: sem JS não existe ampliação, e um botão
  // que não faz nada é pior que a falta dele.
  //
  // Só imagem, de propósito. Dois dos três vídeos são laço mudo e o terceiro
  // tem controle nativo: uma camada de clique por cima roubaria o play deles.
  var telas = [];
  Array.prototype.forEach.call(document.querySelectorAll('.shot'), function (fig) {
    if (fig.querySelector('img')) telas.push(fig);
  });

  if (telas.length && typeof HTMLDialogElement === 'function' &&
      typeof document.createElement('dialog').showModal === 'function') {
    var lupa = document.createElement('dialog');
    lupa.className = 'lupa';
    lupa.innerHTML =
      '<div class="lupa__quadro panel">' +
        '<div class="panel__bar">' +
          '<span class="panel__box" aria-hidden="true"></span>' +
          '<span class="panel__title" data-lupa-nome></span>' +
          '<span class="panel__conta" data-lupa-conta></span>' +
          '<span class="lupa__setas" data-lupa-setas hidden>' +
            '<button class="lupa__seta" type="button" data-lupa-ant ' +
                    'aria-label="' + T.capAnterior + '">‹</button>' +
            '<button class="lupa__seta" type="button" data-lupa-prox ' +
                    'aria-label="' + T.capProxima + '">›</button>' +
          '</span>' +
          '<button class="lupa__perto" type="button" data-lupa-perto hidden ' +
            'aria-label="' + T.aproximarCap + '" aria-pressed="false">' +
            T.aproximar + '</button>' +
          '<button class="lupa__fechar" type="button" data-lupa-fecha autofocus ' +
            'aria-label="' + T.fecharCap + '">' +
            T.fechar + '</button>' +
        '</div>' +
        '<div class="lupa__palco" data-lupa-palco></div>' +
        '<p class="lupa__cap mono-caps"><span data-lupa-cap></span>' +
          '<span class="lupa__dica" data-lupa-dica hidden>' + T.arraste + '</span></p>' +
      '</div>';
    document.body.appendChild(lupa);

    var quadro = lupa.querySelector('.lupa__quadro');
    var palco = lupa.querySelector('[data-lupa-palco]');
    var lupaNome = lupa.querySelector('[data-lupa-nome]');
    var lupaCap = lupa.querySelector('[data-lupa-cap]');
    var lupaConta = lupa.querySelector('[data-lupa-conta]');
    var lupaSetas = lupa.querySelector('[data-lupa-setas]');
    var botaoPerto = lupa.querySelector('[data-lupa-perto]');
    var lupaDica = lupa.querySelector('[data-lupa-dica]');
    var atual = 0, devolver = null, perto = false;

    // "Abre em tamanho de verdade" era mentira no celular. Medido num aparelho
    // de 390px: uma captura de 1440x900 abria com 342px de largura, 23,8% do
    // natural, e nesse tamanho um painel de sistema não tem rótulo nenhum
    // legível - a lupa entregava uma miniatura maior, não a captura.
    //
    // Então ela ganhou um segundo estado: 1:1 com o palco rolando. O primeiro
    // continua sendo a captura inteira, que é o que responde "como é a cara
    // disso"; o segundo responde "o que está escrito aí", que é a pergunta que
    // só aparece depois da primeira.
    //
    // O gatilho é a RAZÃO entre o tamanho na tela e o natural, não a largura da
    // janela: numa janela estreita de desktop o problema é o mesmo, e num
    // tablet largo a captura já cabe e o botão nem aparece. Abaixo de 68% a
    // interface dentro da imagem começa a se desmanchar.
    var LIMITE_PERTO = 0.68;

    function ajustarPerto(img) {
      var cabe = img.getBoundingClientRect().width;
      var vale = !!(cabe && img.naturalWidth && cabe / img.naturalWidth < LIMITE_PERTO);
      botaoPerto.hidden = !vale;
      lupaDica.hidden = !vale;
      lupa.classList.toggle('lupa--pode-perto', vale);
      if (!vale && perto) trocarPerto(false);
    }

    function trocarPerto(quer) {
      perto = quer;
      lupa.classList.toggle('lupa--perto', perto);
      botaoPerto.setAttribute('aria-pressed', perto ? 'true' : 'false');
      botaoPerto.setAttribute('aria-label', perto ? T.afastarCap : T.aproximarCap);
      if (!perto) return;
      // entra pelo meio na horizontal e pelo topo: o canto esquerdo de captura
      // de sistema é quase sempre barra lateral, e o topo é onde mora o que
      // identifica a tela
      palco.scrollLeft = (palco.scrollWidth - palco.clientWidth) / 2;
      palco.scrollTop = 0;
    }

    // o nome do arquivo vira título de painel, do mesmo jeito que retrato.bmp e
    // embeddings.ts: diz de onde a imagem veio sem precisar de uma frase
    function arquivoDe(url) {
      return String(url || '').split('/').pop().split('?')[0] || 'captura';
    }
    function legendaDe(fig) {
      var s = fig.querySelector('figcaption span');
      return s ? s.textContent.trim() : '';
    }
    // Clona o <picture> inteiro em vez de copiar uma URL. A primeira versão
    // lia `img.currentSrc`, e isso só existe depois que o browser escolheu a
    // fonte: as capturas são `loading="lazy"` e ficam abaixo da dobra, então
    // ao clicar numa que ainda não carregou o valor vinha vazio e caía no
    // `src`, que é o PNG. A lupa abria o arquivo grande com o WebP ao lado.
    // Clonando o elemento, quem escolhe a fonte continua sendo o browser.
    function mostrar(i) {
      atual = (i + telas.length) % telas.length;
      var fig = telas[atual];
      var orig = fig.querySelector('picture') || fig.querySelector('img');
      var copia = orig.cloneNode(true);
      var img = copia.tagName === 'IMG' ? copia : copia.querySelector('img');
      img.className = 'lupa__img';
      // aqui a imagem é o conteúdo, não pode chegar atrasada
      img.removeAttribute('loading');
      palco.innerHTML = '';
      palco.appendChild(copia);
      // o nome definitivo é o do arquivo que o browser de fato buscou, e isso
      // só se sabe no load; até lá vale o do atributo, que nunca fica vazio
      lupaNome.textContent = arquivoDe(img.getAttribute('src'));
      // trocar de captura volta para a vista inteira: a próxima pode ser de
      // outro tamanho, e herdar o zoom da anterior abriria no meio do nada
      trocarPerto(false);
      botaoPerto.hidden = true;
      img.addEventListener('load', function () {
        lupaNome.textContent = arquivoDe(img.currentSrc || img.src);
        ajustarPerto(img);
      });
      if (lupa.open && img.complete && img.naturalWidth) ajustarPerto(img);
      lupaCap.textContent = legendaDe(fig);
      lupaConta.textContent = telas.length > 1 ? (atual + 1) + '/' + telas.length : '';
    }
    function abrir(i, origem) {
      devolver = origem;
      mostrar(i);
      lupa.showModal();
      // só agora a imagem tem caixa: antes do showModal o diálogo não está no
      // layout e toda medida sai zero
      var img = palco.querySelector('img');
      if (img && img.complete && img.naturalWidth) ajustarPerto(img);
    }
    function fechar() {
      trocarPerto(false);
      if (reduced) return lupa.close();
      quadro.classList.add('saindo');
      setTimeout(function () {
        quadro.classList.remove('saindo');
        lupa.close();
      }, 180);
    }

    if (telas.length > 1) lupaSetas.removeAttribute('hidden');
    lupa.querySelector('[data-lupa-ant]').addEventListener('click', function () { mostrar(atual - 1); });
    lupa.querySelector('[data-lupa-prox]').addEventListener('click', function () { mostrar(atual + 1); });
    lupa.querySelector('[data-lupa-fecha]').addEventListener('click', fechar);
    botaoPerto.addEventListener('click', function () { trocarPerto(!perto); });
    // e o gesto óbvio também: tocar na imagem. No toque, arrastar não dispara
    // clique, então rolar o palco aproximado não fecha o zoom sem querer.
    palco.addEventListener('click', function () {
      if (lupa.classList.contains('lupa--pode-perto')) trocarPerto(!perto);
    });

    // clique no véu fecha: o alvo só é o próprio <dialog> quando o clique caiu
    // fora do quadro, porque o quadro cobre a si mesmo e aos filhos
    lupa.addEventListener('click', function (e) { if (e.target === lupa) fechar(); });
    // Escape fecha nativamente; interrompo só pra passar pela mesma saída
    // animada do botão, senão o teclado teria um corte seco e o mouse não
    lupa.addEventListener('cancel', function (e) { e.preventDefault(); fechar(); });
    lupa.addEventListener('keydown', function (e) {
      if (telas.length < 2) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(atual + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); mostrar(atual - 1); }
    });
    // devolver o foco é obrigação de quem abriu um modal: sem isto o Tab
    // recomeça do topo da página e a pessoa perde o lugar onde estava lendo
    lupa.addEventListener('close', function () {
      if (devolver) devolver.focus();
      devolver = null;
    });

    telas.forEach(function (fig, i) {
      var img = fig.querySelector('img');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'shot__lupa';
      b.setAttribute('aria-label', T.ampliar + (legendaDe(fig) || img.alt || T.captura).slice(0, 90));
      var glifo = document.createElement('span');
      glifo.className = 'shot__lupa-glifo';
      glifo.setAttribute('aria-hidden', 'true');
      b.appendChild(glifo);
      fig.appendChild(b);
      b.addEventListener('click', function () { abrir(i, b); });
    });
  }

  /* ---- 25. o índice do case --------------------------------------------- */
  // O JVB tem 11,7 telas e nove blocos; a Triagem, 8,7 telas e sete. Quem abre
  // não faz ideia do que vem pela frente nem de quanto falta, e a barra em
  // ASCII do topo (módulo 13) só responde a segunda pergunta.
  //
  // Nasce daqui em vez de estar no HTML porque são oito páginas com títulos
  // diferentes: a lista escrita à mão seria oito cópias de uma coisa que o
  // documento já diz, e passaria a mentir na primeira vez que alguém trocasse
  // um <h2>. Aqui ela não tem como divergir - ela É os <h2>.
  //
  // Sem marcação de bloco atual, e isso é decisão e não esquecimento: de 820px
  // pra cima o corpo do case é grade de duas colunas, então dois blocos
  // dividem a mesma altura. No JVB "O problema" e "A decisão" começam os dois
  // em y=1492. Marcar um seria errar o outro em metade da rolagem.
  var corpoCase = document.querySelector('.case__body');
  var blocos = document.querySelectorAll('.case__block');
  if (corpoCase && blocos.length >= 4) {
    var usados = {};
    function apelido(txt) {
      var base = txt.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')   // tira o acento
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'bloco';
      // dois blocos com o mesmo título dariam a mesma âncora, e a segunda
      // nunca seria alcançável - o navegador para na primeira que encontra
      usados[base] = (usados[base] || 0) + 1;
      return usados[base] > 1 ? base + '-' + usados[base] : base;
    }

    var itens = [];
    Array.prototype.forEach.call(blocos, function (bloco) {
      var h = bloco.querySelector('h2');
      if (!h) return;
      var titulo = h.textContent.trim();
      if (!bloco.id) bloco.id = apelido(titulo);
      itens.push({ id: bloco.id, titulo: titulo });
    });

    if (itens.length >= 4) {
      var sumario = document.createElement('nav');
      sumario.className = 'sumario panel';
      sumario.setAttribute('aria-label', T.indice);

      var barra2 = document.createElement('div');
      barra2.className = 'panel__bar';
      barra2.innerHTML = '<span class="panel__box" aria-hidden="true"></span>' +
        '<span class="panel__title">' + T.nestaPagina + '</span>' +
        '<span class="panel__conta">' + itens.length + T.blocos + '</span>';
      sumario.appendChild(barra2);

      var lista = document.createElement('ol');
      lista.className = 'sumario__lista';
      itens.forEach(function (item, n) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + item.id;
        var num = document.createElement('span');
        num.className = 'sumario__n';
        num.setAttribute('aria-hidden', 'true');   // a ordem já vem do <ol>
        num.textContent = (n + 1 < 10 ? '0' : '') + (n + 1);
        a.appendChild(num);
        // textContent e não innerHTML: o título vem do documento, mas montar
        // marcação com texto de outro lugar é hábito ruim mesmo quando a
        // origem é confiável
        a.appendChild(document.createTextNode(item.titulo));
        li.appendChild(a);
        lista.appendChild(li);
      });
      sumario.appendChild(lista);
      corpoCase.parentNode.insertBefore(sumario, corpoCase);

      // Os ids nascem aqui, e o navegador procura o alvo do #hash enquanto
      // analisa o HTML - muito antes disso. Então um link copiado do índice e
      // colado noutro lugar abriria a página no topo, calado. Aqui o pulo
      // acontece de novo, agora que o alvo existe.
      //
      // O `scroll-behavior: auto` inline não é enfeite: quem chega por link
      // quer estar lá, não assistir à viagem. E `behavior: 'auto'` na chamada
      // não resolve - "auto" quer dizer "o que o CSS mandar", e o CSS aqui
      // manda `smooth`. Medi: a página descia rolando cinco mil pixels na cara
      // de quem abriu. Desligar na raiz por um instante é o que funciona sem
      // depender de `behavior: 'instant'`, que é mais novo que o resto.
      if (location.hash.length > 1) {
        var destino = document.getElementById(location.hash.slice(1));
        if (destino) {
          var comportamento = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          destino.scrollIntoView({ block: 'start' });
          document.documentElement.style.scrollBehavior = comportamento;
        }
      }
    }
  }

  /* ---- 26. o sistema apaga a luz e o site acompanha ---------------------- */
  // O script do <head> lê a preferência do sistema uma vez, antes da primeira
  // pintura, e nunca mais olha. Quem deixa o computador virar para o escuro às
  // seis da tarde ficava com a aba no tema da manhã até recarregar - e num site
  // que tem um interruptor de luz desenhado no topo, isso é justamente onde a
  // falta se nota.
  //
  // Só vale para quem nunca tocou no interruptor. A chave no localStorage
  // aparece no primeiro clique e em mais lugar nenhum, então a existência dela
  // É a escolha explícita da pessoa - e escolha explícita ganha do sistema.
  // Por isso a troca automática passa o `semGravar`: gravar aqui carimbaria uma
  // decisão que ninguém tomou, e o site pararia de acompanhar para sempre logo
  // na primeira vez que acompanhasse.
  //
  // Entra pela cortina, como o clique. A troca é a mesma coisa; o que muda é
  // quem pediu, e não avisar seria a página trocando de cor sem motivo visível.
  if (window.matchMedia) {
    var sistemaEscuro = window.matchMedia('(prefers-color-scheme: dark)');
    var seguirSistema = function (e) {
      try { if (localStorage.getItem(STORE)) return; } catch (_) { return; }
      var alvo = e.matches ? 'dark' : 'light';
      if (root.getAttribute('data-theme') === alvo) return;
      trocar(alvo, true);
    };
    // addListener é o nome antigo; Safari só ganhou addEventListener em 14
    if (sistemaEscuro.addEventListener) sistemaEscuro.addEventListener('change', seguirSistema);
    else if (sistemaEscuro.addListener) sistemaEscuro.addListener(seguirSistema);
  }
})();
