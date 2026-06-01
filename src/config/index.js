require('dotenv').config();

const config = {
  development: {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    corsOrigin: '*',
    nodeEnv: 'development',
    useSSL: false
  },
  production: {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    nodeEnv: 'production',
    useSSL: true
  }
};

const env = process.env.NODE_ENV || 'development';
const currentConfig = config[env];

console.log(`[Config] Entorno: ${env.toUpperCase()}`);
console.log(`[Config] Puerto: ${currentConfig.port}`);
console.log(`[Config] BD: ${currentConfig.databaseUrl ? 'Configurada' : 'NO CONFIGURADA'}`);
console.log(`[Config] SSL: ${currentConfig.useSSL ? 'Habilitado' : 'Deshabilitado'}`);

module.exports = currentConfig;
