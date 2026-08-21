# Base de contactos — cómo activarla

Esto se hace **una sola vez**. Después funciona solo.

Hasta que lo hagas, el sitio anda igual que siempre: el formulario abre
WhatsApp como antes. Lo único que falta es que además guarde el contacto.

Abrí la terminal **parado en la carpeta del sitio** (la que tiene `index.html`).
En VS Code: menú Terminal → Nueva terminal.

---

## Importante: cómo se publica tu sitio

Tenés Cloudflare conectado a GitHub (Workers Builds). Eso significa que
**cada `git push` publica el sitio solo**. No hace falta que corras
`npx wrangler deploy` en tu computadora: lo corre Cloudflare.

Por eso el identificador de la base tiene que quedar **committeado y subido**.
Si lo tenés bien en tu máquina pero no lo subiste, el build de Cloudflare
sigue fallando.

---

## Paso 1 — Conectarte a Cloudflare (en tu computadora)

```bash
npx wrangler login
```

Se abre el navegador y te pide autorizar. Si ya lo hiciste antes, salteá esto.

## Paso 2 — Crear la base

```bash
node configurar-base.mjs
```

Crea la base, escribe el identificador en `wrangler.jsonc` y crea la tabla.

> **Alternativa sin terminal:** en el panel de Cloudflare, entrá a
> *Storage & Databases → D1 → Create*, ponele de nombre `pixel-labs-leads`,
> y copiá el *Database ID* que te muestra. Pegalo en `wrangler.jsonc`
> reemplazando `FALTA-CONFIGURAR-CORRE-node-configurar-base.mjs`.

## Paso 3 — Subirlo (esto es lo que publica)

```bash
git add wrangler.jsonc
git commit -m "Conecta la base de contactos"
git push
```

Cloudflare va a arrancar un build solo. Miralo en *Workers & Pages →
pixel-labs-web → Builds*. Esta vez tiene que dar verde.

## Paso 4 — La contraseña del panel

Recién cuando el build salió bien (porque el Worker tiene que existir):

```bash
npx wrangler secret put PANEL_CLAVE
```

Te la pide por teclado y **no se ve mientras la escribís**. Es normal.

> **Alternativa sin terminal:** panel de Cloudflare → *Workers & Pages* →
> `pixel-labs-web` → *Settings* → *Variables and Secrets* → *Add*,
> tipo **Secret**, nombre `PANEL_CLAVE`, y el valor que elijas.

Los secretos toman efecto al toque, no hace falta volver a publicar.

---

## Cómo ver los contactos

Entrá a **https://pixellabs.com.ar/panel**

El navegador te pide usuario y contraseña:

- **Usuario:** cualquier cosa (no se usa, poné `pixel`)
- **Contraseña:** la del paso 3

Ahí está la lista, el buscador y el botón **Descargar para Excel**.

---

## Qué se guarda

| Origen | Cuándo |
|---|---|
| `formulario` | Alguien completa el formulario de Contacto |
| `novedades` | Alguien deja el mail en "¿Todavía no es el momento?" |

De cada uno queda: fecha, nombre, email, qué necesita, medida, mensaje y origen.

**No se guarda la dirección IP ni nada del dispositivo**, solo lo que la
persona escribió.

---

## Lo importante que cambió

Antes, si alguien completaba el formulario y no llegaba a mandar el mensaje
de WhatsApp, ese contacto se perdía para siempre.

Ahora **primero se guarda y después se abre WhatsApp**. Aunque cierre la
ventana en el acto, el contacto ya está. Está probado: se simuló a alguien
cerrando la pestaña en el mismo instante de apretar enviar, y el dato quedó.

---

## Si algo falla

**El build de Cloudflare falla en "Deploying"**
Entrá al build, desplegá la sección *Deploying* y leé el error.
El más común es `Couldn't find a D1 DB` o `database not found`: significa que
`wrangler.jsonc` pide una base que no existe, o que el identificador todavía
dice `FALTA-CONFIGURAR`. Hacé los pasos 2 y 3.

**Necesito que el sitio se publique YA, aunque la base no ande**
Abrí `wrangler.jsonc` y borrá el bloque `"d1_databases": [ ... ]` entero
(desde la coma que lo separa de `assets` hasta el corchete de cierre).
Subilo y el sitio publica igual: el formulario va a abrir WhatsApp como
siempre, solo que sin guardar el contacto. Después lo volvés a poner.

**`database not found` corriendo el script en tu computadora**
Corré `node configurar-base.mjs` y mirá qué dice.

**`You are not logged in`**
Falta el paso 1: `npx wrangler login`.

**El panel me pide contraseña y ninguna funciona**
Falta el paso 3. Ojo: después de poner el secreto hay que volver a hacer
`npx wrangler deploy` para que tome efecto.

**Quiero ver qué está pasando en el servidor**
```bash
npx wrangler tail
```
Muestra en vivo lo que ocurre. Cerralo con Ctrl+C.

---

## Preguntas que te van a surgir

**¿Cuánto cuesta?**
Nada. El plan gratuito de Cloudflare D1 incluye 5 GB y 5 millones de lecturas
por día. Vas a usar una fracción mínima.

**¿Y si quiero mandarles un mail a todos?**
Bajá el CSV con el botón del panel y subilo a cualquier servicio de envío
(Brevo y Mailchimp tienen plan gratis). Cuando llegues a ese punto, avisame.

**¿Alguien puede entrar al panel sin la clave?**
No. Y si nunca configurás `PANEL_CLAVE`, el panel queda cerrado para todos,
incluido vos. Está hecho así a propósito.

**¿Y los robots que llenan formularios?**
Hay un campo invisible que las personas nunca ven. Si viene completo, el
servidor descarta el envío y responde como si todo hubiera salido bien, para
que el robot no siga probando.
