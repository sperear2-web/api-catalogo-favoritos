const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/database');
const HttpError = require('../utils/httpError');

// Verifica firma y expiración del JWT. La identidad sale SIEMPRE del token verificado.
function autenticar(req, _res, next) {
  const cabecera = req.headers.authorization || '';
  const [esquema, token] = cabecera.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Token no proporcionado. Use el encabezado Authorization: Bearer <token>.'));
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    const mensaje = err.name === 'TokenExpiredError' ? 'El token ha expirado.' : 'Token inválido.';
    return next(new HttpError(401, mensaje));
  }

  // El usuario debe seguir existiendo; el rol se lee de la base (no se confía solo en el token).
  const usuario = db.prepare('SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?').get(payload.sub);
  if (!usuario) return next(new HttpError(401, 'Token inválido.'));

  req.usuario = usuario;
  next();
}

// Autorización por rol: 403 si el usuario autenticado no tiene el rol requerido.
const requerirRol = (...roles) => (req, _res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol)) {
    return next(new HttpError(403, 'No tiene permisos para realizar esta acción.'));
  }
  next();
};

module.exports = { autenticar, requerirRol };
