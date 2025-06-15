import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Required for ES module path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create app
const app = express();
app.use(cors());

// Serve files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server);

// Socket.IO chat logic
io.on('connection', (socket) => {
  console.log('🔌 New connection:', socket.id);

  socket.on('join_public', (user) => {
    socket.join('public_room');
    console.log(`👤 ${user.username} joined public_room`);
    io.to('public_room').emit('match_found', user);
  });

  socket.on('send_roast', (msg) => {
    console.log('🔥 Roast sent:', msg);
    io.to('public_room').emit('receive_roast', msg);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
  });
});

// Serve portal.html on root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`✅ Roast Battle Server running on port ${PORT}`)
);
