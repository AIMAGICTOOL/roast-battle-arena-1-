import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// CORS Setup
app.use(cors({
  origin: ["https://roast-battle-rena.onrender.com", "http://localhost:3000"],
  credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: ["https://roast-battle-rena.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 30000
  },
  pingInterval: 5000,
  pingTimeout: 10000
});

// Matchmaking System
let waitingUsers = new Map();
let activePairs = new Map();

io.on('connection', (socket) => {
  console.log('🔥 New connection:', socket.id);
  
  // Initial connection confirmation
  socket.emit('connection_update', { 
    status: 'connected', 
    message: 'Server connection established' 
  });

  // Matchmaking logic
  if (waitingUsers.size > 0) {
    const [firstUserId] = waitingUsers.keys();
    const partnerSocket = waitingUsers.get(firstUserId);
    
    // Create match pair
    activePairs.set(socket.id, partnerSocket.id);
    activePairs.set(partnerSocket.id, socket.id);
    
    // Notify both users
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
      console.log(`📩 ${socket.id} → ${partnerId}: ${msg.substring(0, 20)}...`);
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
    
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner_left');
      activePairs.delete(partnerId);
      activePairs.delete(socket.id);
    }
    waitingUsers.delete(socket.id);
  });
});

// SPA fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
