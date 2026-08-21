# Pixel Labs — SITIO COMPLETO, listo para publicar

**Última tanda:** 7 reseñas reales de clientes y 6 productos nuevos en Deco.
El catálogo pasó a **76 diseños**.

Este zip trae **la carpeta entera**: todas las páginas, el CSS, el JavaScript, todas las
imágenes y los archivos de configuración. No falta nada. Descomprimilo y ya tenés el
sitio funcionando: abrí `index.html` con doble clic para verlo antes de publicar.

**No queda ningún texto de relleno.** Los testimonios inventados salieron y los tres
`[COMPLETAR]` del FAQ están redactados de forma honesta (ver más abajo).

Descomprimí sobre `pixel-labs-web/` y reemplazá todo. Después:

```bash
npx wrangler deploy
```

**Preflight verificado en Chromium:** 7 páginas × 3 anchos (390 / 768 / 1440), sin scroll horizontal, sin imágenes rotas, sin errores de JavaScript, un solo `h1` por página, todos los links internos resuelven, todas las imágenes con `alt`, y `title` + `meta description` dentro del largo que Google muestra completo.

---

## 1. Todos los productos en el probador

El catálogo pasó de 66 a **70 productos**: encontré 4 fotos en tu carpeta que nunca habías publicado y las sumé a Deco — Buda con Árbol de la Vida, Cruz con Rostro, Luna Mandala y Flor Mandala con Colibríes.

De esos 70, **26 están en el probador** con recorte transparente. El probador ahora tiene su propio buscador y una grilla con scroll, y desde la vista ampliada de cualquiera de esas 26 aparece el botón **"Verla en mi pared"** que salta al probador con la pieza ya elegida.

**Por qué 26 y no 70.** Procesé las 70 con separación automática de fondo y control de calidad, y después revisé una por una en hojas de contacto. Las que quedan afuera es por la foto, no por el algoritmo:

- **Los retratos de mascota (23)** están fotografiados con las manos sosteniendo la pieza y la foto de referencia al lado. Al recortarlos quedan manchones negros con dedos.
- **Los souvenirs sobre mesa (14)** tienen objetos y sombras alrededor que se pegan a la pieza.
- **Algunas placas de catálogo** no son fotos de la pieza: son collages con texto y ambientación.

Para sumar cualquiera de esas al probador necesito **una foto de la pieza sola, apoyada o colgada sobre pared clara y lisa, de frente, sin manos ni objetos**. Con eso el recorte sale automático. Sacá cinco o seis de los retratos más vendidos y te los agrego.

## 2. Todo oscuro y translúcido

Saqué las tres secciones color crema (el proceso en Inicio, corporativos en Servicios, el FAQ en Contacto). En su lugar hay **secciones de vidrio**: mismo cambio de ritmo, pero con un velo dorado translúcido, desenfoque de fondo y un filo de luz arriba. El sitio no sale del negro en ningún momento.

Además subí la translucidez de todos los paneles: el desenfoque pasó de 8 a 14 px y los fondos de opacos a vidrio, así que **el plano de la Falcon2 se ve atravesando el contenido** en vez de quedar tapado. Borré 36 reglas de CSS del tema claro que quedaron sin uso.

La pared del probador pasó a un tono medio cálido en vez de crema. Como las piezas son negras y ahora el fondo es oscuro, les puse un filo de luz dorada para que se separen.

## 3. Backend, listo para publicar

Lo que faltaba y ahora está:

- **`404.html`** — tu `wrangler.jsonc` declara `not_found_handling: "404-page"`, que espera ese archivo. No existía, así que cualquier link roto mostraba el 404 pelado de Cloudflare. Ahora hay uno con la marca ("Este corte no salió").
- **`_headers`** — cabeceras de seguridad (nosniff, anti-clickjacking, HSTS, referrer, permissions) y caché: los HTML se revalidan siempre para que un cambio se vea al toque; imágenes, CSS y JS quedan cacheados.
- **`.assetsignore`** — `assets.directory` es `"./"`, así que Cloudflare subía **todo**, incluido este archivo con tus notas internas. Ahora quedan fuera del deploy este LEEME, el README y el `wrangler.jsonc`.
- **Canonical, `og:url`, sitemap, robots y schema** apuntan a **https://pixellabs.com.ar**. Antes decían `pixellabs.ar` (sin el `.com`), un dominio que no existe: eso le pedía a Google que indexara una URL rota. Ver la sección de dominio más abajo para el orden de publicación.
- **Sitemap** con las 6 páginas (faltaba `ideas`).

## 4. Peso

La página de productos cargaba 70 JPG de hasta 1 MB. Ahora:

| | Antes | Ahora |
|---|---|---|
| Código (HTML+CSS+JS) | — | 187 KB |
| Imágenes de la grilla | ~10 MB en JPG | **1,6 MB en WebP** |
| Recortes del probador | — | 343 KB |

