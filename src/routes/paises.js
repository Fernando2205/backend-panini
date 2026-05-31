const express = require('express');
const router = express.Router();
const { getAllPaises, getPaisesByGrupo, getPaisByIso3, getGrupos } = require('../controllers/paisesController');

router.get('/', getAllPaises);
router.get('/grupos', getGrupos);
router.get('/grupo/:grupo', getPaisesByGrupo);
router.get('/:iso3', getPaisByIso3);

module.exports = router;
