/**
 * Pixel Labs — Worker del sitio.
 *
 * Hace dos cosas:
 *   1. /api/lead        guarda una consulta en la base D1
 *   2. /panel           te muestra la lista (pide usuario y contraseña)
 *      /panel/lista.csv la baja en Excel
 *
 * Todo lo demás (las páginas, imágenes, css) lo sirve Cloudflare solo,
 * sin pasar por acá.
 */

const MAX = { nombre: 120, email: 160, tipo: 80, medida: 80, mensaje: 2000, origen: 40 };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function limpiar(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

// Validación de email a propósito simple: alcanza para descartar basura
// sin rechazar direcciones raras pero válidas.
function emailValido(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= MAX.email;
}

// Comparación que tarda lo mismo acierte o no, para que no se pueda
// adivinar la contraseña midiendo cuánto demora la respuesta.
function igualSeguro(a, b) {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let dif = 0;
  for (let i = 0; i < ea.length; i++) dif |= ea[i] ^ eb[i];
  return dif === 0;
}

function pedirClave() {
  return new Response('Necesitás la clave para ver esto.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Panel Pixel Labs", charset="UTF-8"',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

function autorizado(request, env) {
  const clave = env.PANEL_CLAVE;
  if (!clave) return false;                     // sin clave configurada, el panel queda cerrado
  const h = request.headers.get('Authorization') || '';
  if (!h.startsWith('Basic ')) return false;
  let txt;
  try { txt = atob(h.slice(6)); } catch { return false; }
  const i = txt.indexOf(':');
  return i >= 0 && igualSeguro(txt.slice(i + 1), clave);
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// ---------------------------------------------------------------- guardar
async function guardarLead(request, env) {
  if (request.method !== 'POST') return json({ ok: false, error: 'metodo' }, 405);

  let body;
  try {
    const ct = request.headers.get('content-type') || '';
    body = ct.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'formato' }, 400);
  }

  // Campo trampa: es invisible en la página, así que si viene lleno
  // lo completó un robot. Respondemos ok para que no siga probando.
  if (limpiar(body.web, 100)) return json({ ok: true, guardado: false });

  const email = limpiar(body.email, MAX.email).toLowerCase();
  if (!emailValido(email)) return json({ ok: false, error: 'email' }, 400);

  const lead = {
    nombre:  limpiar(body.nombre, MAX.nombre),
    email,
    tipo:    limpiar(body.tipo, MAX.tipo),
    medida:  limpiar(body.medida, MAX.medida),
    mensaje: limpiar(body.mensaje, MAX.mensaje),
    origen:  limpiar(body.origen, MAX.origen) || 'formulario',
  };

  if (!env.DB) return json({ ok: false, error: 'sin base' }, 500);

  try {
    await env.DB.prepare(
      `INSERT INTO leads (nombre, email, tipo, medida, mensaje, origen, creado)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(lead.nombre, lead.email, lead.tipo, lead.medida, lead.mensaje, lead.origen).run();
  } catch (e) {
    return json({ ok: false, error: 'base', detalle: String(e && e.message || e) }, 500);
  }

  return json({ ok: true, guardado: true });
}

// ---------------------------------------------------------------- panel
async function verPanel(request, env) {
  if (!autorizado(request, env)) return pedirClave();

  const { results } = await env.DB.prepare(
    `SELECT id, nombre, email, tipo, medida, mensaje, origen, creado
     FROM leads ORDER BY id DESC LIMIT 500`
  ).all();

  const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM leads').first();
  const unicos = await env.DB.prepare('SELECT COUNT(DISTINCT email) AS n FROM leads').first();

  const filas = (results || []).map((r) => `
    <tr>
      <td class="fecha">${esc(r.creado)}</td>
      <td>${esc(r.nombre) || '<span class="v">—</span>'}</td>
      <td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td>
      <td>${esc(r.tipo) || '<span class="v">—</span>'}</td>
      <td>${esc(r.medida) || '<span class="v">—</span>'}</td>
      <td class="msj">${esc(r.mensaje) || '<span class="v">—</span>'}</td>
      <td><span class="tag">${esc(r.origen)}</span></td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="es-AR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Contactos · Pixel Labs</title>
<style>
  :root { --bg:#0D0D0D; --pan:#16150F; --ln:#3A3428; --ink:#F4EFE4; --sf:#A79A82; --or:#C9A24B; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui,-apple-system,sans-serif; padding:22px; }
  h1 { font-size:1.3rem; font-weight:500; margin:0 0 4px; }
  .sub { color:var(--sf); font-size:.85rem; margin:0 0 18px; }
  .kpis { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
  .kpi { background:var(--pan); border:1px solid var(--ln); padding:12px 18px; min-width:130px; }
  .kpi b { display:block; font-size:1.7rem; color:var(--or); font-weight:500; }
  .kpi span { font-size:.7rem; letter-spacing:.14em; text-transform:uppercase; color:var(--sf); }
  .barra { margin-bottom:14px; display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  a.btn { display:inline-block; background:var(--or); color:#16120A; text-decoration:none;
          padding:9px 16px; font-weight:600; font-size:.85rem; }
  input[type=search] { background:var(--pan); border:1px solid var(--ln); color:var(--ink);
          padding:9px 12px; font-size:.9rem; min-width:230px; }
  .caja { overflow-x:auto; border:1px solid var(--ln); }
  table { border-collapse:collapse; width:100%; min-width:900px; background:var(--pan); }
  th,td { padding:9px 11px; text-align:left; border-bottom:1px solid var(--ln); vertical-align:top; font-size:.86rem; }
  th { font-size:.68rem; letter-spacing:.14em; text-transform:uppercase; color:var(--or); font-weight:500;
       position:sticky; top:0; background:#1B1A12; }
  td a { color:var(--ink); }
  .fecha { white-space:nowrap; color:var(--sf); font-variant-numeric:tabular-nums; }
  .msj { max-width:380px; }
  .v { color:#6A6152; }
  .tag { font-size:.68rem; letter-spacing:.1em; text-transform:uppercase; border:1px solid var(--ln);
         padding:2px 7px; color:var(--sf); white-space:nowrap; }
  tr.oculta { display:none; }
  .nada { padding:26px; color:var(--sf); background:var(--pan); }
</style></head><body>
<h1>Contactos</h1>
<p class="sub">Los últimos 500. Se actualiza sola cada vez que alguien completa el formulario.</p>
<div class="kpis">
  <div class="kpi"><b>${total ? total.n : 0}</b><span>Consultas</span></div>
  <div class="kpi"><b>${unicos ? unicos.n : 0}</b><span>Personas</span></div>
</div>
<div class="barra">
  <a class="btn" href="/panel/lista.csv">Descargar para Excel</a>
  <input type="search" id="q" placeholder="Buscar por nombre, mail o texto…" autocomplete="off">
</div>
${filas ? `<div class="caja"><table>
  <thead><tr><th>Fecha</th><th>Nombre</th><th>Email</th><th>Necesita</th><th>Medida</th><th>Mensaje</th><th>Origen</th></tr></thead>
  <tbody id="cuerpo">${filas}</tbody></table></div>`
        : `<p class="nada">Todavía no entró ninguna consulta. Cuando alguien complete el formulario del sitio, aparece acá.</p>`}
<script>
  var q = document.getElementById('q');
  if (q) q.addEventListener('input', function () {
    var t = this.value.toLowerCase();
    document.querySelectorAll('#cuerpo tr').forEach(function (tr) {
      tr.classList.toggle('oculta', t && tr.textContent.toLowerCase().indexOf(t) < 0);
    });
  });
</script>
</body></html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store',
               'x-robots-tag': 'noindex, nofollow' },
  });
}

// ---------------------------------------------------------------- csv
async function exportarCsv(request, env) {
  if (!autorizado(request, env)) return pedirClave();

  const { results } = await env.DB.prepare(
    `SELECT creado, nombre, email, tipo, medida, mensaje, origen FROM leads ORDER BY id DESC`
  ).all();

  // Excel en español abre bien el punto y coma. El BOM evita que rompa los acentos.
  const celda = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const filas = [['Fecha', 'Nombre', 'Email', 'Necesita', 'Medida', 'Mensaje', 'Origen']]
    .concat((results || []).map((r) => [r.creado, r.nombre, r.email, r.tipo, r.medida, r.mensaje, r.origen]))
    .map((f) => f.map(celda).join(';')).join('\r\n');

  return new Response('﻿' + filas, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="contactos-pixel-labs.csv"',
      'cache-control': 'no-store',
    },
  });
}

// ---------------------------------------------------------------- ruteo
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/lead')       return guardarLead(request, env);
    if (url.pathname === '/panel')          return verPanel(request, env);
    if (url.pathname === '/panel/lista.csv') return exportarCsv(request, env);

    // El resto lo sirve el sitio estático de siempre.
    return env.ASSETS.fetch(request);
  },
};
