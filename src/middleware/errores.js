const HttpError = require('../utils/httpError');

const noEncontrada = (req, _res, next) =>
  next(new HttpError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));

// Manejador central: respuestas de error en JSON, sin exponer detalles internos.
// eslint-disable-next-line no-unused-vars
const manejadorErrores = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const cuerpo = { ok: false, error: err.message };
    if (err.detalles) cuerpo.detalles = err.detalles;
    return res.status(err.status).json(cuerpo);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, error: 'El cuerpo de la petición no es un JSON válido.' });
  }
  console.error(err); // el detalle solo queda en el log del servidor
  res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
};

module.exports = { noEncontrada, manejadorErrores };
