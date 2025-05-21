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

app.use(cors({
  origin: ["https://roast-battle-rena.onrender.com"],
  credentials: true
}));

app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, {
  cors: {
    origin: ["https://roast-battle-rena.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 10000
  }
});

const waitingUsers = new Map();
const activePairs = new Map();

io.on('connection', (socket) => {
  console.log('✅ New connection:', socket.id);

  socket.emit('connection_update', { 
    status: 'connected', 
    message: 'Server connection established' 
  });

  // Matchmaking logic
  if (waitingUsers.size > 0) {
    const [firstUserId] = waitingUsers.keys();
    const partnerSocket = waitingUsers.get(firstUserId);
    
    activePairs.set(socket.id, partnerSocket.id);
    activePairs.set(partnerSocket.id, socket.id);
    
    socket.emit('chat_start', { partnerId: partnerSocket.id });
    partnerSocket.emit('chat_start', { partnerId: socket.id });
    
    waitingUsers.delete(firstUserId);
    console.log(`🤝 Matched ${socket.id} with ${partnerSocket.id}`);
  } else {
    waitingUsers.set(socket.id, socket);
    socket.emit('waiting');
    console.log(`⏳ ${socket.id} added to waiting list`);
  }

  // Message handling
  socket.on('send_message', (msg) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('receive_message', msg);
      console.log(`💬 Message sent to ${partnerId}`);
    }
  });

  // Skip partner handling
  socket.on('skip_partner', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('partner_left', {
          reason: 'skipped',
          message: '💨 Poof! Your opponent vanished...'
        });
      }
      activePairs.delete(partnerId);
      activePairs.delete(socket.id);
    }
    waitingUsers.set(socket.id, socket);
    socket.emit('waiting');
    console.log(`🔄 ${socket.id} skipped partner`);
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('partner_left', {
          reason: 'disconnected',
          message: '💨 Opponent disconnected'
        });
      }
      activePairs.delete(partnerId);
    }
    activePairs.delete(socket.id);
    waitingUsers.delete(socket.id);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
