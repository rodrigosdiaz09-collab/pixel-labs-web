/**
 * Configura la base de contactos de una sola vez.
 *
 * Se corre así, parado en la carpeta del sitio:
 *     node configurar-base.mjs
 *
 * Hace todo esto solo:
 *   1. Busca la base "pixel-labs-leads". Si no existe, la crea.
 *   2. Escribe el identificador en wrangler.jsonc (respetando los comentarios).
 *   3. Crea la tabla.
 *
 * Se puede correr las veces que quieras: si ya está hecho, no rompe nada.
 * Lo único que NO hace es poner la contraseña del panel ni publicar,
 * porque esos dos te los tiene que pedir a vos. Te los dice al final.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';

const NOMBRE_BASE = 'pixel-labs-leads';
const CONFIG = 'wrangler.jsonc';

const c = { ok: '\x1b[32m', mal: '\x1b[31m', dato: '\x1b[36m', gris: '\x1b[90m', fin: '\x1b[0m' };
const paso = (t) => console.log(`\n${c.dato}▸ ${t}${c.fin}`);
const bien = (t) => console.log(`  ${c.ok}✓${c.fin} ${t}`);
const nota = (t) => console.log(`  ${c.gris}${t}${c.fin}`);

function correr(args, { silencioso = false } = {}) {
  try {
    return execFileSync('npx', ['wrangler', ...args], {
      encoding: 'utf8', stdio: silencioso ? 'pipe' : ['inherit', 'pipe', 'pipe'], shell: process.platform === 'win32',
    });
  } catch (e) {
    const salida = (e.stdout || '') + (e.stderr || '');
    const err = new Error(salida || e.message);
    err.salida = salida;
    throw err;
  }
}

if (!existsSync(CONFIG)) {
  console.error(`\n${c.mal}No encuentro ${CONFIG}.${c.fin}`);
  console.error('Tenés que correr esto parado en la carpeta del sitio (la que tiene index.html).\n');
  process.exit(1);
}

// ---------------------------------------------------------------- 1. la base
paso('Buscando la base de datos');
let id = null;
try {
  const lista = JSON.parse(correr(['d1', 'list', '--json'], { silencioso: true }));
  const encontrada = (Array.isArray(lista) ? lista : []).find((d) => d.name === NOMBRE_BASE);
  if (encontrada) {
    id = encontrada.uuid || encontrada.database_id || encontrada.id;
    bien(`Ya existe. Identificador: ${id}`);
  }
} catch (e) {
  if (/not logged in|authentication|credentials|login/i.test(e.message)) {
    console.error(`\n${c.mal}No estás conectado a Cloudflare.${c.fin}`);
    console.error('Corré primero:  npx wrangler login\n');
    process.exit(1);
  }
  nota('No pude leer la lista, pruebo creándola.');
}

if (!id) {
  paso(`Creando la base "${NOMBRE_BASE}"`);
  let salida = '';
  try {
    salida = correr(['d1', 'create', NOMBRE_BASE], { silencioso: true });
  } catch (e) {
    salida = e.salida || '';
    if (!/already exists/i.test(salida)) {
      console.error(`\n${c.mal}No se pudo crear la base.${c.fin}\n${salida}\n`);
      process.exit(1);
    }
  }
  // el id aparece como database_id = "..." o "database_id": "..."
  const m = salida.match(/database_id\s*[:=]\s*"([0-9a-f-]{36})"/i)
        || salida.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (m) { id = m[1]; bien(`Creada. Identificador: ${id}`); }
}

if (!id) {
  console.error(`\n${c.mal}No pude averiguar el identificador de la base.${c.fin}`);
  console.error('Corré a mano:  npx wrangler d1 list');
  console.error(`y pegá el id en ${CONFIG}, en la línea "database_id".\n`);
  process.exit(1);
}

// ---------------------------------------------------------------- 2. config
paso(`Activando la base en ${CONFIG}`);
const original = readFileSync(CONFIG, 'utf8');
let actualizado = original;

const yaActiva = /^\s*"d1_databases"\s*:/m.test(original);

if (yaActiva) {
  // Ya estaba activa: solo se actualiza el identificador.
  actualizado = original.replace(
    /("database_id"\s*:\s*")([^"]*)(")/,
    (_, a, viejo, b) => {
      if (viejo === id) nota('Ya estaba puesta y con el id correcto.');
      else nota(`El identificador anterior era: ${viejo || '(vacío)'}`);
      return a + id + b;
    }
  );
} else {
  // Está comentada: se reemplaza el bloque entero por la versión activa.
  const BLOQUE = `  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "${NOMBRE_BASE}",
      "database_id": "${id}"
    }
  ],`;

  // ¿Queda algo antes o después? De eso depende dónde va la coma, así que
  // se prueban las dos formas y se usa la que resulte en un archivo válido.
  const legible = (txt) => {
    try {
      const limpio = txt.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      return !!JSON.parse(limpio).d1_databases;
    } catch { return false; }
  };

  const comentado = /^[ \t]*\/\/[ \t]*"d1_databases"[\s\S]*?^[ \t]*\/\/[ \t]*\][ \t]*$/m;
  let listo = false;

  if (comentado.test(original)) {
    for (const variante of [BLOQUE, BLOQUE.replace(/,$/, '')]) {
      const intento = original.replace(comentado, variante);
      if (legible(intento)) { actualizado = intento; listo = true; break; }
    }
    if (listo) nota('Estaba desactivada; la activé.');
  }

  if (!listo) {
    // Plan B: insertarlo justo antes de la llave final.
    const i = original.lastIndexOf('}');
    if (i >= 0) {
      const antes = original.slice(0, i).replace(/\s*$/, '');
      const coma = antes.endsWith(',') ? '' : ',';
      const intento = antes + coma + '\n\n' + BLOQUE.replace(/,$/, '') + '\n}\n';
      if (legible(intento)) { actualizado = intento; listo = true; nota('La agregué al final del archivo.'); }
    }
  }

  if (!listo) {
    console.error(`\n${c.mal}No pude activar la base automáticamente.${c.fin}`);
    console.error(`Agregá esto a mano en ${CONFIG}, adentro de la llave principal:\n`);
    console.error(`${BLOQUE}\n`);
    process.exit(1);
  }
}

// Antes de guardar, comprobamos que siga siendo un archivo legible.
try {
  const limpio = actualizado.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const cfg = JSON.parse(limpio);
  if (!cfg.d1_databases?.[0]?.database_id) throw new Error('quedó sin identificador');
  if (cfg.d1_databases[0].database_id !== id) throw new Error('el identificador no coincide');
} catch (e) {
  console.error(`\n${c.mal}El archivo habría quedado mal (${e.message}). No lo toqué.${c.fin}`);
  console.error(`Agregá esto a mano en ${CONFIG}, antes de la última llave:\n`);
  console.error(`  "d1_databases": [{ "binding": "DB", "database_name": "${NOMBRE_BASE}", "database_id": "${id}" }]\n`);
  process.exit(1);
}

if (actualizado !== original) {
  copyFileSync(CONFIG, CONFIG + '.respaldo');
  writeFileSync(CONFIG, actualizado);
  bien(`Guardado y verificado. (Copia del anterior en ${CONFIG}.respaldo)`);
} else {
  bien('Sin cambios.');
}

// ---------------------------------------------------------------- 3. tabla
paso('Creando la tabla de contactos');
try {
  correr(['d1', 'execute', NOMBRE_BASE, '--remote', '--file=worker/schema.sql', '-y'], { silencioso: true });
  bien('Tabla lista.');
} catch (e) {
  if (/already exists/i.test(e.message)) bien('La tabla ya existía.');
  else {
    console.error(`\n${c.mal}No se pudo crear la tabla.${c.fin}\n${e.message}`);
    console.error('Probá a mano:  npx wrangler d1 execute pixel-labs-leads --remote --file=worker/schema.sql\n');
    process.exit(1);
  }
}

// ---------------------------------------------------------------- final
console.log(`\n${c.ok}Base configurada.${c.fin}\n`);
console.log('Ahora subilo, que es lo que publica el sitio:\n');
console.log(`  ${c.dato}git add wrangler.jsonc${c.fin}`);
console.log(`  ${c.dato}git commit -m "Conecta la base de contactos"${c.fin}`);
console.log(`  ${c.dato}git push${c.fin}`);
console.log('     Cloudflare arranca el build solo. Miralo en Workers & Pages → Builds.\n');
console.log(`Cuando el build salga en verde, poné la contraseña del panel:\n`);
console.log(`  ${c.dato}npx wrangler secret put PANEL_CLAVE${c.fin}`);
console.log('     No se ve mientras la escribís: es normal.\n');
console.log(`Y listo: ${c.dato}https://pixellabs.com.ar/panel${c.fin} — usuario: cualquiera.\n`);
