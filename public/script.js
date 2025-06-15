import { db, auth, provider } from "./firebase.js";
import { ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// SOCKET SETUP
const socket = io("https://roast-battle-arena-1.onrender.com", {
  transports: ["websocket"],
  secure: true
});

const statusDiv = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const skipBtn = document.getElementById("skipBtn");
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("messageInput");
const chat = document.getElementById("chat");

let currentUser = {
  username: "",
  avatar: "",
};

// LOGIN
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser.username = user.displayName;
    currentUser.avatar = user.photoURL;
    localStorage.setItem("username", currentUser.username);
    localStorage.setItem("userAvatar", currentUser.avatar);
  }
});

document.getElementById("loginBtn").addEventListener("click", () => {
  signInWithPopup(auth, provider).catch(err => console.error(err));
});

// JOIN CHAT
startBtn.addEventListener("click", () => {
  const user = {
    username: localStorage.getItem("username") || "Anonymous",
    avatar: localStorage.getItem("userAvatar") || "default.png"
  };
  socket.emit("join_public", user);
  statusDiv.textContent = "🔄 Looking for opponent...";
});

// SKIP
skipBtn.addEventListener("click", () => startBtn.click());

// SEND MESSAGE
sendBtn.addEventListener("click", () => {
  const msg = input.value.trim();
  if (!msg) return;

  const data = {
    text: msg,
    username: localStorage.getItem("username") || "Anonymous",
    avatar: localStorage.getItem("userAvatar") || "default.png"
  };

  socket.emit("send_roast", data);
  push(ref(db, "roasts/public"), data);

  chat.innerHTML += formatMessage(data, "you");
  input.value = "";
  chat.scrollTop = chat.scrollHeight;
});

// SOCKET RECEIVE
socket.on("receive_roast", data => {
  chat.innerHTML += formatMessage(data, "stranger");
  chat.scrollTop = chat.scrollHeight;
});

socket.on("match_found", opponent => {
  statusDiv.textContent = `🔥 Matched with: ${opponent.username}`;
  skipBtn.style.display = "inline-block";
});

function formatMessage(data, type) {
  return `
    <div class="message ${type}">
      <div class="message-header">
        <img src="${data.avatar}" class="message-avatar">
        <strong>${data.username}</strong>
      </div>
      <div class="message-content">${data.text}</div>
    </div>`;
}
