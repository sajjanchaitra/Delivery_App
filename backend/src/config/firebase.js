// backend/src/config/firebase.js
const admin = require('firebase-admin');
const path = require('path');

// Load service account from config folder
const serviceAccount = require(path.join(__dirname, './firebase.json.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;