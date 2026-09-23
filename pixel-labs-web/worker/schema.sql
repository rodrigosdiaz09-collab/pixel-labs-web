-- Tabla de contactos de Pixel Labs.
-- Se crea una sola vez con el comando que está en LEEME-CONTACTOS.md

CREATE TABLE IF NOT EXISTS leads (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre   TEXT,
  email    TEXT NOT NULL,
  tipo     TEXT,
  medida   TEXT,
  mensaje  TEXT,
  origen   TEXT,               -- formulario | novedades | probador
  creado   TEXT NOT NULL       -- fecha y hora en UTC
);

-- Para que el panel ordene rápido aunque la lista crezca.
CREATE INDEX IF NOT EXISTS idx_leads_creado ON leads (creado DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email  ON leads (email);

-- Control de abuso: cuántas veces vino la misma IP en los últimos minutos.
-- Sirve para frenar a quien inunde el formulario o pruebe contraseñas.
-- No guarda la IP: guarda un hash, que alcanza para contar y no es un dato
-- personal. Se limpia sola (borra lo de más de un día).
--
-- Si esta tabla no existe, el worker la crea solo la primera vez que la
-- necesita. Está acá para que una instalación nueva ya la tenga.
CREATE TABLE IF NOT EXISTS frenos (
  clave  TEXT NOT NULL,       -- hash de "tipo|IP"
  cuando TEXT NOT NULL        -- fecha y hora en UTC
);
CREATE INDEX IF NOT EXISTS idx_frenos ON frenos (clave, cuando);
