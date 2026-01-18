require("dotenv").config({ path: "../.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} | ${req.method} ${req.path} | IP: ${req.ip}`);
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
    version: "2.0",
    timestamp: new Date().toISOString(),
    otp: "Fast2SMS",
    endpoints: {
      sendOtp: "POST /api/auth/send-otp",
      verifyOtp: "POST /api/auth/verify-otp",
      resendOtp: "POST /api/auth/resend-otp",
      getProfile: "GET /api/auth/me",
      updateProfile: "POST /api/auth/update-profile",
      changeRole: "POST /api/auth/change-role",
      logout: "POST /api/auth/logout",
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️ 404: ${req.method} ${req.path}`);
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
    error: err.message || "Internal server error",
  });
});

// Start server on 0.0.0.0 for external access
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log("========================================");
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📍 External: http://13.203.206.134:${PORT}`);
  console.log(`📱 OTP Provider: Fast2SMS`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("========================================");
});