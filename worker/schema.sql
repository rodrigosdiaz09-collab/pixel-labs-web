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
