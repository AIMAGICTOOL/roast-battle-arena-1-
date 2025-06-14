const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve frontend
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('✅ A user connected');

  // Join public roast arena
  socket.on('join_public', () => {
    console.log('🌐 Joined public room');
    socket.join('public');
    socket.emit('match_found');
  });

  // Join private roast arena
  socket.on('join_private', () => {
    console.log('🔒 Joined private room');
    socket.join(socket.id);
    socket.emit('match_found');
  });

  // Incoming roast message
  socket.on('send_roast', (data) => {
    // Send to self
    socket.emit('new_message', {
      text: data.text,
      sender: 'you'
    });

    // Send to others in room
    socket.broadcast.emit('new_message', {
      text: data.text,
      sender: 'stranger'
    });
  });

  // Skip opponent
  socket.on('skip_opponent', () => {
    console.log('⏭️ User skipped opponent');
    socket.emit('match_found');
  });

  socket.on('disconnect', () => {
    console.log('❌ A user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
