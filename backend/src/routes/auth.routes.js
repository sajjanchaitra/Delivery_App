const express = require("express");
const {
  otpLogin,
  getMe,
  updateProfile,
  logout,
} = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/otp-login", otpLogin);

// Protected routes (require JWT token)
router.get("/me", auth(), getMe);
router.put("/profile", auth(), updateProfile);
router.post("/logout", auth(), logout);

module.exports = router;