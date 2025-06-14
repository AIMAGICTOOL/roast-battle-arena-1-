import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory path for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO events
io.on('connection', (socket) => {
  console.log('✅ A user connected');

  socket.on('join_public', () => {
    console.log('🌐 User joined public room');
    socket.join('public');
    socket.emit('match_found');
  });

  socket.on('join_private', () => {
    console.log('🔒 User joined private room');
    socket.join(socket.id);
    socket.emit('match_found');
  });

  socket.on('send_roast', (data) => {
    socket.emit('new_message', { text: data.text, sender: 'you' });
    socket.broadcast.emit('new_message', { text: data.text, sender: 'stranger' });
  });

  socket.on('skip_opponent', () => {
    console.log('⏭️ User skipped opponent');
    socket.emit('match_found');
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
