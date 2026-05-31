const pool = require('../config/db');

const crearIntercambio = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { usuario_recibe, tipo, punto_encuentro, latitud, longitud, laminas_ofrece, laminas_recibe } = req.body;

    if (!usuario_recibe || !tipo || !laminas_ofrece || !laminas_recibe) {
      return res.status(400).json({ error: 'Campos requeridos: usuario_recibe, tipo, laminas_ofrece, laminas_recibe' });
    }

    if (userId === usuario_recibe) {
      return res.status(400).json({ error: 'No puedes crear un intercambio contigo mismo' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO intercambios (usuario_ofrece, usuario_recibe, tipo, punto_encuentro, latitud, longitud, estado)
         VALUES ($1, $2, $3, $4, $5, $6, 'pendiente') RETURNING *`,
        [userId, usuario_recibe, tipo, punto_encuentro || null, latitud || null, longitud || null]
      );
      const intercambio = result.rows[0];

      for (const laminaId of laminas_ofrece) {
        await client.query(
          `INSERT INTO intercambio_laminas (intercambio_id, lamina_id, tipo) VALUES ($1, $2, 'ofrece')`,
          [intercambio.id, laminaId]
        );
      }

      for (const laminaId of laminas_recibe) {
        await client.query(
          `INSERT INTO intercambio_laminas (intercambio_id, lamina_id, tipo) VALUES ($1, $2, 'recibe')`,
          [intercambio.id, laminaId]
        );
      }

      await client.query('COMMIT');

      const intercambioCompleto = await getDetalleIntercambio(intercambio.id);
      res.status(201).json(intercambioCompleto);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

const getMisIntercambios = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { estado } = req.query;

    let query = `SELECT i.*,
      u1.nombre as nombre_ofrece, u2.nombre as nombre_recibe
      FROM intercambios i
      JOIN usuarios u1 ON i.usuario_ofrece = u1.id
      JOIN usuarios u2 ON i.usuario_recibe = u2.id
      WHERE (i.usuario_ofrece = $1 OR i.usuario_recibe = $1)`;
    const params = [userId];

    if (estado) {
      query += ` AND i.estado = $2`;
      params.push(estado);
    }

    query += ` ORDER BY i.fecha_creacion DESC`;

    const result = await pool.query(query, params);

    const intercambios = [];
    for (const row of result.rows) {
      const detalle = await getDetalleIntercambio(row.id);
      intercambios.push({ ...row, ...detalle });
    }

    res.json(intercambios);
  } catch (error) {
    next(error);
  }
};

const getIntercambioById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT i.*, u1.nombre as nombre_ofrece, u2.nombre as nombre_recibe
       FROM intercambios i
       JOIN usuarios u1 ON i.usuario_ofrece = u1.id
       JOIN usuarios u2 ON i.usuario_recibe = u2.id
       WHERE i.id = $1 AND (i.usuario_ofrece = $2 OR i.usuario_recibe = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Intercambio no encontrado' });
    }

    const detalle = await getDetalleIntercambio(id);
    res.json({ ...result.rows[0], ...detalle });
  } catch (error) {
    next(error);
  }
};

const aceptarIntercambio = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE intercambios SET estado = 'aceptado'
       WHERE id = $1 AND usuario_recibe = $2 AND estado = 'pendiente' RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No se puede aceptar este intercambio' });
    }

    res.json({ message: 'Intercambio aceptado', intercambio: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const rechazarIntercambio = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE intercambios SET estado = 'rechazado'
       WHERE id = $1 AND usuario_recibe = $2 AND estado = 'pendiente' RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No se puede rechazar este intercambio' });
    }

    res.json({ message: 'Intercambio rechazado', intercambio: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const completarIntercambio = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const intercambio = await pool.query(
      'SELECT * FROM intercambios WHERE id = $1 AND estado = $2',
      [id, 'aceptado']
    );

    if (intercambio.rows.length === 0) {
      return res.status(400).json({ error: 'El intercambio no esta aceptado' });
    }

    const intData = intercambio.rows[0];
    if (intData.usuario_ofrece !== userId && intData.usuario_recibe !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para completar este intercambio' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const laminasOfrece = await client.query(
        `SELECT lamina_id FROM intercambio_laminas WHERE intercambio_id = $1 AND tipo = 'ofrece'`,
        [id]
      );
      const laminasRecibe = await client.query(
        `SELECT lamina_id FROM intercambio_laminas WHERE intercambio_id = $1 AND tipo = 'recibe'`,
        [id]
      );

      for (const lamina of laminasOfrece.rows) {
        const existeOfrece = await client.query(
          `SELECT id FROM coleccion_usuario WHERE usuario_id = $1 AND lamina_id = $2 AND estado = 'coleccion'`,
          [intData.usuario_recibe, lamina.lamina_id]
        );
        if (existeOfrece.rows.length === 0) {
          await client.query(
            `INSERT INTO coleccion_usuario (usuario_id, lamina_id, estado) VALUES ($1, $2, 'coleccion')`,
            [intData.usuario_recibe, lamina.lamina_id]
          );
        } else {
          await client.query(
            `INSERT INTO coleccion_usuario (usuario_id, lamina_id, estado) VALUES ($1, $2, 'intercambiable')`,
            [intData.usuario_recibe, lamina.lamina_id]
          );
        }

        await client.query(
          `DELETE FROM coleccion_usuario WHERE id = (
            SELECT id FROM coleccion_usuario WHERE usuario_id = $1 AND lamina_id = $2 LIMIT 1
          )`,
          [intData.usuario_ofrece, lamina.lamina_id]
        );
      }

      for (const lamina of laminasRecibe.rows) {
        const existeRecibe = await client.query(
          `SELECT id FROM coleccion_usuario WHERE usuario_id = $1 AND lamina_id = $2 AND estado = 'coleccion'`,
          [intData.usuario_ofrece, lamina.lamina_id]
        );
        if (existeRecibe.rows.length === 0) {
          await client.query(
            `INSERT INTO coleccion_usuario (usuario_id, lamina_id, estado) VALUES ($1, $2, 'coleccion')`,
            [intData.usuario_ofrece, lamina.lamina_id]
          );
        } else {
          await client.query(
            `INSERT INTO coleccion_usuario (usuario_id, lamina_id, estado) VALUES ($1, $2, 'intercambiable')`,
            [intData.usuario_ofrece, lamina.lamina_id]
          );
        }

        await client.query(
          `DELETE FROM coleccion_usuario WHERE id = (
            SELECT id FROM coleccion_usuario WHERE usuario_id = $1 AND lamina_id = $2 LIMIT 1
          )`,
          [intData.usuario_recibe, lamina.lamina_id]
        );
      }

      await client.query(
        `UPDATE intercambios SET estado = 'completado', fecha_completado = NOW() WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');
      res.json({ message: 'Intercambio completado exitosamente' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

const enviarMensaje = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { mensaje } = req.body;

    if (!mensaje) {
      return res.status(400).json({ error: 'Mensaje es requerido' });
    }

    const intercambio = await pool.query(
      'SELECT * FROM intercambios WHERE id = $1 AND (usuario_ofrece = $2 OR usuario_recibe = $2)',
      [id, userId]
    );

    if (intercambio.rows.length === 0) {
      return res.status(404).json({ error: 'Intercambio no encontrado' });
    }

    const result = await pool.query(
      `INSERT INTO mensajes_intercambio (intercambio_id, usuario_id, mensaje)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, userId, mensaje]
    );

    const mensajeData = await pool.query(
      `SELECT m.*, u.nombre FROM mensajes_intercambio m
       JOIN usuarios u ON m.usuario_id = u.id WHERE m.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(mensajeData.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getMensajes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const intercambio = await pool.query(
      'SELECT * FROM intercambios WHERE id = $1 AND (usuario_ofrece = $2 OR usuario_recibe = $2)',
      [id, userId]
    );

    if (intercambio.rows.length === 0) {
      return res.status(404).json({ error: 'Intercambio no encontrado' });
    }

    const result = await pool.query(
      `SELECT m.*, u.nombre FROM mensajes_intercambio m
       JOIN usuarios u ON m.usuario_id = u.id
       WHERE m.intercambio_id = $1 ORDER BY m.fecha ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

async function getDetalleIntercambio(intercambioId) {
  const ofrece = await pool.query(
    `SELECT il.lamina_id, l.nombre_sticker, l.foto_url, l.iso3
     FROM intercambio_laminas il
     JOIN laminas_panini_2026 l ON il.lamina_id = l.id
     WHERE il.intercambio_id = $1 AND il.tipo = 'ofrece'`,
    [intercambioId]
  );

  const recibe = await pool.query(
    `SELECT il.lamina_id, l.nombre_sticker, l.foto_url, l.iso3
     FROM intercambio_laminas il
     JOIN laminas_panini_2026 l ON il.lamina_id = l.id
     WHERE il.intercambio_id = $1 AND il.tipo = 'recibe'`,
    [intercambioId]
  );

  const mensajes = await pool.query(
    `SELECT m.*, u.nombre FROM mensajes_intercambio m
     JOIN usuarios u ON m.usuario_id = u.id
     WHERE m.intercambio_id = $1 ORDER BY m.fecha ASC`,
    [intercambioId]
  );

  return {
    laminas_ofrece: ofrece.rows,
    laminas_recibe: recibe.rows,
    mensajes: mensajes.rows,
  };
}

module.exports = {
  crearIntercambio, getMisIntercambios, getIntercambioById,
  aceptarIntercambio, rechazarIntercambio, completarIntercambio,
  enviarMensaje, getMensajes,
};
