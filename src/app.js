const express = require('express');
const { noEncontrada, manejadorErrores } = require('./middleware/errores');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/api/salud', (_req, res) => res.status(200).json({ ok: true, mensaje: 'API en funcionamiento' }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/favoritos', require('./routes/favoritos.routes'));

app.use(noEncontrada);
app.use(manejadorErrores);

module.exports = app;
