const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getColeccion, getFaltantes, getIntercambiables,
  agregarLamina, cambiarEstado, eliminarLamina, getProgreso,
} = require('../controllers/coleccionController');

router.use(authMiddleware);

router.get('/', getColeccion);
router.get('/faltantes', getFaltantes);
router.get('/intercambiables', getIntercambiables);
router.get('/progreso', getProgreso);
router.post('/agregar', agregarLamina);
router.put('/:id/estado', cambiarEstado);
router.delete('/:id', eliminarLamina);

module.exports = router;
