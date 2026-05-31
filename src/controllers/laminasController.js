const pool = require('../config/db');

const getAllLaminas = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT l.*, p.pais, p.grupo FROM laminas_panini_2026 l
       JOIN paises_mundial_2026 p ON l.iso3 = p.iso3
       ORDER BY l.iso3, CAST(SUBSTRING(l.id FROM '[0-9]+') AS INTEGER)`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getLaminasByPais = async (req, res, next) => {
  try {
    const { iso3 } = req.params;
    const result = await pool.query(
      `SELECT l.*, p.pais, p.grupo FROM laminas_panini_2026 l
       JOIN paises_mundial_2026 p ON l.iso3 = p.iso3
       WHERE l.iso3 = $1
       ORDER BY CAST(SUBSTRING(l.id FROM '[0-9]+') AS INTEGER)`,
      [iso3.toUpperCase()]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getLaminaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT l.*, p.pais, p.grupo FROM laminas_panini_2026 l
       JOIN paises_mundial_2026 p ON l.iso3 = p.iso3
       WHERE l.id = $1`,
      [id.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lamina no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const searchLaminas = async (req, res, next) => {
  try {
    const { q } = req.query;
    const result = await pool.query(
      `SELECT l.*, p.pais, p.grupo FROM laminas_panini_2026 l
       JOIN paises_mundial_2026 p ON l.iso3 = p.iso3
       WHERE LOWER(l.nombre_sticker) LIKE LOWER($1) OR LOWER(l.id) LIKE LOWER($1)
       ORDER BY l.iso3 LIMIT 50`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllLaminas, getLaminasByPais, getLaminaById, searchLaminas };
