// public/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCOZZStypUDTr6shxcB0kM6ddJ9HaNyM2Q",
  authDomain: "roast-battle-arena-6658b.firebaseapp.com",
  databaseURL: "https://roast-battle-arena-6658b-default-rtdb.firebaseio.com",
  projectId: "roast-battle-arena-6658b",
  storageBucket: "roast-battle-arena-6658b.appspot.com",
  messagingSenderId: "1004753319883",
  appId: "1:1004753319883:web:ddcd82fa55d2db6ec8e84e"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
