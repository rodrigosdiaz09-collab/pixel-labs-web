# Base de contactos — cómo activarla

Esto se hace **una sola vez**. Después funciona solo.

Hasta que termines estos pasos, el sitio anda igual que siempre, pero el
formulario no guarda nada: solo abre WhatsApp.

Todos los comandos se escriben parado en la carpeta del sitio
(la misma donde está `wrangler.jsonc`).

---

## Paso 1 — Crear la base

```bash
npx wrangler d1 create pixel-labs-leads
```

Al terminar te va a mostrar algo así:

```
[[d1_databases]]
binding = "DB"
database_name = "pixel-labs-leads"
database_id = "a1b2c3d4-5678-90ab-cdef-1234567890ab"
```

**Copiá ese `database_id`.**

## Paso 2 — Pegar el id en la configuración

Abrí `wrangler.jsonc` y reemplazá el texto
`PEGAR_ACA_EL_ID_QUE_TE_DA_CLOUDFLARE` por el id que copiaste.
Tiene que quedar entre comillas, así:

```jsonc
"database_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
```

## Paso 3 — Crear la tabla

```bash
npx wrangler d1 execute pixel-labs-leads --remote --file=worker/schema.sql
```

Te va a pedir confirmación. Poné que sí.

## Paso 4 — Elegir la clave del panel

Es la contraseña para entrar a ver los contactos. Elegí una que no uses
en otro lado.

```bash
npx wrangler secret put PANEL_CLAVE
```

Te la pide por teclado y **no se ve mientras la escribís**. Es normal.
Apretá Enter cuando termines.

> Esta clave no queda guardada en ningún archivo del proyecto, así que
> anotala donde guardes tus contraseñas. Si te la olvidás, corré el mismo
> comando de nuevo y poné una nueva.

## Paso 5 — Publicar

```bash
npx wrangler deploy
```

Listo.

---

## Cómo ver los contactos

Entrá a **https://pixellabs.com.ar/panel**

El navegador te va a pedir usuario y contraseña:

- **Usuario:** cualquier cosa (no se usa, poné `pixel`)
- **Contraseña:** la que pusiste en el paso 4

Ahí vas a ver la lista, un buscador y el botón **Descargar para Excel**.

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
ventana en el acto, el contacto ya está en tu base. Está probado: se simuló
a alguien cerrando la pestaña en el mismo instante de apretar enviar, y el
dato quedó igual.

---

## Preguntas que te van a surgir

**¿Cuánto cuesta?**
Nada. El plan gratuito de Cloudflare D1 incluye 5 GB y 5 millones de
lecturas por día. Vas a estar usando una fracción mínima de eso.

**¿Y si quiero mandarles un mail a todos?**
Bajá el CSV con el botón del panel y subilo a cualquier servicio de envío
(Brevo y Mailchimp tienen plan gratis). Cuando llegues a ese punto, avisame
y lo vemos.

**¿Alguien puede entrar al panel sin la clave?**
No. Y si nunca configurás `PANEL_CLAVE`, el panel queda cerrado para todos,
incluido vos. Está hecho a propósito así: sin clave, nadie entra.

**¿Y los robots que llenan formularios?**
Hay un campo invisible que las personas nunca ven. Si viene completo, el
servidor descarta el envío sin guardarlo y responde como si todo hubiera
salido bien, para que el robot no siga probando.

**Me equivoqué en algo y no anda.**
El sitio no se rompe: si la base falla, el formulario igual abre WhatsApp
como antes. Para ver qué pasó:

```bash
npx wrangler tail
```

Eso muestra en vivo lo que va pasando en el servidor.
