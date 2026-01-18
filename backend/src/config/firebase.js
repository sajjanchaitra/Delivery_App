const admin = require("firebase-admin");

try {
  // Initialize with service account
  const serviceAccount = require("./firebase-service-account.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized");
} catch (error) {
  console.error("❌ Firebase Admin initialization error:", error.message);
  console.log("⚠️ Make sure firebase-service-account.json exists in config folder");
  process.exit(1);
}

module.exports = admin;