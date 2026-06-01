const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.useSSL ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log(`[DB] Conectado a PostgreSQL (${config.nodeEnv})`);
});

pool.on('error', (err) => {
  console.error('[DB] Error en PostgreSQL:', err);
});

module.exports = pool;
