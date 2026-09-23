# Pixel Labs — cambios de esta entrega

Se mantuvo la estética oscura con detalles dorados, la animación original
de la máquina y los recursos originales del sitio.

## Mejoras realizadas

- Inicio con un mensaje más claro y accesos a tres piezas del catálogo.
- Tarjetas del catálogo con nombre y acciones visibles sin pasar el mouse.
- Ajustes de contraste, tamaños táctiles y distribución para pantallas chicas.
- Buscador que limpia los filtros anteriores al borrar la búsqueda o cambiar
  de categoría.
- Fichas con enlace propio para compartir una pieza concreta.
- Acceso al probador que selecciona la pieza correspondiente aunque hubiera
  una búsqueda previa; la opción se oculta si falta un recorte compatible.
- Selección de piezas conservada durante la sesión al cambiar de página.
- Mejoras de navegación con teclado, foco y estados del menú y los botones.
- Carga inicial más breve y enlaces a CSS y JavaScript versionados para que
  el navegador actualice los archivos después de publicar.
- Texto del formulario y de las preguntas frecuentes ajustado al recorrido.
- Vista previa local sin dependencias adicionales: `node vista-previa.mjs`.

## Precios y contenido preservados

Los importes, su formato y el bloque de precio original del probador se
conservaron. Siguen definidos en `script.js`, en `PRECIOS`:

| Medida | Precio desde |
| --- | --- |
| 25 cm | $7.000 |
| 38 cm | $12.000 |
| 50 cm | $30.000 |
| 80 cm | $60.000 |

Se mantuvieron los 82 productos y su orden, las imágenes, el video de la
máquina, el código del Worker, la configuración de Cloudflare, `robots.txt`
y `sitemap.xml`. No se agregaron importes a productos que no los tenían.

## Verificación realizada

Se compararon los nombres de las 82 piezas, los importes y el HTML del bloque
de precio con el ZIP recibido. Se verificó que los archivos originales de
imágenes y video y los archivos de servidor indicados arriba no cambiaran.

Las siete páginas no tienen identificadores HTML duplicados y sus referencias
a imágenes locales existen. Los enlaces destacados apuntan a piezas del
catálogo. JavaScript pasó la comprobación de sintaxis. El servidor de vista
previa respondió correctamente para inicio, catálogo, CSS, JavaScript y video.

La prueba visual y de interacción completa en navegador quedó pendiente.
Antes de publicar, revisá especialmente el menú en celular, búsqueda y
categorías, abrir y compartir una ficha, selección de piezas y probador con
sus cuatro medidas. El envío real del formulario requiere Cloudflare y su
base de datos y no se probó enviando una consulta.

## Uso y publicación

Seguí `LEEME-PRIMERO.txt`. El ZIP contiene los archivos del proyecto para
copiar sobre tu repositorio actual; no modifica el historial de Git.
Los scripts antiguos de reparación incluidos en el proyecto no son parte
del procedimiento de esta entrega. Las instrucciones de configuración de
contactos existentes permanecen en `LEEME-CONTACTOS.md`.
