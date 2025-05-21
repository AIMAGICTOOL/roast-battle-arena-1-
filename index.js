import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path'; // 🚨 ADD THIS
import { fileURLToPath } from 'url'; // 🚨 ADD THIS

const app = express();
const server = createServer(app);

// 🚨 ADD THIS BLOCK (Fix __dirname for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS Setup
app.use(cors({
  origin: [
    "https://roast-battle-rena.onrender.com",
    "http://localhost:3000"
  ],
  credentials: true
}));

// 🚨 ADD THIS (Serve static files from 'public' folder)
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO Setup
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

// [Keep all your existing Socket.IO logic here...]
let waitingUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔥 New connection:', socket.id);
  // ... (rest of your socket event handlers)
});

// 🚨 ADD THIS (SPA fallback route - MUST BE LAST ROUTE)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server (THIS SHOULD BE THE LAST LINE)
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
