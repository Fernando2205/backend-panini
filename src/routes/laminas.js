const express = require('express');
const router = express.Router();
const { getAllLaminas, getLaminasByPais, getLaminaById, searchLaminas } = require('../controllers/laminasController');

router.get('/', getAllLaminas);
router.get('/search', searchLaminas);
router.get('/pais/:iso3', getLaminasByPais);
router.get('/:id', getLaminaById);

module.exports = router;
