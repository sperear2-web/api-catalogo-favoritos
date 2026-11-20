const router = require('express').Router();
const { autenticar } = require('../middleware/auth');
const c = require('../controllers/favoritos.controller');

router.use(autenticar); // todas las rutas requieren token válido

router.get('/', c.listar);
router.post('/', c.agregar);
router.delete('/:productoId', c.quitar);

module.exports = router;
