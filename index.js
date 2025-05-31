import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// ✅ CORS setup
app.use(cors({
  origin: ["https://roast-battle-arena-1.onrender.com"],
  credentials: true
}));

// ✅ Serve static files from "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Serve portal.html for the root "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// ✅ Optional fallback: serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const io = new Server(server, {
  cors: {
    origin: ["https://roast-battle-arena-1.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  connectionStateRecovery: {
    maxDisconnectionDuration: 10000
  }
});

let waitingUsers = new Map();
let activePairs = new Map();

io.on('connection', (socket) => {
  console.log('✅ New connection:', socket.id);

  socket.emit('connection_update', {
    status: 'connected',
    message: 'Server connection established'
  });

  // Matchmaking
  if (waitingUsers.size > 0) {
    const [firstUserId] = waitingUsers.keys();
    const partnerSocket = waitingUsers.get(firstUserId);

    activePairs.set(socket.id, partnerSocket.id);
    activePairs.set(partnerSocket.id, socket.id);

    socket.emit('chat_start', { partnerId: partnerSocket.id });
    partnerSocket.emit('chat_start', { partnerId: socket.id });

    waitingUsers.delete(firstUserId);
  } else {
    waitingUsers.set(socket.id, socket);
    socket.emit('waiting');
  }

  // Messaging
  socket.on('send_message', (msg) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) io.to(partnerId).emit('receive_message', msg);
  });

  socket.on('typing', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) io.to(partnerId).emit('partner_typing');
  });

  socket.on('stop_typing', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) io.to(partnerId).emit('partner_stopped_typing');
  });

  socket.on('skip_partner', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner_left', {
        reason: 'skipped',
        message: '💨 Poof! Your opponent vanished...'
      });
      activePairs.delete(partnerId);
    }
    activePairs.delete(socket.id);
    waitingUsers.set(socket.id, socket);
    socket.emit('waiting');
  });

  socket.on('disconnect', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner_left', {
        reason: 'disconnected',
        message: '💨 Opponent disconnected'
      });
      activePairs.delete(partnerId);
    }
    activePairs.delete(socket.id);
    waitingUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
