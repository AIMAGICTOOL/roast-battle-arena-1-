import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Fixed WebSocket config for Render
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket']
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => res.send('OK'));

// Handle all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// Track users
const users = new Map();

io.on('connection', (socket) => {
  console.log('✅ New connection:', socket.id);
  
  // Immediately confirm connection
  socket.emit('connection_confirmed');

  // Public room handler
  socket.on('join_public', (userData) => {
    users.set(socket.id, userData);
    socket.join('public');
    socket.emit('match_found', {
      opponentName: 'AnonymousRoaster',
      opponentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Opponent'
    });
  });

  // Private room handler
  socket.on('join_private', (userData) => {
    users.set(socket.id, userData);
    socket.join(socket.id);
    socket.emit('match_found', {
      opponentName: 'PrivateOpponent',
      opponentAvatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Private'
    });
  });

  // Message handler
  socket.on('send_roast', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    io.to(Array.from(socket.rooms)[1]).emit('new_message', {
      text: data.text,
      avatar: user.avatar,
      username: user.username,
      sender: socket.id === data.sender ? 'you' : 'stranger'
    });
  });

  // Skip opponent
  socket.on('skip_opponent', () => {
    socket.emit('match_found', {
      opponentName: 'NewOpponent',
      opponentAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=New' + Math.random()
    });
  });

  // Cleanup
  socket.on('disconnect', () => {
    users.delete(socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
