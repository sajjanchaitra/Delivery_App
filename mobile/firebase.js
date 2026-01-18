// firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBOromLcZVwgSct17OUdA5-CM7zUIAax5Y",
  authDomain: "naimoapp-8b457.firebaseapp.com",
  projectId: "naimoapp-8b457",
  storageBucket: "naimoapp-8b457.firebasestorage.app",
  messagingSenderId: "799891724635",
  appId: "1:799891724635:web:44382ab0c0ae6ef0f5627e",
  measurementId: "G-N0N2CF6601"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { app, auth, firebaseConfig };