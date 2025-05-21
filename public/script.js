// DOM Elements
const elements = {
  status: document.getElementById('status'),
  roastQuote: document.getElementById('roast-quote'),
  chat: document.getElementById('chat'),
  typingIndicator: document.getElementById('typing-indicator'),
  input: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  startBtn: document.getElementById('startBtn'),
  skipBtn: document.getElementById('skipBtn')
};

// Sound Setup
const sounds = {
  message: new Audio('sounds/message.mp3'),
  connect: new Audio('sounds/connect.mp3'),
  disconnect: new Audio('sounds/disconnect.mp3')
};

// Initialize audio (required for autoplay)
document.addEventListener('click', initSounds, { once: true });

function initSounds() {
  Object.values(sounds).forEach(sound => {
    sound.volume = 0.3;
    sound.muted = false;
    // Try to play/pause to unlock audio
    sound.play().then(() => sound.pause()).catch(e => console.log('Audio init error:', e));
  });
}

// Socket.IO Connection
const socket = io("https://roast-battle-rena.onrender.com", {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 3000
});

let currentPartner = null;
let typingTimeout;
const TYPING_DELAY = 1500;

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

// UI Functions
function resetUI() {
  elements.roastQuote.textContent = '';
  elements.chat.innerHTML = '';
  elements.typingIndicator.style.opacity = '0';
  elements.startBtn.style.display = 'block';
  elements.skipBtn.style.display = 'none';
  currentPartner = null;
}

function showRandomQuote(type) {
  const quote = QUOTES[type][Math.floor(Math.random() * QUOTES[type].length)];
  elements.roastQuote.textContent = quote;
}

function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  msgDiv.textContent = text;
  elements.chat.appendChild(msgDiv);
  elements.chat.scrollTop = elements.chat.scrollHeight;
}

function playSound(soundName) {
  try {
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(e => console.log(`${soundName} sound error:`, e));
  } catch (e) {
    console.log('Sound play failed:', e);
  }
}

function sendMessage() {
  const msg = elements.input.value.trim();
  if (!msg || !currentPartner) return;
  
  socket.emit('send_message', msg);
  addMessage(msg, 'you');
  elements.input.value = '';
  playSound('message');
  
  socket.emit('stop_typing');
  clearTimeout(typingTimeout);
  elements.typingIndicator.style.opacity = '0';
}

// Socket Events
socket.on('connection_update', (data) => {
  elements.status.textContent = `⚡ ${data.message}`;
});

socket.on('connect', () => {
  elements.status.textContent = "⚡ Connected to battle server";
  showRandomQuote('waiting');
  playSound('connect');
});

socket.on('connect_error', (err) => {
  elements.status.textContent = `⚠️ Connection failed: ${err.message}`;
});

socket.on('waiting', () => {
  elements.status.textContent = "🔍 Scanning for opponents...";
  showRandomQuote('waiting');
  resetUI();
});

socket.on('chat_start', (data) => {
  currentPartner = data.partnerId;
  elements.status.textContent = "⚡ BATTLE MODE ACTIVATED!";
  showRandomQuote('roasting');
  elements.startBtn.style.display = 'none';
  elements.skipBtn.style.display = 'block';
  playSound('connect');
});

socket.on('receive_message', (msg) => {
  addMessage(msg, 'stranger');
  elements.typingIndicator.style.opacity = '0';
  playSound('message');
});

socket.on('partner_left', (data) => {
  elements.status.textContent = data.message;
  showRandomQuote('waiting');
  resetUI();
  playSound('disconnect');
});

socket.on('typing', () => {
  elements.typingIndicator.style.opacity = '1';
});

socket.on('stop_typing', () => {
  elements.typingIndicator.style.opacity = '0';
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
