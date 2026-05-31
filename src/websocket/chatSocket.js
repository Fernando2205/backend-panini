const pool = require('../config/db');

const setupWebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('join_intercambio', (intercambioId) => {
      socket.join(`intercambio_${intercambioId}`);
      console.log(`Socket ${socket.id} unido a intercambio ${intercambioId}`);
    });

    socket.on('leave_intercambio', (intercambioId) => {
      socket.leave(`intercambio_${intercambioId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { intercambio_id, usuario_id, mensaje } = data;

        const result = await pool.query(
          `INSERT INTO mensajes_intercambio (intercambio_id, usuario_id, mensaje)
           VALUES ($1, $2, $3) RETURNING *`,
          [intercambio_id, usuario_id, mensaje]
        );

        const mensajeData = await pool.query(
          `SELECT m.*, u.nombre FROM mensajes_intercambio m
           JOIN usuarios u ON m.usuario_id = u.id WHERE m.id = $1`,
          [result.rows[0].id]
        );

        io.to(`intercambio_${intercambio_id}`).emit('new_message', mensajeData.rows[0]);
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });

    socket.on('intercambio_update', (data) => {
      const { intercambio_id, estado } = data;
      io.to(`intercambio_${intercambio_id}`).emit('intercambio_status_changed', {
        intercambio_id,
        estado,
      });
    });

    socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
    });
  });
};

module.exports = setupWebSocket;
