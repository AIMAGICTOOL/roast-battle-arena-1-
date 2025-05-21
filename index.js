import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Required to use __dirname with ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// ===== 🔧 CRITICAL FIXES ===== //
// 1. Enable CORS for Express
app.use(cors({
  origin: "https://roast-battle-rena.onrender.com", // Your frontend URL
  methods: ["GET", "POST"],
  credentials: true
}));

// 2. Configure Socket.IO with CORS and WebSocket settings
const io = new Server(server, {
  cors: {
    origin: "https://roast-battle-rena.onrender.com", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"], // Explicitly enable both
  allowEIO3: true // For Socket.IO v2/v3 compatibility
});

// Force HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && 
      req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// ===== 🏗️ Server Setup ===== //
// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA (send index.html for all routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ===== 💬 Socket.IO Logic ===== //
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
    if (socket.partner) {
      socket.partner.emit('receive_message', msg);
    }
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
