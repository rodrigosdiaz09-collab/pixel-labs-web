/* =============================================================
   PIXEL LABS — COMPORTAMIENTO
   Todo vanilla, sin librerías. Los efectos pesados se apagan
   solos en celular y con "reducir movimiento" activado.
   ============================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  // ---------------------------------------------------------
  // CONFIGURACIÓN — lo que vas a querer tocar está todo acá
  // ---------------------------------------------------------
  var CONFIG = {
    whatsapp: '542224642172'
  };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // ---------------------------------------------------------
  // PRELOADER — se va apenas carga, y como máximo en 1,2 s
  // ---------------------------------------------------------
  var boot = $('.boot');
  if (boot) {
    var closeBoot = function () { boot.classList.add('is-done'); };
    window.addEventListener('load', function () { setTimeout(closeBoot, 200); });
    setTimeout(closeBoot, 1200);
  }

  // ---------------------------------------------------------
  // BARRA DE ANUNCIO
  // ---------------------------------------------------------
  var announceClose = $('.announce-close');
  if (announceClose) {
    announceClose.addEventListener('click', function () {
      document.body.classList.add('announce-off');
    });
  }

  // ---------------------------------------------------------
  // HEADER compacto + barra de progreso + botón flotante
  // ---------------------------------------------------------
  var header = $('.site-header');
  var progress = $('.scan-progress');
  var fab = $('.fab');
  function onScroll() {
    var y = window.pageYOffset;
    if (header) header.classList.toggle('is-stuck', y > 40);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
    if (fab) fab.classList.toggle('is-in', y > 300);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------
  // MENÚ MÓVIL
  // ---------------------------------------------------------
  var navToggle = $('#navToggle');
  var mainNav = $('#mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var open = mainNav.classList.toggle('open');
      document.body.classList.toggle('is-locked', open);
      navToggle.textContent = open ? '✕' : '☰';
      navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    $$('a', mainNav).forEach(function (a) {
      a.addEventListener('click', function () {
        mainNav.classList.remove('open');
        document.body.classList.remove('is-locked');
        navToggle.textContent = '☰';
      });
    });
  }

  var current = window.location.pathname.split('/').pop() || 'index.html';
  $$('.main-nav a').forEach(function (a) {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });

  // ---------------------------------------------------------
  // TEXTO GRABADO — parte el título en letras
  // ---------------------------------------------------------
  $$('[data-engrave]').forEach(function (el) {
    if (el.dataset.engraved) return;
    el.dataset.engraved = '1';
    function walk(node, box) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          // Agrupamos por palabra: si soltamos letra por letra, el navegador
          // corta el renglón en cualquier letra y parte las palabras al medio.
          // Los espacios van como texto suelto (en un inline-block se colapsan).
          n.nodeValue.split(/(\s+)/).forEach(function (token) {
            if (token === '') return;
            if (/^\s+$/.test(token)) { box.appendChild(document.createTextNode(' ')); return; }
            var word = document.createElement('span');
            word.className = 'w';
            token.split('').forEach(function (c) {
              var s = document.createElement('span');
              s.className = 'ch';
              s.textContent = c;
              word.appendChild(s);
            });
            box.appendChild(word);
          });
        } else if (n.nodeType === 1) {
          var clone = n.cloneNode(false);
          box.appendChild(clone);
          walk(n, clone);
        }
      });
    }
    var frag = document.createElement('span');
    frag.className = 'engrave';
    walk(el, frag);
    el.innerHTML = '';
    el.appendChild(frag);
    $$('.ch', frag).forEach(function (s, i) { s.style.setProperty('--i', i); });
  });

  // ---------------------------------------------------------
  // REVELADOS AL SCROLL + grabado + contadores
  // ---------------------------------------------------------
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target.toLocaleString('es-AR') + suffix; return; }
    var dur = 1400, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('es-AR') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.hasAttribute('data-reveal')) el.classList.add('is-in');
        var eng = el.classList.contains('engrave') ? el : $('.engrave', el);
        if (eng) eng.classList.add('is-on');
        if (el.hasAttribute('data-count')) countUp(el);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('[data-reveal], [data-engrave], [data-count]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    $$('.engrave').forEach(function (el) { el.classList.add('is-on'); });
    $$('[data-count]').forEach(countUp);
  }

  // ---------------------------------------------------------
  // CURSOR LÁSER (solo mouse)
  // ---------------------------------------------------------
  if (fine && !reduce) {
    var dot = $('.cursor-dot'), ring = $('.cursor-ring');
    if (dot && ring) {
      var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
      document.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        document.body.classList.add('cursor-on');
        dot.style.transform = 'translate(' + (mx - 3) + 'px,' + (my - 3) + 'px)';
      });
      document.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-on'); });
      (function loop() {
        rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
        ring.style.transform = 'translate(' + (rx - 17) + 'px,' + (ry - 17) + 'px)';
        requestAnimationFrame(loop);
      })();
      var hot = 'a, button, input, select, textarea, .gallery-item, .faq-q';
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest(hot)) document.body.classList.add('cursor-hot');
      });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest && e.target.closest(hot)) document.body.classList.remove('cursor-hot');
      });
    }
  }

  // ---------------------------------------------------------
  // TILT 3D + BRILLO EN EL CATÁLOGO (solo mouse)
  // ---------------------------------------------------------
  if (fine && !reduce) {
    $$('.gallery-item').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((px - 0.5) * 11).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 11).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    // Botones magnéticos
    $$('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.15;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.2;
        b.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  // ---------------------------------------------------------
  // HERO — partículas que se acomodan en grilla, como el corte
  // ---------------------------------------------------------
  var canvas = $('#heroCanvas');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var w, h, parts, running = true, t = 0;
    var dense = window.innerWidth > 900;

    function resize() { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; }
    function init() {
      var cols = dense ? 16 : 9, rows = dense ? 10 : 7;
      parts = [];
      for (var i = 0; i < cols * rows; i++) {
        if (Math.random() > 0.5) continue;
        var gx = (i % cols) * (w / cols) + (w / cols) / 2;
        var gy = Math.floor(i / cols) * (h / rows) + (h / rows) / 2;
        parts.push({
          tx: gx, ty: gy,
          x: gx + (Math.random() - 0.5) * 60,
          y: -60 - Math.random() * h,
          size: 2 + Math.random() * 3,
          speed: 0.018 + Math.random() * 0.03,
          op: 0.15 + Math.random() * 0.38,
          off: Math.random() * Math.PI * 2
        });
      }
    }
    function frame() {
      if (!running) return;
      t += 0.02;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += (p.tx - p.x) * p.speed;
        p.y += (p.ty - p.y) * p.speed;
        var tw = 0.6 + Math.sin(t + p.off) * 0.4;
        ctx.fillStyle = 'rgba(201, 162, 75, ' + (p.op * tw) + ')';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      requestAnimationFrame(frame);
    }
    resize(); init(); frame();
    window.addEventListener('resize', function () { resize(); init(); });
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) frame();
    });
  }

  // ---------------------------------------------------------
  // FAQ — acordeón
  // ---------------------------------------------------------
  $$('.faq-q').forEach(function (q) {
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', function () {
      var item = q.parentElement;
      var panel = $('.faq-a', item);
      var open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    });
  });

  // ---------------------------------------------------------
  // MEDICIÓN — cada clic a WhatsApp cuenta como conversión.
  // Se dispara solo cuando instales GA4 y/o el Píxel de Meta.
  // ---------------------------------------------------------
  function track(name, params) {
    if (window.gtag) window.gtag('event', name, params || {});
    if (window.fbq && name === 'contacto_whatsapp') window.fbq('track', 'Lead', params || {});
  }

  // ---------------------------------------------------------
  // PRODUCTOS — filtro por categoría
  // ---------------------------------------------------------
  var catButtons = $$('.cat-tabs button');
  var catSections = $$('[data-section]');
  catButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      catButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var cat = btn.dataset.cat;
      catSections.forEach(function (s) {
        s.style.display = (cat === 'Todos' || s.dataset.section === cat) ? '' : 'none';
      });
      track('filtrar_categoria', { categoria: cat });
    });
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (!a) return;
    track('contacto_whatsapp', {
      origen: document.title,
      destino: (a.textContent || '').trim().slice(0, 60) || 'boton'
    });
  });

  // ---------------------------------------------------------
  // FORMULARIO DE CONTACTO → WHATSAPP
  // ---------------------------------------------------------
  var contactForm = $('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(contactForm);
      var texto =
        '¡Hola Pixel Labs! Soy ' + (d.get('nombre') || '') + '.\n' +
        'Tipo de proyecto: ' + (d.get('tipo') || '') + '\n' +
        'Medida aproximada: ' + (d.get('medida') || 'a definir') + '\n' +
        'Mensaje: ' + (d.get('mensaje') || '') + '\n' +
        'Mi email: ' + (d.get('email') || '');
      track('contacto_whatsapp', { origen: 'formulario', destino: d.get('tipo') || '' });
      window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto), '_blank');
    });
  }

  // ---------------------------------------------------------
  // TRANSICIÓN ENTRE PÁGINAS
  // ---------------------------------------------------------
  var wipe = $('.wipe');
  if (wipe && !reduce) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (!/\.html$/.test(href) || /^https?:/i.test(href)) return;
      if (href.split('/').pop() === current) return;
      e.preventDefault();
      wipe.classList.add('is-on');
      setTimeout(function () { window.location.href = href; }, 380);
    });
    window.addEventListener('pageshow', function () { wipe.classList.remove('is-on'); });
  }
})();
