require("dotenv").config({ path: "../.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
console.log("🔄 Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// Routes
app.use("/api/auth", require("./routes/auth.routes"));

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "QuickMart API is running! 🚀",
    auth: "Firebase",
    endpoints: {
      firebaseLogin: "POST /api/auth/firebase-login",
      getProfile: "GET /api/auth/me",
      updateProfile: "POST /api/auth/update-profile",
      changeRole: "POST /api/auth/change-role",
      logout: "POST /api/auth/logout",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://13.203.206.134:${PORT}`);
  console.log(`🔐 Auth: Firebase`);
  console.log("========================================");
});