const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

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
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/paises', paisesRoutes);
app.use('/api/laminas', laminasRoutes);
app.use('/api/coleccion', coleccionRoutes);
app.use('/api/intercambios', intercambiosRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Album Panini Mundial 2026 API' });
});

setupWebSocket(io);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
