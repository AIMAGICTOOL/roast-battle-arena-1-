import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Enable __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// === Socket.io logic ===

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (waitingUser) {
    // Pair users
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit('chat_start');
    waitingUser.emit('chat_start');

    waitingUser = null;
  } else {
    // Put user in waiting
    waitingUser = socket;
    socket.emit('waiting');
  }

  socket.on('send_message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('receive_message', msg);
    }
  });

  socket.on('typing', () => {
    if (socket.partner) {
      socket.partner.emit('typing');
    }
  });

  socket.on('stop_typing', () => {
    if (socket.partner) {
      socket.partner.emit('stop_typing');
    }
  });

  socket.on('skip_partner', () => {
    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit('partner_left');
      socket.partner = null;
    }

    if (waitingUser && waitingUser !== socket) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit('chat_start');
      waitingUser.emit('chat_start');

      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit('waiting');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (waitingUser === socket) {
      waitingUser = null;
    }

    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit('partner_left');
    }
  });
});
