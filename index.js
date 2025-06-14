import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname with ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Store user data temporarily
const users = new Map();

io.on('connection', (socket) => {
  console.log(`✅ New connection: ${socket.id}`);

  socket.on('join_public', (userData) => {
    users.set(socket.id, userData);
    socket.join('public');
    console.log(`🌍 ${userData.username} joined public room`);
    socket.emit('match_found', { opponent: 'RandomOpponent' });
  });

  socket.on('join_private', (userData) => {
    users.set(socket.id, userData);
    socket.join(socket.id);
    console.log(`🔒 ${userData.username} joined private room`);
    socket.emit('match_found', { opponent: 'PrivateUser' });
  });

  socket.on('send_roast', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const msg = {
      text: data.text,
      avatar: data.avatar,
      username: user.username,
      sender: 'you'
    };

    socket.emit('new_message', msg);

    msg.sender = 'stranger';
    socket.broadcast.emit('new_message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    users.delete(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
