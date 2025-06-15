import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());

app.get("/", (req, res) => {
  res.send("🔥 Roast Battle Server is running!");
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let publicQueue = [];

io.on("connection", (socket) => {
  console.log("🔌 New user connected:", socket.id);

  socket.on("join_public", (userData) => {
    socket.userData = userData;
    publicQueue.push(socket);
    tryToMatchUsers();
  });

  socket.on("send_roast", (data) => {
    console.log("🔥 Roast sent:", data);
    // handle roast sending logic here
  });

  // Add other socket events as needed...
});

function tryToMatchUsers() {
  while (publicQueue.length >= 2) {
    const user1 = publicQueue.shift();
    const user2 = publicQueue.shift();

    user1.emit("match_found", user2.userData);
    user2.emit("match_found", user1.userData);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
