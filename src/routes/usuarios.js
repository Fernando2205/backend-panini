const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { buscarUsuarios, getIntercambiablesUsuario } = require('../controllers/usuariosController');

router.use(authMiddleware);

router.get('/buscar', buscarUsuarios);
router.get('/:id/intercambiables', getIntercambiablesUsuario);

module.exports = router;
