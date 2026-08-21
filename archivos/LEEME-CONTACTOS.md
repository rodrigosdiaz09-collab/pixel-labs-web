# Base de contactos — cómo activarla

Esto se hace **una sola vez**. Después funciona solo.

Hasta que lo hagas, el sitio anda igual que siempre: el formulario abre
WhatsApp como antes. Lo único que falta es que además guarde el contacto.

Abrí la terminal **parado en la carpeta del sitio** (la que tiene `index.html`).
En VS Code: menú Terminal → Nueva terminal.

---

## Paso 1 — Conectarte a Cloudflare

```bash
npx wrangler login
```

Se abre el navegador y te pide autorizar. Si ya lo hiciste antes, salteá este paso.

## Paso 2 — Configurar la base (un solo comando)

```bash
node configurar-base.mjs
```

Esto hace todo solo: crea la base, escribe el identificador en
`wrangler.jsonc` y crea la tabla. Lo podés correr las veces que quieras;
si ya está hecho, no rompe nada.

Al terminar te va a decir que faltan los dos comandos de abajo.

## Paso 3 — Elegir la contraseña del panel

```bash
npx wrangler secret put PANEL_CLAVE
```

Te la pide por teclado y **no se ve mientras la escribís**. Es normal, no
está trabado. Escribila y apretá Enter.

> No queda guardada en ningún archivo del proyecto, así que anotala donde
> guardes tus contraseñas. Si te la olvidás, corré el mismo comando de nuevo
> y poné una nueva.

## Paso 4 — Publicar

```bash
npx wrangler deploy
```

Listo.

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

**`database not found` o `Couldn't find DB database`**
No corriste el paso 2, o falló. Corré `node configurar-base.mjs` y mirá qué dice.

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
