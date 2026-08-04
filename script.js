// ============================================
// MENÚ MÓVIL
// ============================================
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });
  mainNav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => mainNav.classList.remove('open'))
  );
}

// Marca el link activo según la página actual
const current = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.main-nav a').forEach(a => {
  if (a.getAttribute('href') === current) a.classList.add('active');
});

// ============================================
// HERO — PARTÍCULAS "PIXEL" (elemento firma)
// Pequeños cuadrados dorados que caen y se acomodan
// en una grilla, como el destello del corte láser.
// ============================================
const canvas = document.getElementById('heroCanvas');
if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const ctx = canvas.getContext('2d');
  let w, h, particles;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }

  function initParticles() {
    const cols = 14;
    const rows = 9;
    particles = [];
    for (let i = 0; i < cols * rows; i++) {
      if (Math.random() > 0.55) continue; // grilla dispersa, no completa
      const gx = (i % cols) * (w / cols) + (w / cols) / 2;
      const gy = Math.floor(i / cols) * (h / rows) + (h / rows) / 2;
      particles.push({
        targetX: gx,
        targetY: gy,
        x: gx + (Math.random() - 0.5) * 40,
        y: -50 - Math.random() * h,
        size: 2 + Math.random() * 3,
        speed: 0.02 + Math.random() * 0.03,
        opacity: 0.15 + Math.random() * 0.35,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  let t = 0;
  function animate() {
    t += 0.02;
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += (p.targetX - p.x) * p.speed;
      p.y += (p.targetY - p.y) * p.speed;
      const twinkle = 0.6 + Math.sin(t + p.twinkleOffset) * 0.4;
      ctx.fillStyle = `rgba(201, 162, 75, ${p.opacity * twinkle})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    requestAnimationFrame(animate);
  }

  resize();
  initParticles();
  animate();
  window.addEventListener('resize', () => { resize(); initParticles(); });
}

// ============================================
// PRODUCTOS — filtro por categoría
// ============================================
const catButtons = document.querySelectorAll('.cat-tabs button');
const galleryItems = document.querySelectorAll('.gallery-item');
catButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    catButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    galleryItems.forEach(item => {
      item.style.display = (cat === 'Todos' || item.dataset.cat === cat) ? '' : 'none';
    });
  });
});

// ============================================
// FORMULARIO DE CONTACTO → WHATSAPP
// Sin backend ni costo: arma el mensaje y abre WhatsApp
// con los datos ya cargados.
// ============================================
const WHATSAPP_NUMBER = '542224642172'; // sin el +, sin espacios

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const nombre = data.get('nombre') || '';
    const email = data.get('email') || '';
    const tipo = data.get('tipo') || '';
    const mensaje = data.get('mensaje') || '';

    const texto =
      `Hola Pixel Labs! Soy ${nombre}.%0A` +
      `Tipo de proyecto: ${tipo}%0A` +
      `Mensaje: ${mensaje}%0A` +
      `Email de contacto: ${email}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${texto}`, '_blank');
  });
}
