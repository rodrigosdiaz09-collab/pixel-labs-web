# Pixel Labs — Sitio web

Guía para poner el sitio online pagando **solo el dominio**.

## Qué incluye

- `index.html`, `servicios.html`, `productos.html`, `nosotros.html`, `contacto.html` — las 5 páginas.
- `style.css` — sistema de diseño (negro `#0D0D0D` + dorado `#C9A24B`, tipografía Cormorant Garamond + Jost).
- `script.js` — menú móvil, partículas del hero, filtro de productos y formulario → WhatsApp.
- `favicon.svg` — monograma placeholder (reemplazar cuando tengas el logo real).
- `robots.txt` y `sitemap.xml` — para indexación en Google.
- `images/` — carpeta para tus fotos reales.

## Costos reales

| Concepto | Costo |
|---|---|
| Hosting (Cloudflare Pages) | **Gratis** |
| Formulario de contacto | **Gratis** (abre WhatsApp directamente, sin backend) |
| Dominio propio (ej. pixellabs.ar) | **Único gasto real**, ~$3.000-15.000 ARS/año |

---

## Paso 1 — Reemplazar el placeholder del logo

Cuando me pases el archivo del logo:
1. Lo convierto a `favicon.svg` (o `.png`/`.ico` si hace falta) y reemplazo el ícono circular actual en el header de las 5 páginas.
2. Ajusto el dorado exacto de `style.css` (`--gold`) si tu logo usa un tono distinto a `#C9A24B`.

## Paso 2 — Cargar tus fotos reales

En cada página, las imágenes apuntan a archivos dentro de `images/` (por ejemplo `images/producto-boda.jpg`). Mientras no subas la foto, se ve un aviso de "Espacio para foto real" en su lugar — así sabés exactamente qué falta.

1. Sacá o conseguí las fotos de tus piezas (fondo prolijo, buena luz).
2. Nombralas igual que en el HTML (o cambiá el `src` en el HTML al nombre que uses).
3. Subilas a la carpeta `images/`.

Para SEO, cada imagen ya tiene un `alt` descriptivo con palabras clave (ej. "grabado láser personalizado en madera - Pixel Labs"). Si cambiás una foto por algo distinto, actualizá también su `alt`.

## Paso 3 — Publicar en Cloudflare Pages (gratis)

1. Subí esta carpeta a un repositorio en [GitHub](https://github.com) (gratis).
2. Creá una cuenta en [pages.cloudflare.com](https://pages.cloudflare.com).
3. "Create a project" → "Connect to Git" → elegí el repositorio.
4. Dejá el build command vacío y el output directory en `/` (es un sitio estático, no hay build).
5. Desplegá. Cloudflare te da automáticamente URLs limpias: `/servicios`, `/productos`, etc., sin necesidad de configurar nada extra.

## Paso 4 — Conectar tu dominio

1. Comprá el dominio en [nic.ar](https://nic.ar) (para `.com.ar`) o Namecheap/GoDaddy para `.com`.
2. En Cloudflare Pages: **Custom domains** → agregá `pixellabs.ar` (o el que hayas elegido).
3. Configurá los registros DNS que te indique Cloudflare en el panel del registrador.
4. Una vez conectado el dominio, actualizá estos 3 archivos con tu dominio real (ahora dicen `pixellabs.ar` como ejemplo):
   - `sitemap.xml`
   - `robots.txt`
   - la etiqueta `<link rel="canonical">` y el `og:` de cada página HTML

## Paso 5 — Indexar en Google

1. Entrá a [Google Search Console](https://search.google.com/search-console) y agregá tu dominio.
2. Enviá tu `sitemap.xml` desde ahí (Sitemaps → agregar `sitemap.xml`).
3. En unos días Google empieza a mostrar tus páginas en los resultados.

## Cómo editar el número de WhatsApp

Está en dos lugares:
- `script.js`, constante `WHATSAPP_NUMBER` (arriba del todo, sección de formulario).
- Los links `https://wa.me/542224642172` en el footer y en `contacto.html`.

## Cómo agregar más productos a la galería

Copiá un bloque `<article class="gallery-item" data-cat="...">` dentro de `productos.html` (categoría `Eventos` u `Hogar`), cambiá la imagen, el `alt` y el título. Las clases `wide` o `tall` agrandan la tarjeta para mantener el efecto de galería editorial (tamaños mezclados, no todas iguales).

## Soporte

Si algo no se ve como esperás al desplegar (colores, tipografía, el filtro de productos, el botón de WhatsApp), pegame el detalle y lo reviso.
