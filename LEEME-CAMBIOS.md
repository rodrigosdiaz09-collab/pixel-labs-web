# Pixel Labs — qué cambió y qué te falta completar

## Archivos de este zip

Reemplazá estos 7 en tu carpeta `pixel-labs-web/`. **Las imágenes no cambiaron**, no vienen en el zip.

```
index.html      servicios.html   productos.html
nosotros.html   contacto.html    style.css   script.js
```

Los 66 productos del catálogo están todos, con sus fotos, nombres y links de WhatsApp intactos.

---

## ⚠️ Antes de publicar: 4 cosas para completar

### 1. Las respuestas del FAQ que no sé
En `contacto.html` hay tres marcas `[COMPLETAR: ...]` bien visibles. Buscá esa palabra en el archivo y reemplazá:

| Pregunta | Qué falta |
|---|---|
| ¿Cuánto tardan? | Días hábiles de producción y anticipación mínima para eventos |
| ¿Cómo se paga? | Medios de pago que aceptás y el porcentaje de seña |
| ¿Si llega dañada? | Tu política real de reposición |

Están también en el JSON-LD del `<head>` de esa página, así que cambialos en los dos lugares (o pedime que lo regenere).

### 2. Los testimonios son texto de relleno
En `index.html`, la sección "La parte que no escribimos nosotros" tiene tres tarjetas con `[Reemplazá este texto...]`. **No la publiques así.** Poné testimonios reales de clientes —una captura de WhatsApp alcanza como fuente— o borrá la sección entera hasta juntarlos.

### 3. El canonical apunta a un dominio que no existe
Las 5 páginas declaran `https://pixellabs.ar/...` mientras el sitio vive en workers.dev. Hay un comentario que lo avisa en cada `<head>`. Conectá el dominio o cambiá esas URLs (y el `sitemap.xml`).

### 4. La medición está cableada pero apagada
En el `<head>` de cada página hay un bloque comentado listo para pegar GA4 y el Píxel de Meta. Apenas pongas tu ID, `script.js` empieza a disparar solo el evento **`contacto_whatsapp`** en cada clic a WhatsApp, con el origen y el botón. Ese es tu KPI.

---

## Lo que se agregó

**Efectos**

- Preloader que se va en 200 ms (tope duro: 1,2 s).
- Cursor láser con anillo que reacciona a los links (solo mouse).
- Títulos que se "graban" letra por letra al entrar en pantalla.
- Revelados al scroll con retardo escalonado.
- Barra de progreso dorada arriba, que avanza como el corte.
- Tilt 3D + brillo que sigue al puntero en las 66 piezas del catálogo.
- Botones magnéticos que se acercan al cursor.
- Grano de película y viñeta sobre todo el sitio.
- Ticker de palabras corriendo bajo el hero.
- Transición entre páginas: el láser barre y pasa.
- Partículas del hero mejoradas, y se pausan si cambiás de pestaña.

**Todos los efectos pesados se apagan solos** en pantallas táctiles y si el visitante tiene activado "reducir movimiento" en su sistema. Si el JS falla, el contenido se ve igual: el estado oculto depende de una clase que agrega el propio script.

**Marketing**

- Botón flotante de WhatsApp que aparece al scrollear.
- Barra de anuncio estacional arriba de todo, cerrable.
- Barra de confianza: envíos, aprobás antes, desde $7.000, atención directa.
- Bloque de 4 precios en Productos ($7.000 / $12.000 / $30.000 / $60.000).
- Página de regalos corporativos dentro de Servicios.
- FAQ de 8 preguntas con schema FAQPage.
- Contadores animados con datos reales (66 diseños, 3 materiales, 24 provincias).
- Formulario con campo de medida y mensaje precargado más completo.
- Migas de pan, `skip link`, y schema LocalBusiness con ofertas.

**Textos**

Reescritos los cinco. Mismo mensaje, más filo y con el humor sostenido:
*"Cortamos por lo sano. Literal, literalmente."* · *"El único humo que hacemos es el del láser."* ·
*"A la Luna todavía no llegamos, pero tenemos las fases en cuadro."* ·
*"PD: el taller sigue oliendo a madera quemada. No pensamos arreglarlo."*

---

## Ajustes de un renglón

**Cambiar la barra de anuncio.** Está al principio del `<body>` de las 5 páginas, con un comentario que la señala. Cambiale el texto cuando pase el Día de la Madre, o borrá el bloque para ocultarla.

**Destacar el tamaño más vendido.** En `productos.html`, tarjeta del 32×38, hay una línea comentada:
`<span class="price-badge">El más elegido</span>`. Si es verdad que es tu más vendido, sacale los `<!-- -->`.

**Cambiar los colores.** Las 8 variables de marca están arriba de todo en `style.css`, en `:root`.

---

## Dos cosas que arreglé de paso

- **`--radius` no existía.** El CSS viejo la usaba en `.service-row`, `.contact-info-row` y `#contactForm`, pero nunca estaba definida, así que el navegador la ignoraba. Ahora está declarada en `0px`, que es lo que se veía. Si querés esquinas redondeadas, cambiala a `4px` y se aplica en todos lados.
- **Los filtros de categoría** no tenían padding ni ancho máximo: quedaban pegados al borde izquierdo mientras el resto respetaba el margen. Alineados y con `wrap` en celular.
