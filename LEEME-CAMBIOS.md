# Pixel Labs — qué cambió en esta tanda

## 0. Seguridad de la base de contactos

Cerré 7 agujeros. El detalle completo está en **`LEEME-CONTACTOS.md`**, al
final. El resumen:

1. **El CSV podía ejecutar fórmulas de Excel.** Era el peor de todos, y no
   atacaba a la web: te atacaba a vos, cuando abrías el archivo de contactos.
2. **Tope de 8 consultas cada 10 minutos** por persona. Antes te podían
   inundar la base.
3. **Tope de 10 claves erradas cada 15 minutos** en el panel. Antes se podían
   probar contraseñas toda la noche.
4. El formulario ahora **sólo acepta envíos desde tu sitio**.
5. Los errores de la base **ya no le cuentan al visitante** cómo está armada.
6. **Tope de 16 KB** por envío.
7. El panel **tenía cero cabeceras de seguridad** — el archivo `_headers` sólo
   cubre los archivos estáticos, no lo que genera el worker.

**Para vos no cambia nada y no tenés que correr ningún comando.** La tabla que
necesitan los topes 2 y 3 se crea sola la primera vez.

Sí quedan **3 cosas que sólo podés hacer vos** (contraseña larga, Bot Fight
Mode y bajar el CSV de vez en cuando): están explicadas al final de
`LEEME-CONTACTOS.md`.

## 1. Productos: las categorías van primero

Antes, al entrar a Productos había que bajar **3 pantallas y media** para
encontrar las tarjetas de categoría, porque arriba estaban el probador
(1.498 px) y el bloque de "dejanos tu mail" (763 px). O sea: lo primero que
alguien necesita —elegir por dónde empezar— estaba enterrado.

Ahora el orden es: título → **atajo al probador** → buscador → **categorías**
→ las piezas → probador → mail → cierre.

| | Antes | Ahora |
|---|---|---|
| Ver las categorías | pantalla 3,4 | **pantalla 0,85** |
| Ver las piezas de una categoría | pantalla 3,5 | **pantalla 0,92** |

El probador no se pierde: debajo del título quedó una **franja fina** que dice
*"¿Dudás del tamaño? Probá cómo queda en tu pared →"* y baja directo hasta él.
Ocupa 68 px en lugar de 1.498, y es un link de verdad (`#probador`), así que
funciona aunque el JavaScript no cargue.

En Google Tag Manager vas a ver un evento nuevo, **`probador_atajo`**: te dice
cuánta gente usa esa franja. Si con el tiempo casi nadie la toca, el probador
no le importaba a casi nadie y conviene dejarlo abajo; si la tocan mucho,
conviene volver a subirlo. Es la forma de decidirlo con datos y no a ojo.

Las 29 piezas de Deco se siguen mostrando todas de una, como pediste.

## 2. Precio orientativo en el probador

El probador ya no muestra sólo el tamaño: ahora, cuando elegís una medida,
aparece abajo **"Desde $X"**. La persona ve el número sin tener que escribirte,
y cuando toca *"Me gusta así, cotizala"* el WhatsApp te llega ya redactado con
la pieza, la medida **y el precio que vio**.

El probador quedó igual que antes. Esto se suma adentro, no reemplaza nada.

### ⚠️ Dónde se cambian los precios

Un solo lugar: el archivo **`script.js`**, buscá `PRECIOS`. Está arriba de todo,
con un comentario que lo señala. Se ve así:

```js
var PRECIOS = { 25: 7000, 38: 12000, 50: 30000, 80: 60000 };
```

- `25` = cuadro de 25 cm de lado más largo → arranca en $7.000
- `38` = 38 cm → $12.000
- `50` = 50 cm → $30.000
- `80` = 80 cm → $60.000

Cambiás el número de la derecha, guardás, subís, y listo. **No hay que tocar
nada más**: la web, el WhatsApp y la medición usan todos ese mismo renglón.

**Estos son los precios que me pasaste vos** (agosto 2026). Con la inflación
conviene revisarlos cada 2 o 3 meses. Si un día te quedan viejos, en la web va
a aparecer un número más bajo del que cobrás y vas a tener que corregirlo por
WhatsApp, que es justo lo que este cambio venía a evitar.

El texto chico debajo del precio dice *"Orientativo. El final depende del
diseño, el material y si va pintado"*, así que no te ata a ese número.

---

## Para publicar

Cloudflare publica solo cuando subís los cambios a GitHub. Abrí la terminal de
VS Code en la carpeta del sitio y pegá esto, **una línea por vez**:

```
git fetch origin
git reset origin/main
git add -A
git commit -m "seguridad de la base, categorias primero y precio en el probador"
git push
```

No uses "Merge" ni "Abort Merge" en VS Code: esa secuencia de arriba evita el
conflicto en lugar de tener que resolverlo.

En 1 o 2 minutos Cloudflare termina de publicar y el cambio está en
`pixellabs.com.ar`.

---

## Verificado antes de entregarte esto

- 18 pruebas de la página de productos, en celular y en escritorio: las 7
  fichas de categoría, el salto a cada una, la barra pegada de arriba, el
  botón "‹ Categorías", el buscador, los links tipo `productos.html#mascotas`,
  la franja de atajo y "Verla en mi pared". Las 18 pasan en los dos anchos.
- Las cuatro medidas muestran el precio correcto (25→$7.000, 38→$12.000,
  50→$30.000, 80→$60.000), en escritorio y en celular.
- El link de WhatsApp lleva el precio adentro del mensaje.
- Las 7 páginas cargan sin errores de JavaScript, sin scroll horizontal y sin
  imágenes rotas, a 390 px y a 1440 px.
- **55 pruebas del servidor** (eran 28): las de siempre más 27 nuevas, una por
  cada agujero cerrado. Incluyen que el freno no te bloquee a vos, que quien
  se pase igual reciba el link de WhatsApp, y que las fórmulas del CSV queden
  neutralizadas.
- Los botones de medida siguen midiendo más de 44 px (se tocan bien con el dedo).
- El bloque de precio anuncia el cambio a los lectores de pantalla
  (`aria-live`), así que una persona ciega también se entera del precio nuevo.

---

## Lo que sigue pendiente (de antes)

1. **Comercio** y **A medida** siguen sin ninguna foto. Son 2 de las 7
   categorías vacías.
2. El probador cubre 19 de los 79 diseños, todos de Deco. Mascotas no tiene
   ninguno: para sumarlos necesito fotos de la pieza sola sobre pared clara,
   de frente, sin manos ni objetos alrededor.
3. En Google Tag Manager falta crear la etiqueta de **GA4**. GTM por sí solo no
   mide nada: es la caja, y adentro todavía no hay nada que mida.
4. **Google Business Profile** sin dar de alta. Es gratis y es lo que hace que
   aparezcas en el mapa cuando alguien busca "grabado láser San Vicente".
