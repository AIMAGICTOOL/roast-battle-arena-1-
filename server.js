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

io.on('connection', (socket) => {
  socket.on('join_public', (user) => {
    socket.join('public_room', () => {
      console.log(`🛡 ${user.username} joined public_room`);
      socket.emit('joined_room');
      socket.to('public_room').emit('match_found', user);
    });
  });

  socket.on('send_roast', (msg) => {
    console.log('Roast sent:', msg);
    io.to('public_room').emit('receive_roast', msg);
  });
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Roast Battle Server running on port ${PORT}`));
