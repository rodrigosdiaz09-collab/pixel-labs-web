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

// Tamaño máximo del pedido entero. El formulario más largo posible no llega
// ni a 3 KB; 16 KB deja aire de sobra. Sin esto, alguien puede mandar 10 MB
// de basura y hacernos gastar tiempo y plata en procesarla.
const MAX_CUERPO = 16 * 1024;

// De dónde se acepta que venga un envío del formulario.
const ORIGENES = [
  'https://pixellabs.com.ar',
  'https://www.pixellabs.com.ar',
];

// Cuántos envíos y cuántos intentos de clave se permiten por IP.
const TOPE = {
  lead:  { veces: 8,  minutos: 10 },   // 8 consultas cada 10 min por IP
  panel: { veces: 10, minutos: 15 },   // 10 claves erradas cada 15 min por IP
};

function json(data, status = 200, extra) {
  return conSeguridad(new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, extra || {}),
  }));
}

// Cabeceras de seguridad para TODO lo que genera este archivo.
// Ojo: el archivo `_headers` sólo se aplica a los archivos estáticos (las
// páginas, el css, las imágenes). Las respuestas que arma el worker —el
// panel y la API— no pasan por ahí, así que hay que ponérselas acá.
const SEGURIDAD = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',            // que nadie meta el panel en un iframe
  'referrer-policy': 'no-referrer',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'cache-control': 'no-store',
};

function conSeguridad(resp, extra) {
  const h = new Headers(resp.headers);
  for (const [k, v] of Object.entries(SEGURIDAD)) h.set(k, v);
  if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(resp.body, { status: resp.status, headers: h });
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
  return conSeguridad(new Response('Necesitás la clave para ver esto.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Panel Pixel Labs", charset="UTF-8"',
      'content-type': 'text/plain; charset=utf-8',
    },
  }));
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

/**
 * Deja una celda del CSV inofensiva para Excel.
 *
 * Excel y Google Sheets tratan como FÓRMULA a todo lo que arranca con
 * = + - @ (o con un tabulador). Si alguien completa el formulario poniéndose
 * de nombre  =HYPERLINK("http://sitio-falso","Actualizá tu cuenta")  o algo
 * peor, la fórmula no ataca a la web: se ejecuta en TU computadora, el día
 * que abrís el archivo de contactos.
 *
 * Poniéndole una comilla simple adelante, Excel lo muestra como texto y no
 * lo evalúa. La comilla no se ve al abrir la planilla.
 */
