// KDS Backend
//   - Express REST API
//   - Socket.IO for real-time: new_order, order_status_update
//   - Serves the built client in production (single deployable artifact)
//
// Rooms:
//   role:server    -> server phones get every status update
//   role:kitchen   -> kitchen display gets new_order events
//   role:admin     -> admin dashboard gets everything
//
// Each socket joins one role-room. Clients also re-emit a "subscribe" event
// on connect to be safe (in case the auth handshake racing drops the first msg).

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server: IOServer } = require('socket.io');
const jwt = require('jsonwebtoken');

// Database (also seeds on first run).
const db = require('./db');
const { SECRET } = require('./middleware/auth');

const authRoutes  = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const menuRoutes  = require('./routes/menu');
const reportRoutes = require('./routes/reports');

const PORT = parseInt(process.env.PORT, 10) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

// Tiny request log
app.use((req, _res, next) => {
  console.log(`[api] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/auth',    authRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/menu',    menuRoutes);
app.use('/api/reports', reportRoutes);

// Serve the React build if present (single-host deploy).
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  console.log('[srv] serving client build from', clientDist);
} else {
  console.log('[srv] no client build found at', clientDist, '- run `npm --prefix client run build` to enable static serving.');
}

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
  // Bigger payload limit for safety on big orders
  maxHttpBufferSize: 1e6
});

// --- Socket.IO auth + rooms ----------------------------------------------
io.use((socket, next) => {
  // Token can arrive via auth.token (recommended) or query.token
  const token = (socket.handshake.auth && socket.handshake.auth.token) ||
                socket.handshake.query?.token;
  if (!token) return next(new Error('missing_token'));
  try {
    const user = jwt.verify(token, SECRET);
    socket.user = user;
    next();
  } catch (e) {
    next(new Error('invalid_token'));
  }
});

io.on('connection', (socket) => {
  const role = socket.user?.role || 'guest';
  socket.join(`role:${role}`);
  console.log(`[ws] connect ${socket.id} as ${role} (${socket.user?.name || '?'})`);

  // Allow client to (re)subscribe explicitly.
  socket.on('subscribe', () => {
    socket.join(`role:${socket.user?.role}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[ws] disconnect ${socket.id} (${reason})`);
  });
});

// Broadcast helper that route handlers call via app.locals.broadcast
app.locals.broadcast = (event, payload) => {
  // KDS-relevant: new orders go to kitchen + admin.
  // Status updates go everywhere (servers care when an order is Ready).
  if (event === 'new_order') {
    io.to('role:kitchen').to('role:admin').emit(event, payload);
  } else {
    io.emit(event, payload);
  }
  console.log(`[ws] emit ${event} order=${payload?.id} status=${payload?.status}`);
};

server.listen(PORT, HOST, () => {
  const lan = server.address();
  console.log(`[srv] kds-api listening on http://${HOST}:${PORT}`);
  console.log(`[srv] LAN URL hint: open the client with the API base set to this address.`);
});
