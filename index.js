import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Required to use __dirname with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Store temporary data
const users = new Map();

io.on('connection', (socket) => {
  console.log('🔌 New user connected');

  socket.on('join_public', (userData) => {
    users.set(socket.id, userData);
    socket.join('public');
    console.log(`👤 ${userData.username} joined public`);

    // Fake opponent name (in real, find another user)
    socket.emit('match_found', {
      opponentName: 'AnonymousRoaster'
    });
  });

  socket.on('join_private', (userData) => {
    users.set(socket.id, userData);
    socket.join(socket.id);
    console.log(`🔒 ${userData.username} joined private`);
    socket.emit('match_found', {
      opponentName: 'PrivateOpponent'
    });
  });

  socket.on('send_roast', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const messageData = {
      text: data.text,
      avatar: data.avatar,
      username: data.username,
      sender: 'you'
    };

    socket.emit('new_message', messageData);

    messageData.sender = 'stranger';
    socket.broadcast.emit('new_message', messageData);
  });

  socket.on('skip_opponent', () => {
    socket.emit('match_found', {
      opponentName: 'NewOpponent'
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
    users.delete(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
