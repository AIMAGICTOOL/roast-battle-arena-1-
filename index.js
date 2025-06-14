import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Socket.IO with CORS for Render deployment
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (update in production)
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Handle all routes to serve the main HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// Track connected users
const users = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('🔌 New connection:', socket.id);

  // Public room handler
  socket.on('join_public', (userData) => {
    users.set(socket.id, userData);
    socket.join('public');
    console.log(`👤 ${userData.username} joined public arena`);

    // Mock matchmaking (replace with real logic later)
    socket.emit('match_found', {
      opponentName: 'AnonymousRoaster',
      opponentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Opponent'
    });
  });

  // Private room handler
  socket.on('join_private', (userData) => {
    users.set(socket.id, userData);
    socket.join(socket.id); // Room = socket ID
    console.log(`🔒 ${userData.username} created private room`);
    
    socket.emit('match_found', {
      opponentName: 'PrivateOpponent',
      opponentAvatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Private'
    });
  });

  // Roast message handler
  socket.on('send_roast', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    // Broadcast to all in the same room
    io.to(Array.from(socket.rooms)[1]).emit('new_message', {
      text: data.text,
      avatar: user.avatar,
      username: user.username,
      sender: socket.id === data.sender ? 'you' : 'stranger'
    });
  });

  // Skip opponent handler
  socket.on('skip_opponent', () => {
    socket.emit('match_found', {
      opponentName: 'NewOpponent',
      opponentAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=New' + Math.random()
    });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
    users.delete(socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
