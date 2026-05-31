const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  crearIntercambio, getMisIntercambios, getIntercambioById,
  aceptarIntercambio, rechazarIntercambio, completarIntercambio,
  enviarMensaje, getMensajes,
} = require('../controllers/intercambiosController');

router.use(authMiddleware);

router.post('/', crearIntercambio);
router.get('/', getMisIntercambios);
router.get('/:id', getIntercambioById);
router.put('/:id/aceptar', aceptarIntercambio);
router.put('/:id/rechazar', rechazarIntercambio);
router.put('/:id/completar', completarIntercambio);
router.post('/:id/mensajes', enviarMensaje);
router.get('/:id/mensajes', getMensajes);

module.exports = router;
