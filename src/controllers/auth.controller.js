const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/database');
const HttpError = require('../utils/httpError');
const { esTextoNoVacio, esCorreoValido } = require('../utils/validators');

// Hash falso para igualar el tiempo de respuesta cuando el correo no existe.
const HASH_FALSO = bcrypt.hashSync('contrasena-falsa', 10);

const usuarioPublico = (u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol });

// POST /api/auth/registro  -> siempre crea rol "usuario" (se ignora cualquier "rol" del cuerpo)
function registro(req, res) {
  const { nombre, correo, password } = req.body || {};
  const errores = [];
  if (!esTextoNoVacio(nombre, 100)) errores.push('nombre es obligatorio (máx. 100 caracteres).');
  if (!esCorreoValido(correo)) errores.push('correo no tiene un formato válido.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    errores.push('password es obligatoria (entre 8 y 72 caracteres).');
  }
  if (errores.length) throw new HttpError(400, 'Datos inválidos.', errores);

  const correoNorm = correo.trim().toLowerCase();
  if (db.prepare('SELECT 1 FROM usuarios WHERE correo = ?').get(correoNorm)) {
    throw new HttpError(409, 'El correo ya está registrado.');
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, 'usuario')")
    .run(nombre.trim(), correoNorm, hash);

  const usuario = db.prepare('SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ok: true, data: usuarioPublico(usuario) });
}

// POST /api/auth/login -> valida credenciales y emite JWT con vencimiento
function login(req, res) {
  const { correo, password } = req.body || {};
  if (!esCorreoValido(correo) || typeof password !== 'string' || password.length === 0) {
    throw new HttpError(400, 'Datos inválidos.', ['correo y password son obligatorios.']);
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo.trim().toLowerCase());
  const coincide = bcrypt.compareSync(password, usuario ? usuario.password_hash : HASH_FALSO);
  if (!usuario || !coincide) throw new HttpError(401, 'Credenciales incorrectas.');

  const token = jwt.sign({ sub: usuario.id, rol: usuario.rol }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });

  res.status(200).json({ ok: true, data: { token, tipo: 'Bearer', usuario: usuarioPublico(usuario) } });
}

module.exports = { registro, login };
