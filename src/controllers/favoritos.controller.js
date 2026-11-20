const db = require('../db/database');
const HttpError = require('../utils/httpError');
const { parseId } = require('../utils/validators');

// GET /api/favoritos -> solo los del usuario del token
function listar(req, res) {
  const filas = db
    .prepare(
      `SELECT p.id, p.nombre, p.descripcion, p.categoria, p.precio, f.creado_en AS agregado_en
         FROM favoritos f JOIN productos p ON p.id = f.producto_id
        WHERE f.usuario_id = ? ORDER BY f.creado_en, p.id`
    )
    .all(req.usuario.id);
  res.status(200).json({ ok: true, total: filas.length, data: filas });
}

// POST /api/favoritos  { "productoId": 3 }
function agregar(req, res) {
  // El usuario NUNCA viene del cliente: se toma de req.usuario (token verificado).
  const productoId = parseId(req.body && req.body.productoId);
  if (productoId === null) {
    throw new HttpError(400, 'Datos inválidos.', ['productoId debe ser un entero positivo.']);
  }
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(productoId);
  if (!producto) throw new HttpError(404, 'El producto no existe.');

  const ya = db
    .prepare('SELECT 1 FROM favoritos WHERE usuario_id = ? AND producto_id = ?')
    .get(req.usuario.id, productoId);
  if (ya) throw new HttpError(409, 'El producto ya está en sus favoritos.');

  db.prepare('INSERT INTO favoritos (usuario_id, producto_id) VALUES (?, ?)').run(req.usuario.id, productoId);
  res.status(201).json({ ok: true, data: producto });
}

// DELETE /api/favoritos/:productoId -> solo borra el favorito del propio usuario
function quitar(req, res) {
  const productoId = parseId(req.params.productoId);
  if (productoId === null) throw new HttpError(400, 'El identificador debe ser un entero positivo.');

  const info = db
    .prepare('DELETE FROM favoritos WHERE usuario_id = ? AND producto_id = ?')
    .run(req.usuario.id, productoId);
  if (info.changes === 0) throw new HttpError(404, 'Ese producto no está en sus favoritos.');
  res.status(200).json({ ok: true, mensaje: 'Favorito eliminado.' });
}

module.exports = { listar, agregar, quitar };
