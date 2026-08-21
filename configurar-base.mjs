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
paso(`Escribiendo el identificador en ${CONFIG}`);
const original = readFileSync(CONFIG, 'utf8');

// Se reemplaza solo el valor, con lo cual los comentarios del archivo quedan igual.
const actualizado = original.replace(
  /("database_id"\s*:\s*")([^"]*)(")/,
  (_, a, viejo, b) => {
    if (viejo === id) nota('Ya estaba puesto, lo dejo como está.');
    else nota(`Antes decía: ${viejo || '(vacío)'}`);
    return a + id + b;
  }
);

if (actualizado === original && !original.includes(id)) {
  console.error(`\n${c.mal}No encontré la línea "database_id" en ${CONFIG}.${c.fin}`);
  console.error(`Agregá esto a mano dentro de d1_databases:  "database_id": "${id}"\n`);
  process.exit(1);
}

if (actualizado !== original) {
  copyFileSync(CONFIG, CONFIG + '.respaldo');
  writeFileSync(CONFIG, actualizado);
  bien(`Guardado. (Copia del anterior en ${CONFIG}.respaldo)`);
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
console.log('Te faltan dos comandos, y estos te los tiene que pedir a vos:\n');
console.log(`  ${c.dato}npx wrangler secret put PANEL_CLAVE${c.fin}`);
console.log('     La contraseña para entrar al panel. No se ve mientras la escribís: es normal.\n');
console.log(`  ${c.dato}npx wrangler deploy${c.fin}`);
console.log('     Publica el sitio.\n');
console.log(`Después entrá a ${c.dato}https://pixellabs.com.ar/panel${c.fin} — usuario: cualquiera, contraseña: la que pusiste.\n`);
