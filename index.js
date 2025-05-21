import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

app.use(cors({
  origin: [
    "https://roast-battle-rena.onrender.com",
    "http://localhost:3000"
  ],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: [
      "https://roast-battle-rena.onrender.com",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 30000,
    skipMiddlewares: true
  }
});

let waitingUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔥 New connection:', socket.id);

  if (waitingUsers.size > 0) {
    const [firstUserId] = waitingUsers.keys();
    const partnerSocket = waitingUsers.get(firstUserId);
    
    socket.data.partner = partnerSocket.id;
    partnerSocket.data.partner = socket.id;
    
    socket.emit('chat_start');
    partnerSocket.emit('chat_start');
    
    waitingUsers.delete(firstUserId);
  } else {
    waitingUsers.set(socket.id, socket);
    socket.emit('waiting');
  }

  socket.on('send_message', (msg) => {
    const partnerId = socket.data.partner;
    if (partnerId && io.sockets.sockets.get(partnerId)) {
      io.to(partnerId).emit('receive_message', msg);
    }
  });

  socket.on('disconnect', () => {
    const partnerId = socket.data.partner;
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('partner_left');
        partnerSocket.data.partner = null;
      }
    }
    waitingUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
