const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Registro duplicado' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia invalida' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
};

module.exports = errorHandler;
