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

const socket = io('https://roast-battle-server.onrender.com', {
  transports: ['websocket'],
  secure: true
});

const status = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const skipBtn = document.getElementById('skipBtn');
const sendBtn = document.getElementById('sendBtn');
const input = document.getElementById('messageInput');
const chat = document.getElementById('chat');

let currentUser = {};

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

document.getElementById('loginBtn').addEventListener('click', () => {
  signInWithPopup(auth, provider).catch(console.error);
});

startBtn.addEventListener('click', () => {
  chat.innerHTML = ''; // 🧼 Clear chat
  const u = {
    username: localStorage.getItem('username') || 'Anon',
    avatar: localStorage.getItem('userAvatar') || ''
  };
  socket.emit('join_public', u);
  status.textContent = '🔄 Looking for opponent...';
});

skipBtn.addEventListener('click', () => {
  chat.innerHTML = ''; // 🧼 Clear chat on skip too
  startBtn.click();
});

sendBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;

  const msg = {
    text,
    username: currentUser.username,
    avatar: currentUser.avatar
  };

  socket.emit('send_roast', msg);
  push(ref(db, 'roasts/public'), msg);
  appendMessage(msg, 'you');
  input.value = '';
  chat.scrollTop = chat.scrollHeight;
});

socket.on('match_found', (opp) => {
  status.textContent = `🔥 Matched with: ${opp.username}`;
  chat.innerHTML = ''; // 🧼 Clear chat when matched
  skipBtn.style.display = 'inline-block';
});

socket.on('waiting', (msg) => {
  status.textContent = `🕒 ${msg}`;
});

socket.on('receive_roast', (msg) => {
  appendMessage(msg, 'stranger');
});

function loadHistory() {
  const messagesRef = query(ref(db, 'roasts/public'), limitToLast(50));
  onChildAdded(messagesRef, (snapshot) => {
    const msg = snapshot.val();
    if (!chat.innerHTML.includes(msg.text)) {
      appendMessage(
        msg,
        msg.username === currentUser.username ? 'you' : 'stranger'
      );
    }
  });
}

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
