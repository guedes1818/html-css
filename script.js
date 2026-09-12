/* ==========================================================================
   DAVI GUEDES — Portfólio
   Animação e interação.

   Dependências opcionais: GSAP + ScrollTrigger (via CDN).
   Se o CDN falhar, a página continua funcional: as seções pinadas caem
   para um layout nativo (scroll horizontal / empilhado) e as revelações
   passam a usar IntersectionObserver. Nada quebra.
   ========================================================================== */
(function () {
  'use strict';

  var D = document;
  var W = window;
  var root = D.documentElement;

  var reduceMotion = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarse = W.matchMedia('(hover: none), (pointer: coarse)').matches;
  var isSmall = function () { return W.innerWidth < 901; };
  var hasGSAP = typeof W.gsap !== 'undefined' && typeof W.ScrollTrigger !== 'undefined';

  if (hasGSAP) { gsap.registerPlugin(ScrollTrigger); }

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var $ = function (sel, ctx) { return (ctx || D).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || D).querySelectorAll(sel)); };

  /* ------------------------------------------------------------------
     1. Split de texto — preserva tags internas (<em>, <strong>…)
     ------------------------------------------------------------------ */
  function splitWords(el) {
    if (el.dataset.split === 'done') { return; }
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.nodeValue.split(/(\s+)/);
          var frag = D.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) { return; }
            if (/^\s+$/.test(part)) { frag.appendChild(D.createTextNode(' ')); return; }
            var wrap = D.createElement('span');
            wrap.className = 'w';
            var inner = D.createElement('i');
            inner.textContent = part;
            wrap.appendChild(inner);
            frag.appendChild(wrap);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.className !== 'w') {
          walk(child);
        }
      });
    };
    walk(el);
    $$('.w i', el).forEach(function (i, idx) {
      i.style.transitionDelay = (idx * 0.06) + 's';
    });
    el.dataset.split = 'done';
  }

  function splitLetters(el) {
    var text = el.textContent.trim();
    el.textContent = '';
    text.split('').forEach(function (ch) {
      var s = D.createElement('span');
      s.textContent = ch;
      el.appendChild(s);
    });
    return $$('span', el);
  }

  $$('[data-reveal]').forEach(splitWords);
  $$('.arch-link__head[data-split]').forEach(function (el) {
    var text = el.textContent;
    el.textContent = '';
    text.split('').forEach(function (ch, i) {
      var s = D.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.transitionDelay = (i * 0.018) + 's';
      el.appendChild(s);
    });
  });

  /* ------------------------------------------------------------------
     2. Revelações ao entrar na viewport
     ------------------------------------------------------------------ */
  (function reveals() {
    var targets = $$('[data-reveal], [data-fade]');
    if (!targets.length) { return; }

    if (reduceMotion || !('IntersectionObserver' in W)) {
      targets.forEach(function (t) { t.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    targets.forEach(function (t) { io.observe(t); });
  })();

  /* ------------------------------------------------------------------
     3. Smooth scrolling (inércia leve) — só em ponteiro fino
     ------------------------------------------------------------------ */
  var smooth = { on: !reduceMotion && !isCoarse, target: 0, current: 0, active: false };

  (function smoothScroll() {
    if (!smooth.on) { return; }

    smooth.target = smooth.current = W.scrollY;

    var maxScroll = function () {
      return Math.max(0, D.documentElement.scrollHeight - W.innerHeight);
    };

    W.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented) { return; }
      var delta = e.deltaY;
      if (e.deltaMode === 1) { delta *= 16; }
      else if (e.deltaMode === 2) { delta *= W.innerHeight; }

      if (!smooth.active) { smooth.target = W.scrollY; }
      smooth.target = clamp(smooth.target + delta, 0, maxScroll());
      smooth.active = true;
      e.preventDefault();
    }, { passive: false });

    // Teclado, âncoras e barra de rolagem devolvem o controle ao scroll nativo.
    ['keydown', 'mousedown', 'touchstart'].forEach(function (evt) {
      W.addEventListener(evt, function () { smooth.active = false; }, { passive: true });
    });
  })();

  function scrollToY(y) {
    smooth.active = false;
    W.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  $$('[data-scroll], .nav__links a, .nav__mark').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) !== '#') { return; }
    a.addEventListener('click', function (e) {
      var t = $(href);
      if (!t) { return; }
      e.preventDefault();
      scrollToY(t.getBoundingClientRect().top + W.scrollY);
    });
  });

  var topBtn = $('[data-top]');
  if (topBtn) { topBtn.addEventListener('click', function () { scrollToY(0); }); }

  /* ------------------------------------------------------------------
     4. HERO — parallax de scroll + parallax de mouse
     ------------------------------------------------------------------ */
  var hero = $('.hero');
  var heroWord = $('[data-hero-word]');
  var heroType = $('.hero__type');
  var heroFigure = $('[data-hero-figure]');
  var heroBeam = $('[data-hero-beam]');
  var heroLetters = heroWord ? splitLetters(heroWord) : [];

  var heroImg = $('.hero__img');
  if (heroImg) {
    var flagMissing = function () { if (hero) { hero.classList.add('is-noimg'); } };
    heroImg.addEventListener('error', flagMissing);
    if (heroImg.complete && heroImg.naturalWidth === 0) { flagMissing(); }
  }

  // Retrato da seção Sobre: se a foto não existir, mostra o gradiente de apoio.
  $$('.about__portrait img').forEach(function (img) {
    var ph = $('.about__ph', img.parentNode);
    var swap = function () {
      img.style.display = 'none';
      if (ph) { ph.hidden = false; }
    };
    img.addEventListener('error', swap);
    if (img.complete && img.naturalWidth === 0) { swap(); }
  });

  /* A palavra "DEVELOPER" é ajustada por medição: ocupa a largura da tela com
     um leve sangramento nas bordas, independente da fonte que carregar. */
  var wordUnit = 0;

  function fitHeroWord() {
    if (!heroWord) { return; }
    if (!wordUnit) {
      var prev = heroWord.style.fontSize;
      heroWord.style.fontSize = '100px';
      wordUnit = heroWord.scrollWidth / 100;
      heroWord.style.fontSize = prev;
      if (!wordUnit) { return; }
    }
    heroWord.style.fontSize = (W.innerWidth * 1.06 / wordUnit) + 'px';
  }

  fitHeroWord();
  W.addEventListener('load', function () { wordUnit = 0; fitHeroWord(); });
  if (D.fonts && D.fonts.ready) {
    D.fonts.ready.then(function () { wordUnit = 0; fitHeroWord(); });
  }

  var mouse = { x: 0, y: 0, cx: 0, cy: 0 };

  if (!reduceMotion && !isCoarse) {
    W.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX / W.innerWidth - 0.5;
      mouse.y = e.clientY / W.innerHeight - 0.5;
    }, { passive: true });
  }

  /* Parallax do retrato da seção Sobre + linha do processo */
  var parallaxImgs = $$('[data-parallax]');
  var processList = $('[data-process]');
  var processLine = $('[data-process-line]');

  /* ------------------------------------------------------------------
     5. Loop de renderização
     ------------------------------------------------------------------ */
  function frame() {
    // 5.1 scroll com inércia
    if (smooth.on) {
      if (smooth.active) {
        smooth.current = lerp(smooth.current, smooth.target, 0.12);
        if (Math.abs(smooth.target - smooth.current) < 0.35) {
          smooth.current = smooth.target;
          smooth.active = false;
        }
        W.scrollTo(0, smooth.current);
      } else {
        smooth.current = smooth.target = W.scrollY;
      }
    }

    var sy = W.scrollY;
    var vh = W.innerHeight;

    // 5.2 mouse com amortecimento
    mouse.cx = lerp(mouse.cx, mouse.x, 0.06);
    mouse.cy = lerp(mouse.cy, mouse.y, 0.06);

    // 5.3 hero
    if (hero && !reduceMotion) {
      var hh = hero.offsetHeight || vh;
      var p = clamp(sy / hh, 0, 1);

      if (heroType) {
        heroType.style.transform =
          'translate3d(' + (mouse.cx * -26) + 'px,' + (p * -vh * 0.12 + mouse.cy * -14) + 'px,0) scale(' + (1 + p * 0.08) + ')';
        heroType.style.opacity = String(clamp(1 - p * 1.25, 0, 1));
      }

      if (heroFigure) {
        heroFigure.style.transform =
          'translate3d(' + (mouse.cx * 30) + 'px,' + (p * vh * 0.14 + mouse.cy * 16) + 'px,0) scale(' + (1 + p * 0.05) + ')';
        heroFigure.style.opacity = String(clamp(1 - p * 1.05, 0, 1));
      }

      if (heroBeam) {
        heroBeam.style.transform = 'translate3d(' + (mouse.cx * -60) + 'px,' + (mouse.cy * -30) + 'px,0)';
      }

      // Letras se afastam levemente do centro conforme o scroll
      if (heroLetters.length) {
        var mid = (heroLetters.length - 1) / 2;
        for (var i = 0; i < heroLetters.length; i++) {
          var dir = (i - mid) / mid;
          heroLetters[i].style.transform = 'translate3d(' + (dir * p * 60) + 'px,0,0)';
        }
      }
    }

    // 5.4 parallax de imagens
    if (!reduceMotion) {
      for (var k = 0; k < parallaxImgs.length; k++) {
        var img = parallaxImgs[k];
        var r = img.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) { continue; }
        var amount = parseFloat(img.dataset.parallax) || 0.15;
        var rel = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1
        img.style.transform = 'translate3d(0,' + (rel * amount * 100) + 'px,0)';
      }
    }

    // 5.5 linha do processo
    if (processList && processLine) {
      var pr = processList.getBoundingClientRect();
      var prog = clamp((vh * 0.75 - pr.top) / (pr.height * 0.85), 0, 1);
      processLine.style.transform = 'scaleY(' + prog + ')';
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ------------------------------------------------------------------
     6. Seções pinadas (GSAP ScrollTrigger)
     ------------------------------------------------------------------ */
  function buildPinned() {
    if (!hasGSAP || reduceMotion || isSmall()) { return; }

    // 6.1 EXPERTISE — scroll horizontal com pin
    var expSection = $('[data-expertise]');
    var track = $('[data-exp-track]');
    var expBar = $('[data-exp-progress]');

    if (expSection && track) {
      expSection.classList.remove('is-native');

      var distance = function () {
        return Math.max(0, track.scrollWidth - W.innerWidth + parseFloat(getComputedStyle(track).paddingLeft));
      };

      gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: expSection,
          start: 'top top',
          end: function () { return '+=' + (distance() + W.innerHeight * 0.6); },
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: function (self) {
            if (expBar) { expBar.style.transform = 'scaleX(' + self.progress + ')'; }
          }
        }
      });
    }

    // 6.2 PROJETOS — pin com entrada um a um
    var projSection = $('[data-projects]');
    if (projSection) {
      var projects = $$('.project', projSection);
      var counter = $('[data-proj-current]');
      var total = $('[data-proj-total]');
      if (total) { total.textContent = ('0' + projects.length).slice(-2); }

      if (projects.length) {
        projSection.classList.add('projects--pinned');
        // autoAlpha = opacity + visibility: o projeto invisível some do fluxo de
        // foco e de leitores de tela em vez de ficar clicável por baixo.
        projects.forEach(function (p, i) {
          gsap.set(p, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 60 });
          if (i === 0) { p.classList.add('is-active'); }
        });

        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: projSection,
            start: 'top top',
            end: '+=' + (projects.length * 100) + '%',
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: function (self) {
              var idx = Math.min(projects.length - 1, Math.floor(self.progress * projects.length));
              projects.forEach(function (p, i) { p.classList.toggle('is-active', i === idx); });
              if (counter) { counter.textContent = ('0' + (idx + 1)).slice(-2); }
            }
          }
        });

        // Um de cada vez: o projeto anterior sai quase por completo antes de o
        // seguinte entrar — sem os dois legíveis ao mesmo tempo.
        projects.forEach(function (p, i) {
          if (i === 0) { tl.to(p, { autoAlpha: 1, y: 0, duration: 0.6 }, 0); return; }
          tl.to(projects[i - 1], { autoAlpha: 0, y: -90, duration: 0.45, ease: 'power2.in' }, '>')
            .fromTo(p,
              { autoAlpha: 0, y: 90 },
              { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '>');
        });

        tl.to({}, { duration: 0.5 });
      }
    }

    // 6.3 Fade global do rodapé
    var footerName = $('.footer__name');
    if (footerName) {
      gsap.fromTo(footerName,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: footerName, start: 'top 92%' }
        });
    }
  }

  buildPinned();

  var resizeTimer;
  W.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      wordUnit = 0;
      fitHeroWord();
      if (hasGSAP) { ScrollTrigger.refresh(); }
    }, 180);
  });

  /* ------------------------------------------------------------------
     7. Arquivo — imagem que persegue o cursor (mola)
     ------------------------------------------------------------------ */
  (function archiveLinks() {
    if (isCoarse || reduceMotion) { return; }
    $$('.arch-link').forEach(function (link) {
      var img = $('.arch-link__img', link);
      if (!img) { return; }

      var state = { x: 50, y: 50, tx: 50, ty: 50, raf: 0, hover: false };

      var run = function () {
        state.x = lerp(state.x, state.tx, 0.12);
        state.y = lerp(state.y, state.ty, 0.12);
        img.style.left = state.x + '%';
        img.style.top = state.y + '%';
        if (state.hover || Math.abs(state.tx - state.x) > 0.1) {
          state.raf = requestAnimationFrame(run);
        } else {
          state.raf = 0;
        }
      };

      link.addEventListener('mousemove', function (e) {
        var r = link.getBoundingClientRect();
        var xPct = (e.clientX - r.left) / r.width - 0.5;
        var yPct = (e.clientY - r.top) / r.height - 0.5;
        // Mesma inversão do componente original: 0.5 → 40%, -0.5 → 60%
        state.tx = 50 + xPct * 20;
        state.ty = 50 + yPct * 20;
        state.hover = true;
        if (!state.raf) { state.raf = requestAnimationFrame(run); }
      });

      link.addEventListener('mouseleave', function () {
        state.hover = false;
        state.tx = 50;
        state.ty = 50;
        if (!state.raf) { state.raf = requestAnimationFrame(run); }
      });
    });
  })();

  /* ------------------------------------------------------------------
     8. Marquee infinito — duplica o conteúdo para o loop não ter emenda
     ------------------------------------------------------------------ */
  $$('[data-marquee-row]').forEach(function (row) {
    row.innerHTML = row.innerHTML + row.innerHTML;
  });

  /* ------------------------------------------------------------------
     9. Formulário
        Sem back-end: monta um e-mail no cliente do usuário.
        Para receber as mensagens no servidor, troque este handler por um
        fetch() para o seu endpoint (Formspree, API própria, etc.).
     ------------------------------------------------------------------ */
  (function contactForm() {
    var form = $('[data-form]');
    if (!form) { return; }
    var status = $('[data-form-status]', form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var mail = form.elements.email.value.trim();
      var msg = form.elements.message.value.trim();

      if (!name || !mail || !msg) {
        status.textContent = 'Preencha nome, e-mail e a descrição do projeto.';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        status.textContent = 'Confira o endereço de e-mail.';
        return;
      }

      var subject = encodeURIComponent('Novo projeto — ' + name);
      var body = encodeURIComponent(msg + '\n\n—\n' + name + '\n' + mail);
      W.location.href = 'mailto:daviguedescontato17@gmail.com?subject=' + subject + '&body=' + body;
      status.textContent = 'Abrindo seu aplicativo de e-mail…';
    });
  })();

  /* ------------------------------------------------------------------
     10. Detalhes
     ------------------------------------------------------------------ */
  var year = $('[data-year]');
  if (year) { year.textContent = String(new Date().getFullYear()); }

  root.classList.add('is-ready');
})();
