const pool = require('../config/db');

const getColeccion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT cu.*, l.nombre_sticker, l.foto_url, l.posicion, l.es_especial, l.iso3,
              p.pais, p.grupo
       FROM coleccion_usuario cu
       JOIN laminas_panini_2026 l ON cu.lamina_id = l.id
       JOIN paises_mundial_2026 p ON l.iso3 = p.iso3
       WHERE cu.usuario_id = $1
       ORDER BY l.iso3, CAST(SUBSTRING(l.id FROM '[0-9]+') AS INTEGER)`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getFaltantes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT l.*, p.pais, p.grupo FROM laminas_panini_2026 l
       JOIN paises_mundial_2026 p ON l.iso3 = p.iso3
       WHERE l.id NOT IN (
         SELECT lamina_id FROM coleccion_usuario WHERE usuario_id = $1 AND estado = 'coleccion'
       )
       ORDER BY l.iso3, CAST(SUBSTRING(l.id FROM '[0-9]+') AS INTEGER)`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getIntercambiables = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT cu.*, l.nombre_sticker, l.foto_url, l.posicion, l.es_especial, l.iso3,
              p.pais, p.grupo
       FROM coleccion_usuario cu
       JOIN laminas_panini_2026 l ON cu.lamina_id = l.id
       JOIN paises_mundial_2026 p ON l.iso3 = p.iso3
       WHERE cu.usuario_id = $1 AND cu.estado = 'intercambiable'
       ORDER BY l.iso3`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const agregarLamina = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { lamina_id } = req.body;

    if (!lamina_id) {
      return res.status(400).json({ error: 'lamina_id es requerido' });
    }

    const laminaCheck = await pool.query('SELECT id FROM laminas_panini_2026 WHERE id = $1', [lamina_id.toUpperCase()]);
    if (laminaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lamina no existe' });
    }

    const existing = await pool.query(
      'SELECT * FROM coleccion_usuario WHERE usuario_id = $1 AND lamina_id = $2 AND estado = $3',
      [userId, lamina_id.toUpperCase(), 'coleccion']
    );

    if (existing.rows.length > 0) {
      const intercambiable = await pool.query(
        `INSERT INTO coleccion_usuario (usuario_id, lamina_id, estado) VALUES ($1, $2, 'intercambiable')
         RETURNING *`,
        [userId, lamina_id.toUpperCase()]
      );
      return res.status(201).json({
        message: 'Lamina ya esta en coleccion, agregada como intercambiable',
        lamina: intercambiable.rows[0],
      });
    }

    const result = await pool.query(
      `INSERT INTO coleccion_usuario (usuario_id, lamina_id, estado) VALUES ($1, $2, 'coleccion')
       RETURNING *`,
      [userId, lamina_id.toUpperCase()]
    );

    res.status(201).json({
      message: 'Lamina agregada a la coleccion',
      lamina: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { estado } = req.body;

    if (!['coleccion', 'intercambiable'].includes(estado)) {
      return res.status(400).json({ error: 'Estado debe ser coleccion o intercambiable' });
    }

    const result = await pool.query(
      'UPDATE coleccion_usuario SET estado = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *',
      [estado, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const eliminarLamina = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM coleccion_usuario WHERE id = $1 AND usuario_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Lamina eliminada' });
  } catch (error) {
    next(error);
  }
};

const getProgreso = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const totalResult = await pool.query('SELECT COUNT(*) FROM laminas_panini_2026');
    const total = parseInt(totalResult.rows[0].count);

    const coleccionResult = await pool.query(
      `SELECT COUNT(DISTINCT lamina_id) FROM coleccion_usuario
       WHERE usuario_id = $1 AND estado = 'coleccion'`,
      [userId]
    );
    const coleccion = parseInt(coleccionResult.rows[0].count);

    const intercambiablesResult = await pool.query(
      `SELECT COUNT(*) FROM coleccion_usuario
       WHERE usuario_id = $1 AND estado = 'intercambiable'`,
      [userId]
    );
    const intercambiables = parseInt(intercambiablesResult.rows[0].count);

    const porPaisResult = await pool.query(
      `SELECT p.iso3, p.pais, p.grupo,
              COUNT(DISTINCT cu.lamina_id) as obtenidas,
              (SELECT COUNT(*) FROM laminas_panini_2026 WHERE iso3 = p.iso3) as total
       FROM paises_mundial_2026 p
       LEFT JOIN coleccion_usuario cu ON cu.lamina_id LIKE p.iso3 || '%' AND cu.usuario_id = $1 AND cu.estado = 'coleccion'
       GROUP BY p.iso3, p.pais, p.grupo
       ORDER BY p.grupo, p.pais`,
      [userId]
    );

    res.json({
      total,
      coleccion,
      faltantes: total - coleccion,
      intercambiables,
      porcentaje: total > 0 ? Math.round((coleccion / total) * 100) : 0,
      por_pais: porPaisResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getColeccion, getFaltantes, getIntercambiables, agregarLamina, cambiarEstado, eliminarLamina, getProgreso };
