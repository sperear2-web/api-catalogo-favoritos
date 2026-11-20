-- Esquema de la base de datos (SQLite). Se ejecuta automáticamente al iniciar.

CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT    NOT NULL,
  correo        TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  rol           TEXT    NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
  creado_en     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS productos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT    NOT NULL,
  descripcion TEXT    NOT NULL,
  categoria   TEXT    NOT NULL,
  precio      REAL    NOT NULL CHECK (precio > 0),
  creado_en   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Un usuario no puede tener el mismo producto dos veces (clave primaria compuesta).
-- Al eliminar un producto (o un usuario) se eliminan sus favoritos (ON DELETE CASCADE).
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  creado_en   TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (usuario_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