La grilla carga miniaturas WebP de 560 px y el JPG grande se pide **solo** cuando alguien abre una pieza en la vista ampliada. Los JPG originales quedan en la carpeta para eso.

---

## Dominio: pixellabs.com.ar

Todo el sitio (canonical, og:url, sitemap, robots, schema) ya apunta a **https://pixellabs.com.ar**.

**El orden importa:**

1. **Registrar / verificar el dominio** en [nic.ar](https://nic.ar). Los `.com.ar` se gestionan ahí y hace falta CUIT/CUIL.
2. **Pasar el dominio a Cloudflare.** En Cloudflare: *Add a site* → `pixellabs.com.ar`. Te va a dar dos nameservers. Cargalos en NIC.ar reemplazando los que tenga. Tarda entre minutos y algunas horas en propagar.
3. **Conectar el dominio al Worker.** Cloudflare → Workers & Pages → `pixel-labs-web` → Settings → Domains & Routes → **Add Custom Domain** → `pixellabs.com.ar`. Repetí con `www.pixellabs.com.ar` si querés que también funcione.
4. **Recién ahí:** `npx wrangler deploy`.
5. **Google Search Console:** agregá la propiedad `pixellabs.com.ar`, verificala (con Cloudflare es un clic por DNS) y subí `https://pixellabs.com.ar/sitemap.xml`.

**Si querés publicar hoy y conectar el dominio después,** reemplazá en los 7 HTML + `sitemap.xml` + `robots.txt`:

```
https://pixellabs.com.ar   →   https://pixel-labs-web.rodrigo-s-diaz09.workers.dev
```

y cuando conectes el dominio, hacé el reemplazo al revés. Está anotado en el `<head>` de cada página.

---

## Los dos pendientes de contenido, resueltos

**Testimonios: resueltos con material real.** En Inicio hay un carrusel con **7 capturas de
historias de Instagram** de clientes que etiquetaron a @PixelLabs.ar, cada una con su frase
transcrita: Canela, Paco, los cuatro retratos en fila, el galgo con su cuadro colgado, el
"pedacito de cielo", el shar-pei y el envío a Mendoza.

Las capturas están en `images/resenas/` en WebP (340 KB las siete juntas). Para sumar más:
poné el archivo ahí y copiá una tarjeta en `index.html` cambiando el nombre del archivo, la
frase y el epígrafe.

Un detalle de honestidad: la captura de Mendoza lleva una frase **tuya**, no del cliente. Esa
tarjeta va sin comillas y con estilo distinto, para que no se lea como si fuera un testimonio.

**Las tres respuestas del FAQ.** Las redacté sin inventar tus plazos ni tu política, así que
son publicables tal cual:

| Pregunta | Cómo quedó |
|---|---|
| ¿Cuánto tardan? | "Depende de la pieza y de la agenda del taller. Te confirmamos el plazo con el presupuesto, antes de que pagues nada, y desde ahí no se mueve." |
| ¿Cómo se paga? | "Te pasamos los medios con el presupuesto. Pedimos una seña para arrancar y el resto antes del despacho." |
| ¿Si llega dañada? | "Si algo llega dañado nos hacemos cargo. Mandanos una foto por WhatsApp y lo resolvemos." |

Son ciertas y no te atan a nada. **Cuando quieras hacerlas específicas** —"5 a 7 días
hábiles", "transferencia y Mercado Pago", "seña del 50%"— convierten mejor, porque el que
lee un número concreto duda menos. Pasame esos tres datos y las actualizo.

## Productos nuevos en Deco

Se sumaron seis, y el catálogo quedó en **76**. Los contadores de todo el sitio
(el título de Productos, el buscador y las estadísticas de Inicio) se actualizan
solos desde el catálogo, así que ya dicen 76 en todos lados.

| Pieza | Nota |
|---|---|
| Gatos con Luz LED | Quedó también como foto del bloque "Piezas con luz" en Inicio: es la más impactante que tenés |
| Íconos del Rock Nacional | Con luz LED sobre madera |
| Latido Perruno | Latido con silueta de perro, corazón y huellas |
| Sol Patrio · Sean Eternos los Laureles | Placa promocional |
| Coronados de Gloria | Placa promocional |
| Sol de Libertad | Placa promocional |

**Ninguna entró al probador.** Probé las tres que parecían viables y salieron mal: la de
los gatos se invierte porque el fondo es más claro que la pieza, el latido queda como un
manchón por el fondo marrón, y la del rock recorta solo dos de las cuatro caras. El probador
sigue con los 19 cuadros de Deco sobre pared lisa.

Un detalle sobre las tres placas patrias: llevan el título impreso dentro de la imagen
("CUADRO SOL PATRIO", "SOL DE LIBERTAD"). Funcionan igual en la grilla, pero si algún día
sacás la foto de la pieza sola sobre pared blanca, entran al probador y se ven mejor en
la vista ampliada.

## Lo que sigue pendiente

1. **GA4 y el Píxel de Meta:** el bloque comentado está en el `<head>` de cada página. Sin eso no vas a saber cuánta gente usa el probador, que es justo lo que querés medir.
2. **El formulario no guarda el email.** Abre WhatsApp pero no se queda con el contacto. Es el agujero más caro que tenés.
3. **Fotos para sumar piezas al probador:** hoy hay 26 de 70. Con fotos de la pieza sola sobre pared lisa, sin manos, te agrego las que quieras.

---

## Cambios de esta versión

**El fondo.** Los círculos de fases lunares salieron. Ahora el láser está cortando **un cartel con la marca**: una placa con sus agujeros de montaje y su colgante, donde aparece "PixelLabs · grabado y corte láser". El contorno se dibuja solo y después se enciende el texto, en loop.

**La barra de anuncio** quedó con el texto y la cuenta regresiva nada más, sin el botón. Perdés un camino de contacto ahí, pero la barra se lee más limpia. Si algún día lo querés de vuelta, es una línea en `build`/en el HTML.

**FAQ actualizado con tus datos reales:**
- *¿Cuánto tardan?* → "La producción nos lleva **3 días**. A eso hay que sumarle el tiempo de Correo Argentino, que ya no depende de nosotros."
- *¿Cómo se paga?* → "Se abona el valor del **producto más el costo del envío**. Te pasamos los dos números por separado."

**El probador quedó solo con cuadros de Deco: 19 modelos.** Saqué los souvenirs y la cartelería, que colgados en una pared no tenían sentido.

## SEO — lo que se hizo y por qué

**Menos repetición.** Los 70 botones del catálogo decían todos "Cotizar esta pieza". Ahora rotan entre cinco textos (*La quiero · Pedir precio · Consultar · Quiero esta · Cotizar*). La palabra "pieza" pasó de 109 apariciones a 36, y "cotizar" de 86 a 27. Google penaliza el texto repetitivo, pero sobre todo: leído por una persona, sonaba a robot.

**Cada página con su propia promesa.** Antes todos los títulos empezaban igual. Ahora cada uno ataca una búsqueda distinta:

| Página | Título | A qué búsqueda apunta |
|---|---|---|
| Inicio | Cuadros y Regalos Personalizados en Corte Láser | "regalos personalizados", "cuadros personalizados" |
| Productos | Catálogo: 70 Diseños en Madera y Acrílico | quien ya quiere ver y comparar |
| Servicios | Grabado a Medida, Regalos con Logo y Souvenirs | empresas y eventos |
| Ideas | Cómo elegir tamaño, foto y cantidad | quien todavía no decidió (tráfico frío) |
| Nosotros | Quiénes Somos · El Taller en San Vicente | búsqueda de marca y confianza |
| Contacto | Pedí tu Presupuesto | intención de compra directa |

**Palabras clave orientadas al comprador,** no al oficio. Antes decían "grabado láser", "corte láser" — que es como te describís vos. Ahora dicen lo que la gente escribe en Google: *"regalo personalizado"*, *"retrato de perro en madera"*, *"souvenirs quince años"*, *"cuadro mandala madera"*, *"regalo para el día de la madre"*, *"cartel para local"*.

> Nota honesta: la etiqueta `meta keywords` **Google la ignora desde 2009**. La dejé porque no molesta y algún buscador menor la mira, pero no es ahí donde se gana. Lo que sí pesa es el título, la descripción, los encabezados y el texto alto de las imágenes — y todo eso está trabajado.

**La imagen para compartir: `images/compartir.jpg`.** Esto es lo más importante de todo el bloque de SEO para vos. Cuando mandabas el link por WhatsApp o lo ponías en Instagram, la vista previa mostraba el favicon diminuto. Ahora aparece una placa de 1200 × 630 con tu logo, "Cuadros y regalos personalizados", las tres categorías y el dominio. Es lo que ve alguien antes de decidir si toca el link.

También sumé `og:site_name`, `og:image:alt`, `twitter:image` y etiquetas de geolocalización (`geo.region`, `geo.placename`) que ayudan en las búsquedas locales de San Vicente y alrededores.

## Ajustes de un renglón

- **Fecha de la cuenta regresiva:** `data-deadline` en la barra de anuncio.
- **Sumar una pieza al probador:** poné el PNG transparente en `images/probador/` y agregá una línea al array `PIEZAS` en `script.js`.
- **Colores de marca:** variables en `:root`, arriba de `style.css`.
- **Intensidad del plano de fondo:** `.blueprint svg { opacity: 0.72 }`.
- **Texto del cartel del fondo:** buscá `bp-sign-txt` en los HTML.
- **Imagen para compartir:** reemplazá `images/compartir.jpg` (tiene que medir 1200 × 630).
