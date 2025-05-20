import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'; // ✅ Added CORS import

// Required to use __dirname with ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// ===== 🔧 CRITICAL FIXES ===== //
// 1. Enable CORS for Express
app.use(cors({
  origin: "*", // Allow all origins (tighten this later for production!)
  methods: ["GET", "POST"]
}));

// 2. Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Match frontend URL (replace "*" with your Render URL later)
    methods: ["GET", "POST"]
  }
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

// ===== 💬 Socket.IO Logic (Unchanged) ===== //
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
  // ... (keep other socket events as-is)
});
