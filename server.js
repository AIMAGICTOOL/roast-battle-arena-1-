import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server);

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.id);

  socket.on('join_public', (user) => {
    socket.data.user = user;
    if (waitingUser && waitingUser.id !== socket.id) {
      const opponent = waitingUser;
      waitingUser = null;

      socket.join('battle_room');
      opponent.join('battle_room');

      io.to('battle_room').emit('match_found', user);
    } else {
      waitingUser = socket;
      socket.emit('waiting', 'Looking for opponent...');
    }
  });

  socket.on('send_roast', (msg) => {
    socket.to('battle_room').emit('receive_roast', msg);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`✅ Roast Battle Server running on port ${PORT}`)
);
