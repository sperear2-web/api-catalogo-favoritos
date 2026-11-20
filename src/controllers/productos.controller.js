const db = require('../db/database');
const HttpError = require('../utils/httpError');
const { esTextoNoVacio, esPrecioValido, parseId } = require('../utils/validators');

// Valida y limita los campos aceptados (el cliente no puede enviar nada más).
function validarProducto(body) {
  const { nombre, descripcion, categoria, precio } = body || {};
  const errores = [];
  if (!esTextoNoVacio(nombre, 150)) errores.push('nombre es obligatorio (máx. 150 caracteres).');
  if (!esTextoNoVacio(descripcion, 1000)) errores.push('descripcion es obligatoria (máx. 1000 caracteres).');
  if (!esTextoNoVacio(categoria, 60)) errores.push('categoria es obligatoria (máx. 60 caracteres).');
  if (!esPrecioValido(precio)) errores.push('precio debe ser un número mayor que cero.');
  if (errores.length) throw new HttpError(400, 'Datos inválidos.', errores);
  return {
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    categoria: categoria.trim(),
    precio: Math.round(precio * 100) / 100,
  };
}

const idDeParametro = (valor) => {
  const id = parseId(valor);
  if (id === null) throw new HttpError(400, 'El identificador debe ser un entero positivo.');
  return id;
};

const buscar = (id) => db.prepare('SELECT * FROM productos WHERE id = ?').get(id);

// GET /api/productos?categoria=Audio
function listar(req, res) {
  const { categoria } = req.query;
  const filas = categoria
    ? db.prepare('SELECT * FROM productos WHERE categoria = ? COLLATE NOCASE ORDER BY id').all(String(categoria))
    : db.prepare('SELECT * FROM productos ORDER BY id').all();
  res.status(200).json({ ok: true, total: filas.length, data: filas });
}

// GET /api/productos/:id
function obtener(req, res) {
  const producto = buscar(idDeParametro(req.params.id));
  if (!producto) throw new HttpError(404, 'Producto no encontrado.');
  res.status(200).json({ ok: true, data: producto });
}

// POST /api/productos (admin)
function crear(req, res) {
  const p = validarProducto(req.body);
  const info = db
    .prepare('INSERT INTO productos (nombre, descripcion, categoria, precio) VALUES (?, ?, ?, ?)')
    .run(p.nombre, p.descripcion, p.categoria, p.precio);
  res.status(201).json({ ok: true, data: buscar(info.lastInsertRowid) });
}

// PUT /api/productos/:id (admin)
function actualizar(req, res) {
  const id = idDeParametro(req.params.id);
  if (!buscar(id)) throw new HttpError(404, 'Producto no encontrado.');
  const p = validarProducto(req.body);
  db.prepare('UPDATE productos SET nombre = ?, descripcion = ?, categoria = ?, precio = ? WHERE id = ?').run(
    p.nombre, p.descripcion, p.categoria, p.precio, id
  );
  res.status(200).json({ ok: true, data: buscar(id) });
}

// DELETE /api/productos/:id (admin). Los favoritos asociados se eliminan en cascada.
function eliminar(req, res) {
  const id = idDeParametro(req.params.id);
  const info = db.prepare('DELETE FROM productos WHERE id = ?').run(id);
  if (info.changes === 0) throw new HttpError(404, 'Producto no encontrado.');
  res.status(200).json({ ok: true, mensaje: 'Producto eliminado. Sus favoritos asociados también se eliminaron.' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
