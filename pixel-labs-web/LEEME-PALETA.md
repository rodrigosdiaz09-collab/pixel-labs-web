# Pixel Labs — Paleta del nuevo logo

Actualización: 23 de septiembre de 2026.

El sitio usa fondo marfil, superficies blancas, azul petróleo y detalles ámbar. Los textos secundarios tienen un tono pizarra oscuro para que sigan siendo legibles. Todos los textos usan tipografía sans-serif.

| Uso | Color |
|---|---|
| Fondo principal | `#F7F4ED` |
| Tarjetas y formularios | `#FFFFFF` |
| Superficie secundaria | `#EDF2F0` |
| Marca, títulos y botones | `#244B52` |
| Botones al pasar el cursor y pie | `#17383F` |
| Texto principal | `#20383D` |
| Texto secundario | `#4E6065` |
| Detalles ámbar | `#D8A34E` |

## Cambios

- Las siete páginas cargan `theme-petroleo.css` después de `style.css`.
- Encabezado, menú móvil, tarjetas, catálogo, fichas, probador, formularios y pie adaptados a la nueva paleta.
- Nuevo monograma en encabezado y pie, e iconos de navegador actualizados.
- Fondos opacos, textos auxiliares legibles y foco visible al navegar con teclado.
- Se mantienen los 82 productos, sus imágenes, los precios y su formato, el JavaScript y la animación de la máquina.

## Cómo aplicarlo

1. Descomprimí el ZIP y abrí la carpeta `pixel-labs-web` en VS Code.
2. Para verlo localmente, ejecutá `node vista-previa.mjs` y abrí `http://localhost:4173`.
3. Conservá una copia de tu proyecto actual y copiá el contenido de `pixel-labs-web` sobre los archivos de tu repositorio. Conservá tu carpeta `.git` y configuración local.
4. Revisá y guardá los cambios en GitHub con tu procedimiento habitual. Cloudflare los publicará según la configuración de tu proyecto.

La carpeta `revision-paleta` contiene capturas y el informe de revisión; no hace falta subirla al sitio. Esta entrega no publica cambios en la web activa.

## Verificación realizada

Se recorrieron Inicio, Productos, Servicios, Ideas, Nosotros, Contacto y 404 a 1440 px y 390 px de ancho. No se detectaron desbordes horizontales, errores JavaScript ni fallos en la comprobación de contraste de los textos evaluados. También se comprobó apertura de categorías y fichas, menú móvil, selección y vaciado de piezas.

El texto secundario sobre las superficies principales supera 5,8:1 de contraste, y el texto blanco sobre el botón principal supera 9:1. El ámbar se usa como acento decorativo, no como texto pequeño sobre blanco.

La revisión automatizada calcula contraste a partir de los estilos y fondos de los elementos; no evalúa texto dentro de fotografías ni constituye una certificación completa de accesibilidad. Las capturas usan la fuente sans-serif de respaldo porque se bloquearon las solicitudes externas durante la prueba. El formulario de consultas depende del Worker y de la base de Cloudflare; no se enviaron consultas reales.