function neutralizar(v) {
  const s = String(v == null ? '' : v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

/**
 * Portero del panel. Devuelve una respuesta si hay que cortar, o null si
 * puede pasar. Sólo cuentan los intentos FALLIDOS: entrar bien mil veces
 * no te bloquea, errarle diez seguidas sí.
 */
async function guardiaPanel(request, env) {
  if (autorizado(request, env)) return null;

  // Sólo cuentan los pedidos que TRAJERON una clave y le erraron.
  // Un pedido sin clave es el primer paso normal de cualquier visita al
  // panel (el navegador pregunta, recién ahí mandás la clave). Si eso
  // contara, te bloquearías vos solo abriendo el panel varias veces.
  if (!request.headers.get('Authorization')) return pedirClave();

  const puede = await pasaElFreno(env, request, 'panel');
  if (!puede) {
    return conSeguridad(new Response(
      'Demasiados intentos. Esperá unos minutos.',
      { status: 429, headers: { 'content-type': 'text/plain; charset=utf-8',
                                'retry-after': String(TOPE.panel.minutos * 60) } }));
  }
  return pedirClave();
}

// ------------------------------------------------------- freno por IP
//
// Tabla chiquita de control. Se crea sola la primera vez que hace falta,
// así no hay que correr ningún comando a mano.
const SQL_FRENO = `CREATE TABLE IF NOT EXISTS frenos (
  clave  TEXT NOT NULL,
  cuando TEXT NOT NULL
)`;
const SQL_FRENO_IDX = 'CREATE INDEX IF NOT EXISTS idx_frenos ON frenos (clave, cuando)';

function ipDe(request) {
  // Cloudflare siempre pone la IP real acá y no se puede falsear desde afuera:
  // la reescribe en el borde, pisando lo que haya mandado el cliente.
  return request.headers.get('CF-Connecting-IP') || 'desconocida';
}

// No guardamos la IP en claro: es un dato personal y no lo necesitamos.
// Con el hash alcanza para contar cuántas veces vino el mismo.
async function huella(request, etiqueta) {
  const datos = new TextEncoder().encode(etiqueta + '|' + ipDe(request));
  const h = await crypto.subtle.digest('SHA-256', datos);
  return [...new Uint8Array(h)].slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Devuelve true si hay que frenar. Cuenta los intentos de esa IP en la
 * ventana de tiempo y anota el actual.
 *
 * Si la base falla por lo que sea, NO frena: prefiero dejar entrar una
 * consulta de más antes que perder la de un cliente real.
 */
async function pasaElFreno(env, request, tipo) {
  const cfg = TOPE[tipo];
  if (!env.DB || !cfg) return true;
  const clave = await huella(request, tipo);
  const desde = `datetime('now','-${cfg.minutos} minutes')`;
  try {
    const contar = () => env.DB.prepare(
      `SELECT COUNT(*) AS n FROM frenos WHERE clave = ? AND cuando > ${desde}`
    ).bind(clave).first();

    let fila;
    try {
      fila = await contar();
    } catch {
      // Primera vez: todavía no existe la tabla. La creamos y seguimos.
      await env.DB.prepare(SQL_FRENO).run();
      await env.DB.prepare(SQL_FRENO_IDX).run();
      fila = await contar();
    }

    if (fila && fila.n >= cfg.veces) return false;

    await env.DB.prepare("INSERT INTO frenos (clave, cuando) VALUES (?, datetime('now'))")
      .bind(clave).run();

    // Limpieza barata: de vez en cuando borra lo viejo para que la tabla no
    // crezca para siempre. No hace falta que sea exacto.
    if (!fila || fila.n === 0) {
      await env.DB.prepare("DELETE FROM frenos WHERE cuando < datetime('now','-1 day')").run();
    }
    return true;
  } catch (e) {
    console.error('freno', tipo, e && e.message);
    return true;
  }
}

// ¿El envío viene de nuestro propio sitio?
// Los navegadores mandan Origin en todo POST entre sitios, así que esto corta
// a cualquiera que arme un formulario en otra página apuntando al nuestro.
// Si no viene ninguno de los dos datos (navegador raro, alguna extensión),
// se deja pasar: perder una consulta real es peor que aceptar una dudosa.
function origenPropio(request) {
  // Además del dominio real, se acepta la dirección por la que entró este
  // mismo pedido. Así sigue andando en la dirección de prueba de Cloudflare
  // (…workers.dev) y en las vistas previas, sin tener que anotarlas acá.
  let propia = null;
  try { propia = new URL(request.url).origin; } catch { /* nada */ }
  const vale = (x) => x === propia || ORIGENES.includes(x);

  const o = request.headers.get('Origin');
  if (o) return vale(o);
  const r = request.headers.get('Referer');
  if (r) { try { return vale(new URL(r).origin); } catch { return false; } }
  return true;
}

// ---------------------------------------------------------------- guardar
async function guardarLead(request, env) {
  if (request.method !== 'POST') return json({ ok: false, error: 'metodo' }, 405);

  if (!origenPropio(request)) return json({ ok: false, error: 'origen' }, 403);

  const largo = Number(request.headers.get('content-length') || 0);
  if (largo > MAX_CUERPO) return json({ ok: false, error: 'muy largo' }, 413);

  if (!(await pasaElFreno(env, request, 'lead'))) {
    return json(
      { ok: false, error: 'demasiados', mensaje: 'Recibimos varias consultas tuyas recién. Probá de nuevo en unos minutos o escribinos por WhatsApp.' },
      429, { 'retry-after': String(TOPE.lead.minutos * 60) });
  }

  let body;
  try {
    const ct = request.headers.get('content-type') || '';
    // No alcanza con content-length: puede venir sin declarar. Leemos como
    // texto con un tope duro antes de intentar interpretarlo.
    const crudo = await request.text();
    if (crudo.length > MAX_CUERPO) return json({ ok: false, error: 'muy largo' }, 413);
    if (ct.includes('application/json')) {
      body = JSON.parse(crudo);
    } else if (ct.includes('multipart/form-data')) {
      body = Object.fromEntries(await new Response(crudo, { headers: { 'content-type': ct } }).formData());
    } else {
      body = Object.fromEntries(new URLSearchParams(crudo));
    }
  } catch {
    return json({ ok: false, error: 'formato' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ ok: false, error: 'formato' }, 400);
  }

  // Campo trampa: es invisible en la página, así que si viene lleno
  // lo completó un robot. Respondemos ok para que no siga probando.
  //
  // Se mira SOLO "pl_ref". Antes se llamaba "web", y ese nombre lo
  // autocompletaban los navegadores solos: se descartaban consultas de
  // personas reales sin que nadie se enterara. Si alguna vez cambiás este
  // nombre, que no se parezca a un campo de verdad (web, url, email, tel...).
  if (limpiar(body.pl_ref, 100)) return json({ ok: true, guardado: false });

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
    // El detalle va al registro de Cloudflare (Workers → Logs), no a la
    // respuesta. Antes se lo mandábamos al visitante: eso le contaba a
    // cualquiera cómo está armada la tabla, que es justo lo que necesita
    // alguien para atacarla.
    console.error('INSERT lead falló:', e && e.message || e);
    return json({ ok: false, error: 'base' }, 500);
  }

  return json({ ok: true, guardado: true });
}

// ---------------------------------------------------------------- panel
async function verPanel(request, env) {
  const paso = await guardiaPanel(request, env);
  if (paso) return paso;

  // Permiso de un solo uso para el <style> y el <script> de esta página.
  // Cambia en cada visita, así que no sirve copiarlo.
  const nonce = crypto.randomUUID().replace(/-/g, '');

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
<style nonce="${nonce}">
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
<script nonce="${nonce}">
  var q = document.getElementById('q');
  if (q) q.addEventListener('input', function () {
    var t = this.value.toLowerCase();
    document.querySelectorAll('#cuerpo tr').forEach(function (tr) {
      tr.classList.toggle('oculta', t && tr.textContent.toLowerCase().indexOf(t) < 0);
    });
  });
</script>
</body></html>`;

  return conSeguridad(new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // El panel no carga NADA de afuera: ni imágenes, ni tipografías, ni
      // scripts. Y el único bloque de código que hay lleva un permiso de un
      // solo uso (el "nonce", distinto en cada visita). Si algún día se
      // colara un <script> dentro del texto de un contacto, no tendría ese
      // permiso y el navegador no lo ejecutaría.
      'content-security-policy':
        "default-src 'none'; " +
        "style-src 'nonce-" + nonce + "'; script-src 'nonce-" + nonce + "'; " +
        "form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
    },
  }));
}

// ---------------------------------------------------------------- csv
async function exportarCsv(request, env) {
  const paso = await guardiaPanel(request, env);
  if (paso) return paso;

  const { results } = await env.DB.prepare(
    `SELECT creado, nombre, email, tipo, medida, mensaje, origen FROM leads ORDER BY id DESC`
  ).all();

  // Excel en español abre bien el punto y coma. El BOM evita que rompa los acentos.
  const celda = (v) => '"' + neutralizar(v).replace(/"/g, '""') + '"';
  const filas = [['Fecha', 'Nombre', 'Email', 'Necesita', 'Medida', 'Mensaje', 'Origen']]
    .concat((results || []).map((r) => [r.creado, r.nombre, r.email, r.tipo, r.medida, r.mensaje, r.origen]))
    .map((f) => f.map(celda).join(';')).join('\r\n');

  return conSeguridad(new Response('﻿' + filas, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="contactos-pixel-labs.csv"',
    },
  }));
}

// ---------------------------------------------------------------- ruteo
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/lead') return guardarLead(request, env);

      // El panel sólo se mira. Nada de POST, PUT ni DELETE contra él.
      if (url.pathname === '/panel' || url.pathname === '/panel/lista.csv') {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          return conSeguridad(new Response('Método no permitido', {
            status: 405, headers: { 'allow': 'GET, HEAD', 'content-type': 'text/plain; charset=utf-8' },
          }));
        }
        return url.pathname === '/panel' ? verPanel(request, env) : exportarCsv(request, env);
      }

      // El resto lo sirve el sitio estático de siempre.
      return env.ASSETS.fetch(request);
    } catch (e) {
      // Red de seguridad: si algo explota, el detalle va al registro de
      // Cloudflare, nunca a la pantalla del visitante. Un stack trace le
      // dice a un atacante qué versión y qué estructura tenemos.
      console.error('error no previsto en', url.pathname, e && e.stack || e);
      return conSeguridad(new Response('Algo falló de nuestro lado.', {
        status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' },
      }));
    }
  },
};
