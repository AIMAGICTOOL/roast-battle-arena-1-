import { db, auth, provider } from './firebase.js';
import {
  ref,
  push,
  onChildAdded,
  query,
  limitToLast
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import {
  signInWithPopup,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ✅ Socket.IO Live Connection
const socket = io('https://roast-battle-server.onrender.com', {
  transports: ['websocket'],
  secure: true
});

// ✅ UI Elements
const status = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const skipBtn = document.getElementById('skipBtn');
const sendBtn = document.getElementById('sendBtn');
const input = document.getElementById('messageInput');
const chat = document.getElementById('chat');

let currentUser = {};

// ✅ Login Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = {
      username: user.displayName,
      avatar: user.photoURL
    };
    localStorage.setItem('username', currentUser.username);
    localStorage.setItem('userAvatar', currentUser.avatar);
    loadHistory();
  }
});

// ✅ Google Login Click
document.getElementById('loginBtn').addEventListener('click', () => {
  signInWithPopup(auth, provider).catch(console.error);
});

// ✅ Enter Arena Button
startBtn.addEventListener('click', () => {
  const u = {
    username: localStorage.getItem('username') || 'Anon',
    avatar: localStorage.getItem('userAvatar') || ''
  };

  console.log('▶ Emitting join_public:', u); // Debug log
  socket.emit('join_public', u);
  status.textContent = '🔄 Looking for opponent...';
});

// ✅ Skip = Rejoin
skipBtn.addEventListener('click', () => startBtn.click());

// ✅ Send Roast
sendBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;

  const msg = {
    text,
    ...currentUser
  };

  console.log('💬 Sending roast:', msg);
  socket.emit('send_roast', msg);
  push(ref(db, 'roasts/public'), msg);
  appendMessage(msg, 'you');
  input.value = '';
  chat.scrollTop = chat.scrollHeight;
});

// ✅ Matched with someone
socket.on('match_found', (opp) => {
  status.textContent = `🔥 Matched with: ${opp.username}`;
  skipBtn.style.display = 'inline-block';
});

// ✅ Received roast from opponent
socket.on('receive_roast', (msg) => {
  appendMessage(msg, 'stranger');
});

// ✅ Load Roast History
function loadHistory() {
  const messagesRef = query(ref(db, 'roasts/public'), limitToLast(50));
  onChildAdded(messagesRef, (snapshot) => {
    const msg = snapshot.val();
    appendMessage(
      msg,
      msg.username === currentUser.username ? 'you' : 'stranger'
    );
  });
}

// ✅ Add Roast to UI
function appendMessage(msg, type) {
  const div = document.createElement('div');
  div.className = `message ${type}`;
  div.innerHTML = `
    <div class="message-header">
      <img src="${msg.avatar}" class="message-avatar">
      <strong>${msg.username}</strong>
    </div>
    <div class="message-content">${msg.text}</div>
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
