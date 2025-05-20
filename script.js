const socket = io(); // Automatically connects to the host serving the page

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
  messageSound: document.getElementById('messageSound'),
  connectSound: document.getElementById('connectSound'),
  disconnectSound: document.getElementById('disconnectSound')
};

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

// Initialize UI
resetUI();
elements.skipBtn.style.display = 'none';

// Sound initialization
document.addEventListener('click', initSounds, { once: true });

function initSounds() {
  elements.messageSound.volume = 0.3;
  elements.connectSound.volume = 0.3;
  elements.disconnectSound.volume = 0.3;
}

function resetUI() {
  elements.roastQuote.textContent = '';
  elements.chat.innerHTML = '';
  elements.typingIndicator.style.opacity = '0';
  elements.startBtn.style.display = 'block';
  elements.skipBtn.style.display = 'none';
}

// Socket Events
socket.on('connect', () => {
  elements.status.textContent = '🌌 Connected to neural network...';
  showRandomQuote('waiting');
});

socket.on('waiting', () => {
  elements.status.textContent = '🔍 Scanning the metaverse for worthy opponents...';
  showRandomQuote('waiting');
  resetUI();
});

socket.on('chat_start', () => {
  elements.connectSound.play();
  elements.status.textContent = '⚡ BATTLE MODE ACTIVATED!';
  showRandomQuote('roasting');
  elements.startBtn.style.display = 'none';
  elements.skipBtn.style.display = 'block';
});

socket.on('receive_message', (msg) => {
  elements.messageSound.play();
  addMessage(msg, 'stranger');
  elements.typingIndicator.style.opacity = '0';
});

socket.on('partner_left', () => {
  elements.disconnectSound.play();
  elements.status.textContent = '💨 Poof! Your opponent vanished...';
  showRandomQuote('waiting');
  resetUI();
});

socket.on('typing', () => {
  elements.typingIndicator.style.opacity = '1';
});

socket.on('stop_typing', () => {
  elements.typingIndicator.style.opacity = '0';
});

// Helper functions
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

// Event listeners
elements.startBtn.addEventListener('click', () => {
  socket.emit('start_chat');
  elements.status.textContent = '🚀 Warping to chat dimension...';
});

elements.skipBtn.addEventListener('click', () => {
  socket.emit('skip_partner');
  elements.status.textContent = '🌀 Creating wormhole to new partner...';
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
