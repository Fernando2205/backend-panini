const pool = require('../config/db');

const getAllPaises = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM paises_mundial_2026 ORDER BY grupo, pais');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getPaisesByGrupo = async (req, res, next) => {
  try {
    const { grupo } = req.params;
    const result = await pool.query(
      'SELECT * FROM paises_mundial_2026 WHERE grupo = $1 ORDER BY pais',
      [grupo.toUpperCase()]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getPaisByIso3 = async (req, res, next) => {
  try {
    const { iso3 } = req.params;
    const result = await pool.query(
      'SELECT * FROM paises_mundial_2026 WHERE iso3 = $1',
      [iso3.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pais no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getGrupos = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT grupo, json_agg(json_build_object('iso3', iso3, 'pais', pais)) as paises
       FROM paises_mundial_2026 GROUP BY grupo ORDER BY grupo`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllPaises, getPaisesByGrupo, getPaisByIso3, getGrupos };
