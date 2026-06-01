const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./src/config');

const errorHandler = require('./src/middleware/errorHandler');
const setupWebSocket = require('./src/websocket/chatSocket');

const authRoutes = require('./src/routes/auth');
const paisesRoutes = require('./src/routes/paises');
const laminasRoutes = require('./src/routes/laminas');
const coleccionRoutes = require('./src/routes/coleccion');
const intercambiosRoutes = require('./src/routes/intercambios');
const usuariosRoutes = require('./src/routes/usuarios');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/paises', paisesRoutes);
app.use('/api/laminas', laminasRoutes);
app.use('/api/coleccion', coleccionRoutes);
app.use('/api/intercambios', intercambiosRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Album Panini Mundial 2026 API',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

setupWebSocket(io);

app.use(errorHandler);

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`\n[Server] Corriendo en puerto ${PORT}`);
  console.log(`[Server] Ambiente: ${config.nodeEnv.toUpperCase()}`);
  console.log(`[Server] URL: http://localhost:${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health\n`);
});
