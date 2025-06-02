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
  origin: ["https://roast-battle-arena-1.onrender.com"],
  credentials: true
}));

// Serve static files from 'public' (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve portal.html on all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});


// Setup Socket.io with CORS options
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

// Add these Socket.IO handlers
io.on('connection', (socket) => {
  // Private battles
  socket.on('join_private', () => {
    socket.join('private_room');
    // Matchmaking logic here
  });

  // Public arena
  socket.on('join_public', () => {
    socket.join('public_arena');
    socket.emit('message', 'Welcome to the public roast arena!');
  });

  socket.on('send_message', (data) => {
    // Broadcast to the appropriate room
    io.to(data.room).emit('message', data.msg);
  });

  // Other existing handlers...
});
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
  } else {
    waitingUsers.set(socket.id, socket);
    socket.emit('waiting');
  }

  // Message passing
  socket.on('send_message', (msg) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) io.to(partnerId).emit('receive_message', msg);
  });

  // Typing events
  socket.on('typing', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) io.to(partnerId).emit('partner_typing');
  });

  socket.on('stop_typing', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) io.to(partnerId).emit('partner_stopped_typing');
  });

  // Skip partner
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

  // Disconnect handling
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
