/**
 * Resuelve el conflicto de git de los 3 archivos y cierra el merge.
 *
 * Se corre así, parado en la carpeta del sitio:
 *     node arreglar.mjs
 *
 * Qué hace:
 *   1. Comprueba que estás en la carpeta correcta.
 *   2. Copia las versiones buenas de los 3 archivos.
 *   3. Revisa que no queden marcas de conflicto en ningún archivo.
 *   4. Los marca como resueltos y cierra el merge.
 *
 * Lo que NO hace: no borra nada tuyo, no hace push y no toca ninguna otra
 * rama. El push lo hacés vos después, cuando quieras.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const c = { ok:'\x1b[32m', mal:'\x1b[31m', avi:'\x1b[33m', dato:'\x1b[36m', gris:'\x1b[90m', fin:'\x1b[0m' };
const paso = (t) => console.log(`\n${c.dato}▸ ${t}${c.fin}`);
const bien = (t) => console.log(`  ${c.ok}✓${c.fin} ${t}`);
const nota = (t) => console.log(`  ${c.gris}${t}${c.fin}`);
const error = (t) => console.log(`  ${c.mal}✗${c.fin} ${t}`);

function git(args, permitirFallo = false) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (e) {
    if (permitirFallo) return null;
    throw new Error(((e.stdout || '') + (e.stderr || '')).trim() || e.message);
  }
}

// ------------------------------------------------- 1. ¿estamos donde hay que estar?
paso('Comprobando la carpeta');

if (!existsSync('index.html') || !existsSync('style.css')) {
  error('Esta no es la carpeta del sitio.');
  nota('Tenés que correrlo donde están index.html y style.css.');
  nota('En VS Code: Terminal → Nueva terminal, y fijate que la ruta sea la del proyecto.');
  process.exit(1);
}
if (!git(['rev-parse', '--is-inside-work-tree'], true)) {
  error('Acá no hay un repositorio de git.');
  process.exit(1);
}
bien('Carpeta correcta.');

const enMerge = existsSync(join(git(['rev-parse', '--git-dir']), 'MERGE_HEAD'));
nota(enMerge ? 'Hay un merge a medio terminar (es lo esperado).'
             : 'No hay ningún merge en curso; igual dejo los archivos al día.');

// ------------------------------------------------- 2. copiar los archivos buenos
paso('Poniendo la versión correcta de los archivos');

const COPIAS = [
  ['assetsignore.txt',    '.assetsignore'],
  ['gitignore.txt',       '.gitignore'],
  ['LEEME-CONTACTOS.md',  'LEEME-CONTACTOS.md'],
  ['wrangler.jsonc',      'wrangler.jsonc'],
  ['configurar-base.mjs', 'configurar-base.mjs'],
];

const puestos = [];
for (const [origen, destino] of COPIAS) {
  const src = join(AQUI, 'archivos', origen);
  if (!existsSync(src)) { error(`Falta ${origen} en el zip.`); process.exit(1); }
  copyFileSync(src, destino);
  puestos.push(destino);
  bien(destino);
}

// ------------------------------------------------- 3. ¿quedan marcas de conflicto?
paso('Revisando que no queden marcas de conflicto');

const MARCA = /^(<{7}|={7}|>{7})/m;
const saltar = new Set(['.git', 'node_modules', 'images', '.wrangler', 'archivos']);
// Estos son los ayudantes del propio zip: hablan de las marcas de conflicto,
// así que si no los excluyo se detectan a sí mismos.
const propios = new Set(['LEEME-PRIMERO.txt', 'arreglar.mjs']);
const sospechosos = [];

(function recorrer(dir) {
  for (const n of readdirSync(dir)) {
    if (saltar.has(n)) continue;
    const p = join(dir, n);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) { recorrer(p); continue; }
    if (propios.has(n)) continue;
    if (!/\.(html|css|js|mjs|json|jsonc|md|txt|xml|sql)$/i.test(n)) continue;
    if (st.size > 3_000_000) continue;
    try { if (MARCA.test(readFileSync(p, 'utf8'))) sospechosos.push(p.replace(/^\.\//, '')); } catch {}
  }
})('.');

if (sospechosos.length) {
  error(`Todavía hay marcas de conflicto en ${sospechosos.length} archivo(s):`);
  sospechosos.forEach((f) => console.log(`      ${f}`));
  nota('Abrilos y borrá las líneas con <<<<<<<, ======= y >>>>>>>,');
  nota('dejando solo el texto que corresponde. Después volvé a correr esto.');
  process.exit(1);
}
bien('Ningún archivo quedó con marcas.');

// ------------------------------------------------- 4. resolver y cerrar
paso('Marcando los archivos como resueltos');
try {
  git(['add', ...puestos]);
  bien('Listos para comitear.');
} catch (e) { error('No se pudieron agregar.'); console.log(e.message); process.exit(1); }

const pendientes = (git(['diff', '--name-only', '--diff-filter=U'], true) || '')
  .split('\n').map((s) => s.trim()).filter(Boolean);

if (pendientes.length) {
  console.log(`\n${c.avi}Quedan otros archivos en conflicto:${c.fin}`);
  pendientes.forEach((f) => console.log(`      ${f}`));
  nota('Resolvelos en VS Code (botón "Resolve in Merge Editor") y después:');
  nota('   git add .   y luego   git commit --no-edit');
  process.exit(0);
}

paso('Cerrando el merge');
try {
  git(enMerge ? ['commit', '--no-edit'] : ['commit', '-m', 'Actualiza base de contactos y configuración']);
  bien('Merge cerrado.');
} catch (e) {
  if (/nothing to commit/i.test(e.message)) bien('No había nada nuevo que comitear.');
  else { error('No se pudo comitear.'); console.log(e.message); process.exit(1); }
}

console.log(`\n${c.ok}Conflicto resuelto.${c.fin}\n`);
console.log('Ahora, en este orden:\n');
console.log(`  ${c.dato}git push${c.fin}`);
console.log('     Sube los cambios a GitHub.\n');
console.log(`  ${c.dato}node configurar-base.mjs${c.fin}`);
console.log('     Crea la base de contactos y completa el identificador.\n');
console.log(`  ${c.dato}npx wrangler secret put PANEL_CLAVE${c.fin}`);
console.log(`  ${c.dato}npx wrangler deploy${c.fin}`);
console.log('     Contraseña del panel y publicación.\n');
