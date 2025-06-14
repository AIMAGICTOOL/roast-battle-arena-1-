import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Simulate __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

// Serve static files (portal.html must be in 'public' folder)
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins (you can restrict later)
    methods: ["GET", "POST"]
  }
});

// 🔥 Store public chat queue
let publicQueue = [];

io.on("connection", (socket) => {
  console.log("🔌 New user connected:", socket.id);

  socket.on("join_public", (userData) => {
    socket.userData = userData;
    publicQueue.push(socket);
    tryToMatchUsers();
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
    if (socket.partner) {
      socket.partner.emit("partner_skipped");
      socket.partner.partner = null;
    }
    socket.partner = null;
    removeFromQueue(socket);
    tryToMatchUsers();
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (socket.partner) {
      socket.partner.emit("partner_skipped");
      socket.partner.partner = null;
    }
    removeFromQueue(socket);
  });
});

function tryToMatchUsers() {
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
