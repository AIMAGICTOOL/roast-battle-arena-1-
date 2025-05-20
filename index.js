import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
import path from 'path';
import { fileURLToPath } from 'url';

// These two lines are needed for __dirname to work in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the 'public' folder where your index.html and sounds are
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all unknown routes (important for frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});
const server = createServer(app);
const io = new Server(server);

// ✅ Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Fallback to index.html for all unknown routes (Render needs this)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// === Socket.io logic ===
let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit('chat_start');
    waitingUser.emit('chat_start');

    waitingUser = null;
  } else {
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
