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
   19 arrastar a tecnologia para fora da órbita
   ========================================================================== */
(function () {
  'use strict';

  // scrollRestoration = 'manual' mora no <script> inline do <head> das três
  // páginas, junto com o tema. Aqui seria tarde: este arquivo tem `defer` e o
  // browser já teria restaurado o offset antes de ele rodar.

  // ponytail: fonte única do e-mail - o link, o botão copiar e o form leem daqui.
  var EMAIL = 'luantaraschi@gmail.com';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. menu mobile --------------------------------------------------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var panel = document.querySelector('[data-nav-panel]');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (open) { panel.removeAttribute('hidden'); } else { panel.setAttribute('hidden', ''); }
      toggle.setAttribute('aria-expanded', String(open));
    });
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- 2. copiar e-mail -------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var done = function () {
        btn.textContent = 'copiado ✓';
        btn.style.borderColor = 'var(--accent)';
        setTimeout(function () { btn.textContent = label; btn.style.borderColor = ''; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(done, function () { btn.textContent = 'copie manualmente'; });
      } else {
        // fallback para contextos sem clipboard API
        var tmp = document.createElement('textarea');
        tmp.value = EMAIL;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); done(); } catch (_) { btn.textContent = 'copie manualmente'; }
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
      nome: function (v) { return v.trim().length >= 2 ? '' : 'Escreve seu nome (2 caracteres no mínimo).'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'E-mail inválido, confere o formato.'; },
      mensagem: function (v) { return v.trim().length >= 10 ? '' : 'Conta um pouco mais: 10 caracteres no mínimo.'; }
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

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (input) {
        if (validateField(input) && !firstBad) firstBad = input;
      });
      if (firstBad) {
        firstBad.focus();
        if (status) status.textContent = '› corrija os campos marcados acima.';
        return;
      }
      var data = new FormData(form);
      var url = 'mailto:' + EMAIL +
        '?subject=' + encodeURIComponent('Contato do portfólio: ' + data.get('nome')) +
        '&body=' + encodeURIComponent(data.get('mensagem') + '\n\n' + data.get('nome') + ' (' + data.get('email') + ')');
      if (status) status.textContent = '› abrindo seu cliente de e-mail…';
      window.location.href = url;
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

  var LEGENDA = {
    dark: 'Retrato de Luan Taraschi em 1 bit, sem óculos escuros.',
    light: 'Retrato de Luan Taraschi em 1 bit, de óculos escuros por causa da luz.'
  };

  function paintToggles(theme) {
    Array.prototype.forEach.call(toggles, function (b) {
      if (b.getAttribute('role') === 'switch') {
        b.setAttribute('aria-checked', String(theme === 'light'));
      }
    });
    if (film) film.setAttribute('aria-label', LEGENDA[theme]);
  }

  function replay(el, cls) {
    el.classList.remove('play-on', 'play-off', 'flinch', 'poke');
    void el.offsetWidth;                 // reflow forçado: reinicia a animação
    el.classList.add(cls);
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORE, theme); } catch (_) {}
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
  var CORTINA = 420, METADE = 210;
  var wipeEl = document.querySelector('[data-wipe]');
  var cortinando = false;
  var volta = false;             // a faixa alterna o sentido a cada troca

  function trocar(theme) {
    if (reduced || !wipeEl || cortinando) {
      if (cortinando) return;
      setTheme(theme);
      reagir(theme);
      return;
    }
    cortinando = true;
    wipeEl.className = 'wipe ' + (theme === 'light' ? 'wipe--claro' : 'wipe--escuro') +
                       (volta ? ' wipe--volta' : '');
    volta = !volta;
    void wipeEl.offsetWidth;              // reinicia a animação da faixa
    wipeEl.classList.add('is-on');
    setTimeout(function () { setTheme(theme); reagir(theme); }, METADE);
    setTimeout(function () {
      wipeEl.classList.remove('is-on');
      cortinando = false;
    }, CORTINA);
  }

  if (film) {
    film.addEventListener('animationend', function () {
      // solta a animação e devolve o controle à regra estática do tema
      film.classList.remove('play-on', 'play-off');
    });
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

  function encaixar() {
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
        // enquanto alguém segura um chip a órbita fica congelada de propósito
        // (módulo 19); entrar e sair de cena não pode religar o giro por baixo.
        orb.classList.toggle('is-girando', en.isIntersecting && !orb.dataset.arrastando);
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
    var m = fim.trim().match(/^(\D*)([\d.]+)(\D*)$/);
    if (!m) return;                       // placa sem número: fica como está
    var alvo = parseInt(m[2].replace(/\./g, ''), 10);
    // zero não sobe de lugar nenhum, e "1" não é contagem, é o número
    if (!alvo || alvo < 2) return;
    var pre = m[1], pos = m[3];
    var DEGRAUS = 14, DUR = 620, t0 = 0;
    requestAnimationFrame(function passo(t) {
      if (!t0) t0 = t;
      var p = (t - t0) / DUR;
      if (p >= 1) { el.textContent = fim; return; }   // fecha no texto original
      var degrau = Math.ceil(p * DEGRAUS) / DEGRAUS;
      el.textContent = pre + Math.round(alvo * degrau).toLocaleString('pt-BR') + pos;
      requestAnimationFrame(passo);
    });
  }

  /* ---- 17. quem abre o console ------------------------------------------- */
  // Quem vem ver como a esfera foi feita é exatamente quem eu quero que ache isto.
  try {
    console.log(
      '%c██░░\n░░██  LUAN TARASCHI\n\n' +
      '%cSem framework, sem build, sem dependência.\n' +
      'A esfera é dithering Bayer 8×8 pintado em canvas, um pixel por vez.\n\n' +
      'Procurando dev? ' + EMAIL,
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

  /* ---- 19. arrastar a tecnologia para fora da órbita --------------------- */
  // O chip sai do lugar enquanto você segura e volta puxado quando você solta.
  //
  // Três decisões que valem a linha:
  //
  // 1. Enquanto alguém segura, a órbita inteira congela. Sem isso o encaixe
  //    seguia girando por baixo do dedo e o chip fugia sozinho da mão.
  // 2. O deslocamento vai em --dx/--dy, lidos pelo `translate` do chip.
  //    `translate` é propriedade separada de `transform`, então ela convive com
  //    a animação de contragiro sem que uma sobrescreva a outra.
  // 3. A corda é um elemento solto dentro de .orb, e não um ::before do chip:
  //    o chip vive num referencial já girado pelo braço e pelo contragiro, e
  //    medir o ângulo lá dentro seria desfazer duas rotações a cada quadro.
  var orbArea = document.querySelector('[data-orb]');
  var corda = document.querySelector('[data-corda]');
  if (orbArea && corda && window.PointerEvent) {
    var LEASH = 150;   // até onde a corda deixa ir
    var GRAO = 5;      // o arrasto anda de 5 em 5 px: nada aqui é liso

    Array.prototype.forEach.call(orbArea.querySelectorAll('.orb__node'), function (chip) {
      var x0 = 0, y0 = 0, dx = 0, dy = 0, cx0 = 0, cy0 = 0, rafMola = 0;

      function por(vx, vy) {
        vx = Math.round(vx / GRAO) * GRAO;
        vy = Math.round(vy / GRAO) * GRAO;
        chip.style.setProperty('--dx', vx + 'px');
        chip.style.setProperty('--dy', vy + 'px');
        var d = Math.sqrt(vx * vx + vy * vy);
        if (d < GRAO) { delete corda.dataset.esticada; return; }
        corda.dataset.esticada = '1';
        corda.style.left = cx0 + 'px';
        corda.style.top = (cy0 - 1) + 'px';   // a corda tem 2px: -1 centraliza
        corda.style.width = d + 'px';
        corda.style.rotate = Math.atan2(vy, vx) + 'rad';
      }

      function destravar() {
        delete orbArea.dataset.arrastando;
        delete corda.dataset.esticada;
        if (!reduced) orbArea.classList.add('is-girando');
      }

      chip.addEventListener('pointerdown', function (e) {
        if (e.button) return;                 // só o botão principal
        cancelAnimationFrame(rafMola);
        try { chip.setPointerCapture(e.pointerId); } catch (_) {}
        chip.dataset.preso = '1';
        orbArea.dataset.arrastando = '1';
        orbArea.classList.remove('is-girando');
        x0 = e.clientX; y0 = e.clientY;
        dx = dy = 0;
        // o encaixe: onde o chip está parado agora, em coordenadas de .orb.
        // Medido uma vez só, porque daqui pra frente a órbita está congelada.
        var ro = orbArea.getBoundingClientRect(), rc = chip.getBoundingClientRect();
        cx0 = rc.left + rc.width / 2 - ro.left;
        cy0 = rc.top + rc.height / 2 - ro.top;
        e.preventDefault();
      });

      chip.addEventListener('pointermove', function (e) {
        if (!chip.dataset.preso) return;
        var vx = e.clientX - x0, vy = e.clientY - y0;
        var d = Math.sqrt(vx * vx + vy * vy);
        if (d > LEASH) { vx *= LEASH / d; vy *= LEASH / d; }   // a corda tem fim
        dx = vx; dy = vy;
        por(dx, dy);
      });

      function soltar(e) {
        if (!chip.dataset.preso) return;
        delete chip.dataset.preso;
        try { chip.releasePointerCapture(e.pointerId); } catch (_) {}
        if (reduced) { por(0, 0); destravar(); return; }
        // a volta é uma oscilação amortecida: passa do ponto, corrige e assenta.
        // O `por` acima arredonda tudo em 5 px, então a mola é física de verdade
        // mas o desenho dela sai em degrau, igual ao resto do site.
        var ix = dx, iy = dy, t0 = 0, DUR = 560;
        rafMola = requestAnimationFrame(function passo(t) {
          if (!t0) t0 = t;
          var p = (t - t0) / DUR;
          if (p >= 1) { por(0, 0); destravar(); return; }
          var f = Math.exp(-5.2 * p) * Math.cos(p * 7.6);
          por(ix * f, iy * f);
          rafMola = requestAnimationFrame(passo);
        });
      }
      chip.addEventListener('pointerup', soltar);
      chip.addEventListener('pointercancel', soltar);
    });
  }
})();
