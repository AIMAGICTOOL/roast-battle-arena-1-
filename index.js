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

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

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

// --- YOUR EXISTING SOCKET.IO LOGIC (UNTOUCHED) ---
let waitingUsers = new Map();
let activePairs = new Map();

io.on('connection', (socket) => {
  console.log('✅ New connection:', socket.id);

  socket.emit('connection_update', { 
    status: 'connected', 
    message: 'Server connection established' 
  });

  // [Keep all your existing socket.io code exactly as is...]
  // Matchmaking, message handling, typing indicators, etc.
  // ...
});

// KEY CHANGE: Make portal.html the default page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// Fallback to index.html for all other routes (including /index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
