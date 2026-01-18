import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOromLcZVwgSct17OUdA5-CM7zUIAax5Y",
  authDomain: "naimoapp-8b457.firebaseapp.com",
  projectId: "naimoapp-8b457",
  storageBucket: "naimoapp-8b457.firebasestorage.app",
  messagingSenderId: "799891724635",
  appId: "1:799891724635:web:44382ab0c0ae6ef0f5627e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("✅ Firebase initialized successfully");

const auth = getAuth(app);
console.log("✅ Firebase Auth initialized");

export { app, auth, firebaseConfig };