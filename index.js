import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// ✅ CORS Setup
app.use(cors({
  origin: "https://roast-battle-rena.onrender.com",
  credentials: true
}));

// ✅ Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "https://roast-battle-rena.onrender.com",
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// Socket.IO Logic
let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;
    socket.emit('chat_start');
    waitingUser.emit('chat_start');
    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit('waiting');
  }

  socket.on('send_message', (msg) => {
    if (socket.partner) socket.partner.emit('receive_message', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (waitingUser === socket) waitingUser = null;
    if (socket.partner) {
      socket.partner.emit('partner_left');
      socket.partner.partner = null;
    }
  });
});
