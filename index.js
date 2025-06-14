import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Required to simulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup express
const app = express();
const server = http.createServer(app);

// Setup socket.io server with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static frontend (portal.html) from public folder
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

let publicQueue = [];
let privateRooms = {};

io.on("connection", (socket) => {
  console.log("🔌 New client:", socket.id);

  socket.on("join_public", (userData) => {
    socket.userData = userData;
    publicQueue.push(socket);
    matchPublicUsers();
  });

  socket.on("join_private", (userData) => {
    const roomCode = socket.handshake.query.room || generateRoomCode();
    socket.join(roomCode);
    socket.userData = userData;

    if (!privateRooms[roomCode]) {
      privateRooms[roomCode] = [socket];
    } else {
      privateRooms[roomCode].push(socket);
      if (privateRooms[roomCode].length === 2) {
        const [s1, s2] = privateRooms[roomCode];
        s1.to(roomCode).emit("match_found", { opponentName: s2.userData.username });
        s2.to(roomCode).emit("match_found", { opponentName: s1.userData.username });
      }
    }
  });

  socket.on("send_roast", (data) => {
    const partner = socket.partner;
    if (partner) {
      partner.emit("new_message", {
        text: data.text,
        username: socket.userData.username,
        avatar: socket.userData.avatar,
        sender: "stranger"
      });

      socket.emit("new_message", {
        text: data.text,
        username: socket.userData.username,
        avatar: socket.userData.avatar,
        sender: "you"
      });
    }
  });

  socket.on("skip_opponent", () => {
    removeFromQueue(socket);
    if (socket.partner) {
      socket.partner.emit("partner_skipped");
      socket.partner.partner = null;
    }
    socket.partner = null;
    matchPublicUsers();
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    removeFromQueue(socket);
    if (socket.partner) {
      socket.partner.emit("partner_skipped");
      socket.partner.partner = null;
    }
  });
});

function matchPublicUsers() {
  while (publicQueue.length >= 2) {
    const user1 = publicQueue.shift();
    const user2 = publicQueue.shift();

    user1.partner = user2;
    user2.partner = user1;

    user1.emit("match_found", { opponentName: user2.userData.username });
    user2.emit("match_found", { opponentName: user1.userData.username });
  }
}

function removeFromQueue(socket) {
  const index = publicQueue.indexOf(socket);
  if (index !== -1) publicQueue.splice(index, 1);
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
