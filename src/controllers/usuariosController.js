const pool = require('../config/db');

const buscarUsuarios = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'La busqueda debe tener al menos 2 caracteres' });
    }

    const result = await pool.query(
      `SELECT id, nombre, email, pais, foto_perfil FROM usuarios
       WHERE id != $1 AND (LOWER(nombre) LIKE LOWER($2) OR LOWER(email) LIKE LOWER($2))
       LIMIT 20`,
      [userId, `%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getIntercambiablesUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT cu.lamina_id, l.nombre_sticker, l.foto_url, l.posicion, l.es_especial, l.iso3,
              p.pais, p.grupo
       FROM coleccion_usuario cu
       JOIN laminas_panini_2026 l ON cu.lamina_id = l.id
       JOIN paises_mundial_2026 p ON l.iso3 = p.iso3
       WHERE cu.usuario_id = $1 AND cu.estado = 'intercambiable'
       ORDER BY l.iso3`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { buscarUsuarios, getIntercambiablesUsuario };
