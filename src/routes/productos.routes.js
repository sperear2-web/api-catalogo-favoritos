const router = require('express').Router();
const { autenticar, requerirRol } = require('../middleware/auth');
const c = require('../controllers/productos.controller');

// Consulta pública
router.get('/', c.listar);
router.get('/:id', c.obtener);

// Solo administrador
router.post('/', autenticar, requerirRol('admin'), c.crear);
router.put('/:id', autenticar, requerirRol('admin'), c.actualizar);
router.delete('/:id', autenticar, requerirRol('admin'), c.eliminar);

module.exports = router;
