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
  // CUENTA REGRESIVA (barra de anuncio)
  // ---------------------------------------------------------
  $$('.count-down').forEach(function (el) {
    var end = new Date(el.getAttribute('data-deadline')).getTime();
    if (isNaN(end)) return;
    function tick() {
      var d = Math.ceil((end - Date.now()) / 86400000);
      if (d > 1) el.textContent = '· faltan ' + d + ' días';
      else if (d === 1) el.textContent = '· último día';
      else { el.textContent = ''; }
    }
    tick();
    setInterval(tick, 3600000);
  });

  // ---------------------------------------------------------
  // PARALLAX DEL PLANO DE FONDO
  // ---------------------------------------------------------
  var bp = $('.blueprint svg');
  if (bp && !reduce && fine) {
    var bpY = 0, bpT = 0;
    window.addEventListener('scroll', function () {
      bpY = window.pageYOffset * 0.055;
    }, { passive: true });
    (function bpLoop() {
      bpT += (bpY - bpT) * 0.08;
      bp.style.transform = 'translate3d(0,' + (-bpT).toFixed(1) + 'px,0)';
      requestAnimationFrame(bpLoop);
    })();
  }

  // ---------------------------------------------------------
  // BUSCADOR DEL CATÁLOGO
  // ---------------------------------------------------------
  var finder = $('#finder');
  if (finder) {
    var allItems = $$('.gallery-item[data-name]');
    var counter = $('#finderCount');
    var noRes = $('#noResults');
    var clearBtn = $('.finder-clear');

    // saca acentos: "mandala" tiene que encontrar "Mándala"
    function norm(t) {
      return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    allItems.forEach(function (el) {
      el._hay = norm(el.dataset.name + ' ' + el.dataset.catname + ' ' + el.dataset.alt);
    });

    var filtrar = function () {
      var q = norm(finder.value.trim());
      var visibles = 0;
      allItems.forEach(function (el) {
        var ok = !q || el._hay.indexOf(q) > -1;
        el.classList.toggle('is-hidden', !ok);
        if (ok) { visibles++; el.classList.add('is-in'); }
      });
      // esconde las secciones que quedaron sin piezas
      $$('[data-section]').forEach(function (sec) {
        var items = $$('.gallery-item', sec);
        if (!items.length) { sec.style.display = q ? 'none' : ''; return; }
        sec.style.display = items.some(function (i) { return !i.classList.contains('is-hidden'); }) ? '' : 'none';
      });
      if (counter) counter.textContent = visibles + (visibles === 1 ? ' pieza' : ' piezas');
      if (noRes) noRes.classList.toggle('on', visibles === 0);
      if (clearBtn) clearBtn.classList.toggle('on', !!q);
      if (q) {
        catButtons.forEach(function (b) { b.classList.remove('active'); });
        if (catButtons[0]) catButtons[0].classList.add('active');
      }
    };

    var deb;
    finder.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(filtrar, 120); });
    if (clearBtn) clearBtn.addEventListener('click', function () { finder.value = ''; filtrar(); finder.focus(); });
    if (counter) counter.textContent = allItems.length + ' piezas';
  }

  // ---------------------------------------------------------
  // LIGHTBOX
  // ---------------------------------------------------------
  var lb = $('#lightbox');
  if (lb) {
    var lbImg = $('#lbImg'), lbTitle = $('#lbTitle'), lbCat = $('#lbCat'),
        lbDesc = $('#lbDesc'), lbWa = $('#lbWa'), lbPick = $('#lbPick'), lbShare = $('#lbShare');
    var visibles = [], idx = 0, lastFocus = null;

    function abrir(card) {
      visibles = $$('.gallery-item[data-name]').filter(function (el) {
        return !el.classList.contains('is-hidden') && el.offsetParent !== null;
      });
      idx = visibles.indexOf(card);
      if (idx < 0) { visibles = [card]; idx = 0; }
      pintar();
      lastFocus = document.activeElement;
      lb.classList.add('on');
      document.body.classList.add('is-locked');
      $('.lb-close').focus();
      track('ver_pieza', { pieza: card.dataset.name });
    }
    function pintar() {
      var c = visibles[idx];
      var img = $('img', c);
      lbImg.src = img.getAttribute('src');
      lbImg.alt = c.dataset.alt || c.dataset.name;
      lbTitle.textContent = c.dataset.name;
      var todas = $$('.gallery-item[data-name]');
      var n = todas.indexOf(c) + 1;
      lbCat.textContent = (c.dataset.catname || 'Catálogo') +
        '  ·  N.º de corte ' + String(n).padStart(3, '0') + '/' + String(todas.length).padStart(3, '0');
      lbDesc.textContent = 'Se hace a medida: elegís tamaño, material y terminación. Contanos cuál querés y te pasamos el precio exacto.';
      lbWa.href = c.dataset.wa;
      lb._card = c;
      sincroPick();
    }
    function cerrar() {
      lb.classList.remove('on');
      document.body.classList.remove('is-locked');
      if (lastFocus) lastFocus.focus();
    }
    function mover(n) { if (!visibles.length) return; idx = (idx + n + visibles.length) % visibles.length; pintar(); }

    document.addEventListener('click', function (e) {
      var card = e.target.closest && e.target.closest('.gallery-item[data-name]');
      if (!card) return;
      if (e.target.closest('a') || e.target.closest('.pick')) return;   // links y el + hacen lo suyo
      e.preventDefault();
      abrir(card);
    });
    $('.lb-close').addEventListener('click', cerrar);
    $('.lb-prev').addEventListener('click', function () { mover(-1); });
    $('.lb-next').addEventListener('click', function () { mover(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) cerrar(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowLeft') mover(-1);
      if (e.key === 'ArrowRight') mover(1);
    });
    // deslizar en celular
    var tx = 0;
    lb.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 55) mover(dx < 0 ? 1 : -1);
    }, { passive: true });

    if (navigator.share && lbShare) {
      lbShare.hidden = false;
      lbShare.addEventListener('click', function () {
        navigator.share({ title: 'Pixel Labs — ' + lbTitle.textContent, url: location.href }).catch(function () {});
      });
    }
  }

  // ---------------------------------------------------------
  // MI SELECCIÓN — varias piezas en un solo mensaje de WhatsApp
  // ---------------------------------------------------------
  var tray = $('#tray');
  if (tray) {
    var elegidas = [];
    var trayN = $('#trayN'), trayTitle = $('#trayTitle'), trayGo = $('#trayGo');

    function refrescar() {
      trayN.textContent = elegidas.length;
      trayTitle.textContent = elegidas.length === 1 ? 'pieza elegida' : 'piezas elegidas';
      tray.classList.toggle('on', elegidas.length > 0);
      var msg = '¡Hola Pixel Labs! Me interesan estas piezas del catálogo:\n\n' +
        elegidas.map(function (n, i) { return (i + 1) + '. ' + n; }).join('\n') +
        '\n\n¿Me pasan precio y plazo?';
      trayGo.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
      $$('.gallery-item[data-name]').forEach(function (c) {
        var on = elegidas.indexOf(c.dataset.name) > -1;
        var b = $('.pick', c);
        if (b) { b.classList.toggle('on', on); b.textContent = on ? '✓' : '+'; }
      });
      sincroPick();
    }
    function alternar(nombre) {
      var i = elegidas.indexOf(nombre);
      if (i > -1) elegidas.splice(i, 1); else elegidas.push(nombre);
      refrescar();
    }
    window.sincroPick = function () {};
    if (lb) {
      window.sincroPick = function () {
        if (!lb._card || !lbPick) return;
        var on = elegidas.indexOf(lb._card.dataset.name) > -1;
        lbPick.textContent = on ? 'Quitar de mi selección' : 'Agregar a mi selección';
      };
      lbPick.addEventListener('click', function () { alternar(lb._card.dataset.name); });
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.pick');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      alternar(b.closest('.gallery-item').dataset.name);
    });
    $('#trayClear').addEventListener('click', function () { elegidas = []; refrescar(); });
    trayGo.addEventListener('click', function () {
      track('contacto_whatsapp', { origen: 'seleccion multiple', destino: elegidas.length + ' piezas' });
    });
  }
  if (!window.sincroPick) window.sincroPick = function () {};


  // ---------------------------------------------------------
  // EL PROBADOR — la pieza sobre tu pared, a escala real
  //
  // Cómo se calcula: la escena mide un ancho conocido en cm
  // (300 en la pared de ejemplo, o el que indiques para tu foto).
  // El lado más largo de la pieza se lleva a ese mismo mundo:
  //     ancho en píxeles = (cm de la pieza / cm de la pared) x ancho del cuadro
  // Por eso cambiar de 25 a 50 cm duplica exacto lo que ves.
  // ---------------------------------------------------------
  var stage = $('#tryStage');
  if (stage) {
    var PIEZAS = [
      { f: 'fases-lunares',  n: 'Fases Lunares',              r: 720 / 331 },
      { f: 'luna-mandala',   n: 'Luna Mandala',               r: 720 / 719 },
      { f: 'flor-colibries', n: 'Flor Mandala con Colibríes', r: 720 / 274 },
      { f: 'buda',           n: 'Buda con árbol de la vida',  r: 720 / 513 },
      { f: 'charly',         n: 'Charly García',              r: 443 / 720 },
      { f: 'cruz',           n: 'Cruz con rostro',            r: 536 / 720 },
      { f: 'vive-ama-suena', n: 'Vive, Ama, Sueña',           r: 693 / 720 },
      { f: 'nails',          n: 'Nails',                      r: 523 / 701 }
    ];

    var piece = $('#tryPiece'), pieceImg = $('#tryPieceImg'), scene = $('#tryScene');
    var thumbs = $('#tryThumbs'), waBtn = $('#tryWa');
    var actual = 0, cm = 38, paredCm = 300;
    var pos = { x: 50, y: 40 };   // en % de la escena

    thumbs.innerHTML = PIEZAS.map(function (p, i) {
      return '<button class="tryon-thumb' + (i === 0 ? ' on' : '') + '" type="button" data-i="' + i + '" ' +
             'aria-label="' + p.n + '"><img src="images/probador/' + p.f + '.png" alt="" loading="lazy"></button>';
    }).join('');

    function pintar() {
      var p = PIEZAS[actual];
      // el lado más largo es el que mide "cm"
      var anchoCm = p.r >= 1 ? cm : cm * p.r;
      var pct = (anchoCm / paredCm) * 100;
      piece.style.width = Math.min(pct, 96) + '%';
      piece.style.left = pos.x + '%';
      piece.style.top = pos.y + '%';
      piece.dataset.size = p.r >= 1
        ? Math.round(anchoCm) + ' × ' + Math.round(anchoCm / p.r) + ' cm'
        : Math.round(anchoCm) + ' × ' + Math.round(cm) + ' cm';
      pieceImg.src = 'images/probador/' + p.f + '.png';
      pieceImg.alt = p.n + ' sobre la pared';
      waBtn.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(
        '¡Hola Pixel Labs! Probé "' + p.n + '" en el probador de la web, en ' +
        piece.dataset.size + '. ¿Me pasan precio y plazo?');
    }

    thumbs.addEventListener('click', function (e) {
      var b = e.target.closest('.tryon-thumb');
      if (!b) return;
      $$('.tryon-thumb', thumbs).forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      actual = +b.dataset.i;
      pintar();
      track('probador_pieza', { pieza: PIEZAS[actual].n });
    });

    $('#trySizes').addEventListener('click', function (e) {
      var b = e.target.closest('.tryon-size');
      if (!b) return;
      $$('.tryon-size', $('#trySizes')).forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      cm = +b.dataset.cm;
      pintar();
      track('probador_medida', { medida: cm });
    });

    // pared de ejemplo / tu foto
    var fileInput = $('#tryFile'), wallW = $('#tryWallW');
    $('#tryUpload').addEventListener('click', function () { fileInput.click(); });
    $('#tryDemo').addEventListener('click', function () {
      stage.classList.remove('has-photo');
      $('#tryDemo').classList.add('on'); $('#tryUpload').classList.remove('on');
      wallW.classList.remove('on');
      paredCm = 300; pintar();
    });
    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      var url = URL.createObjectURL(f);     // se queda en el navegador, no se sube a ningún lado
      $('#tryPhoto').src = url;
      stage.classList.add('has-photo');
      $('#tryUpload').classList.add('on'); $('#tryDemo').classList.remove('on');
      wallW.classList.add('on');
      paredCm = +$('#tryW').value;
      pintar();
      track('probador_foto', {});
    });
    $('#tryW').addEventListener('input', function () {
      paredCm = +this.value;
      $('#tryWOut').textContent = paredCm + ' cm';
      pintar();
    });

    // arrastrar
    var drag = false;
    function xy(e) { return e.touches ? e.touches[0] : e; }
    function mover(e) {
      if (!drag) return;
      var r = stage.getBoundingClientRect(), p = xy(e);
      pos.x = Math.max(4, Math.min(96, ((p.clientX - r.left) / r.width) * 100));
      pos.y = Math.max(6, Math.min(94, ((p.clientY - r.top) / r.height) * 100));
      piece.style.left = pos.x + '%';
      piece.style.top = pos.y + '%';
      if (e.cancelable) e.preventDefault();
    }
    stage.addEventListener('pointerdown', function (e) {
      drag = true; stage.classList.add('is-drag');
      stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
      mover(e);
    });
    stage.addEventListener('pointermove', mover);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      stage.addEventListener(ev, function () { drag = false; stage.classList.remove('is-drag'); });
    });

    pintar();
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
