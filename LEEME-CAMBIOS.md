# Pixel Labs — v4

Descomprimí sobre `pixel-labs-web/`. Reemplaza 7 archivos, agrega 2 nuevos y una carpeta de imágenes.

```
index.html   servicios.html   productos.html   nosotros.html   contacto.html
ideas.html   ← NUEVO          sitemap.xml      style.css       script.js
images/probador/   ← NUEVO (8 recortes, 147 KB en total)
```

Verificado en Chromium: 6 páginas × 3 anchos = 18 combinaciones sin scroll horizontal, sin imágenes rotas y sin errores de JavaScript.

---

## Las decisiones que tomé

### 1. Fuera todos los precios

Los saqué de todos lados: el bloque de cuatro medidas, el "desde $7.000" de la barra de confianza, los carteles de precio en Servicios, el "$1.800" de souvenirs, el schema de Google y las descripciones de cada página. **No queda un peso publicado en ningún lado.**

El costo de esa decisión es real: el precio filtraba visitantes y evitaba consultas de gente fuera de presupuesto. Así que lo reemplacé por algo que cumple la misma función mejor.

### 2. En su lugar: **el probador**

Es lo que ocupa el espacio donde estaban los precios, y es la pieza central de esta versión.

El visitante elige una pieza, elige el tamaño y la ve sobre una pared con **un sofá de 200 cm dibujado a escala real**. Cambiar de 25 a 50 cm duplica exacto lo que se ve en pantalla: la matemática está atada al ancho real de la escena, no es una animación decorativa. También puede arrastrar la pieza para acomodarla.

Y puede **subir una foto de su propia pared**. Le pedimos un solo dato —cuánto mide de ancho esa pared— y con eso la escala vuelve a ser correcta. La foto se procesa en el navegador con `URL.createObjectURL`: no viaja a ningún servidor, y eso está dicho en la página.

Cuando toca "Me gusta así, cotizala", te llega:

> ¡Hola Pixel Labs! Probé "Buda con árbol de la vida" en el probador de la web, en 50 × 36 cm. ¿Me pasan precio y plazo?

Ese mensaje vale más que un precio publicado: te llega la pieza, la medida y una persona que ya se la imaginó en su casa.

**Cómo lo armé.** Las fotos del catálogo no servían para superponer: son fotos sobre pared, muchas con manos. Generé recortes transparentes de las 8 piezas más limpias, separando la pieza del fondo con umbral de Otsu. Están en `images/probador/`. Si querés sumar más piezas, mandame cuáles y las proceso igual.

### 3. Página nueva: **Ideas**

Contenido de ventas de verdad, no relleno. Tres notas que responden las tres preguntas que frenan una compra:

- **El error de tamaño es el error caro.** La regla de los dos tercios respecto del mueble, la altura de 1,45 m, cuándo conviene un conjunto en vez de una pieza sola. Cierra empujando al probador.
- **Qué foto sirve para un retrato de mascota.** Luz, nitidez del hocico, contraste, altura de la cámara. Y lo que arruina una foto: capturas de historias y reenvíos de WhatsApp. Esto te va a ahorrar ida y vuelta en cada pedido.
- **Cuántos souvenirs encargar y cuándo.** La cuenta que funciona (uno por adulto + 10% + 3 para ustedes) y por qué la fecha límite no es la del evento.

Esto trabaja en dos frentes: posiciona en Google por búsquedas de intención de compra ("qué tamaño de cuadro elegir"), y le contesta al cliente antes de que pregunte. Agregué "Ideas" al menú y al sitemap.

### 4. Detalle de estilo: número de corte

Cada pieza del catálogo ahora muestra **"N.º de corte 001/066"** en la vista ampliada. Es un detalle chico que cambia la percepción: no es un producto de una grilla, es una pieza numerada de un taller.

---

## Qué queda pendiente

1. **Los testimonios de Inicio siguen siendo texto de relleno.** No publiques esa sección hasta poner los reales, o borrala.
2. **Tres respuestas del FAQ.** Buscá `[COMPLETAR` en `contacto.html`: plazo de producción, medios de pago y seña, y qué pasa si una pieza llega dañada.
3. **El canonical apunta a `pixellabs.ar`,** que todavía no existe.
4. **GA4 y el Píxel de Meta** están cableados pero sin ID.
5. **El formulario no guarda el email.** Sigue siendo el agujero más caro que tenés.

Nota sobre la calculadora de precios que armamos antes: **quedó fuera del sitio**, que era lo coherente con sacar los precios. Guardala como herramienta interna para cotizar rápido; el archivo lo tenés en la conversación.

---

## Ajustes de un renglón

- **Sumar piezas al probador:** el array `PIEZAS` al principio del bloque del probador en `script.js`. Necesitan un PNG con fondo transparente en `images/probador/`.
- **Cambiar el sofá de referencia:** el `<svg class="tryon-room">` en `productos.html` está dibujado sobre una escena de 300 cm de ancho; el sofá va de x=50 a x=250, o sea 200 cm.
- **Fecha de la cuenta regresiva:** atributo `data-deadline` en la barra de anuncio.
- **Colores de marca:** variables en `:root`, arriba de `style.css`.
- **Intensidad del plano de fondo:** `.blueprint svg { opacity: 0.5 }`.
