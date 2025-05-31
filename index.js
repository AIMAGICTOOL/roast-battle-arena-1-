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

// Serve static files (css, js etc)
app.use(express.static(path.join(__dirname, 'public')));

// Serve portal.html at root "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// Serve index.html for all other routes (fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io setup here (keep your existing io.on('connection') logic)
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

// Your socket.io logic here unchanged...

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
