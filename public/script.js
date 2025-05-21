// DOM Elements
const elements = {
  status: document.getElementById('status'),
  roastQuote: document.getElementById('roast-quote'),
  chat: document.getElementById('chat'),
  typingIndicator: document.getElementById('typing-indicator'),
  input: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  startBtn: document.getElementById('startBtn'),
  skipBtn: document.getElementById('skipBtn'),
  reconnectBtn: document.getElementById('reconnectBtn')
};

// Connection Setup
const socket = io("https://roast-battle-rena.onrender.com", {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  autoConnect: false // We'll connect manually
});

// Connection Management
function connectSocket() {
  socket.connect();
  elements.status.textContent = "🌌 Connecting to neural network...";
  elements.status.style.color = "#b8b8ff";
}

// Initialize connection after slight delay
setTimeout(connectSocket, 500);

// Quotes
const QUOTES = {
  waiting: [
    "Training cyber-monkeys to find your match... 🐒💻",
    "Quantum snails routing your connection... 🐌⚛️",
    "Banana-powered servers warming up... 🍌🔥"
  ],
  roasting: [
    "You code like a drunk octopus 🐙🍸",
    "Your WiFi is powered by sleepy sloths 🦥⚡",
    "That comeback died faster than my pet rock 🪨💀"
  ]
};

// Typing detection
let typingTimeout;
const TYPING_DELAY = 1500;

// UI Functions
function resetUI() {
  elements.roastQuote.textContent = '';
  elements.chat.innerHTML = '';
  elements.typingIndicator.style.opacity = '0';
  elements.startBtn.style.display = 'block';
  elements.skipBtn.style.display = 'none';
}

function showRandomQuote(type) {
  const quotes = QUOTES[type];
  elements.roastQuote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  msgDiv.textContent = text;
  elements.chat.appendChild(msgDiv);
  elements.chat.scrollTop = elements.chat.scrollHeight;
}

function sendMessage() {
  const msg = elements.input.value.trim();
  if (!msg) return;
  
  socket.emit('stop_typing');
  clearTimeout(typingTimeout);
  
  socket.emit('send_message', msg);
  addMessage(msg, 'you');
  elements.input.value = '';
}

// Socket Event Handlers
socket.on('connection_update', (data) => {
  elements.status.textContent = `⚡ ${data.message}`;
  elements.status.style.color = "#00f5d4";
  console.log('Connection update:', data.status);
});

socket.on('connect', () => {
  elements.status.textContent = "⚡ Connected to battle server";
  elements.status.style.color = "#00f5d4";
  showRandomQuote('waiting');
});

socket.on('connect_error', (err) => {
  elements.status.textContent = `⚠️ Connection failed: ${err.message}`;
  elements.status.style.color = "#f15bb5";
  console.error('Connection error:', err);
  
  // Auto-reconnect after delay
  setTimeout(connectSocket, 3000);
});

socket.on('waiting', () => {
  elements.status.textContent = "🔍 Scanning for opponents...";
  showRandomQuote('waiting');
  resetUI();
});

socket.on('chat_start', (data) => {
  elements.status.textContent = "⚡ BATTLE MODE ACTIVATED!";
  showRandomQuote('roasting');
  elements.startBtn.style.display = 'none';
  elements.skipBtn.style.display = 'block';
  console.log('Matched with partner:', data.partnerId);
});

socket.on('receive_message', (msg) => {
  addMessage(msg, 'stranger');
  elements.typingIndicator.style.opacity = '0';
});

socket.on('partner_left', () => {
  elements.status.textContent = "💨 Opponent disconnected";
  showRandomQuote('waiting');
  resetUI();
});

// Event Listeners
elements.startBtn.addEventListener('click', () => {
  socket.emit('start_chat');
  elements.status.textContent = "🚀 Searching for opponent...";
});

elements.skipBtn.addEventListener('click', () => {
  socket.emit('skip_partner');
  elements.status.textContent = "🌀 Finding new opponent...";
});

elements.input.addEventListener('input', () => {
  if (elements.input.value.trim().length > 0) {
    socket.emit('typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('stop_typing');
    }, TYPING_DELAY);
  } else {
    socket.emit('stop_typing');
  }
});

elements.sendBtn.addEventListener('click', sendMessage);
elements.input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Initialize
resetUI();
