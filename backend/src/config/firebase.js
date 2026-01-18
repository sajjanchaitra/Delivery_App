const admin = require("firebase-admin");
const path = require("path");

try {
  // Load firebase.json from config directory
  const serviceAccount = require("./firebase.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  console.error("Make sure firebase.json exists in src/config/");
  process.exit(1);
}

module.exports = admin;