/** Vista previa local, sin instalar dependencias ni conectarse a la base. */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const carpeta = path.dirname(fileURLToPath(import.meta.url));
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };

export function iniciarVistaPrevia({ port = 4173, root = carpeta, review = false } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/panel')) {
        res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ guardado: false, mensaje: 'Estás en una vista previa local. Las consultas se guardan únicamente en el sitio publicado.' }));
        return;
      }
      if (review && url.pathname === '/__revision') {
        const width = Math.max(320, Math.min(1440, Number(url.searchParams.get('ancho')) || 390));
        const pagina = url.searchParams.get('pagina') || '/';
        const safe = pagina.startsWith('/') && !pagina.startsWith('//') ? pagina : '/';
        const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Revisión adaptable</title><style>body{margin:0;background:#242424;color:#eee;font:14px system-ui}p{margin:10px 18px}iframe{display:block;border:0;margin:0 auto;background:#111;height:840px;max-width:100%}</style><p>Vista de ${width} px</p><iframe title="Pixel Labs" id="sitio" style="width:${width}px" src="${escape(safe)}"></iframe></html>`);
        return;
      }
      let ruta = decodeURIComponent(url.pathname);
      if (ruta === '/') ruta = '/index.html';
      if (!path.extname(ruta)) ruta = ruta.replace(/\/$/, '') + '.html';
      const relativo = ruta.replace(/^\/+/, '');
      if (relativo.split('/').some(part => part.startsWith('.')) || !['.html','.css','.js','.jpg','.jpeg','.png','.webp','.gif','.svg','.mp4','.xml','.txt'].includes(path.extname(relativo))) {
        res.writeHead(404); res.end('No encontrado'); return;
      }
      const archivo = path.resolve(root, relativo);
      if (!archivo.startsWith(path.resolve(root) + path.sep)) { res.writeHead(403); res.end(); return; }
      let datos;
      let status = 200;
      try { await stat(archivo); datos = await readFile(archivo); }
      catch { datos = await readFile(path.join(root, '404.html')); status = 404; }
      if (path.extname(archivo) === '.html' || status === 404) {
        // Probar una página no debe generar visitas en la analítica de producción.
        datos = Buffer.from(datos.toString().replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/g, '').replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/g, ''));
      }
      res.writeHead(status, { 'Content-Type': status === 404 ? tipos['.html'] : tipos[path.extname(archivo)], 'Cache-Control': 'no-store', 'Content-Length': datos.length });
      res.end(req.method === 'HEAD' ? undefined : datos);
    } catch {
      res.writeHead(400); res.end('No se pudo abrir esa dirección.');
    }
  });
  server.listen(port, '127.0.0.1', () => console.log(`Pixel Labs: http://localhost:${port} — Ctrl+C para cerrar.`));
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) iniciarVistaPrevia();
