const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/otp-login
router.post("/otp-login", async (req, res) => {
  try {
    const { phone, role } = req.body;

    if (!phone || !role) {
      return res.status(400).json({ error: "Phone and role required" });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone, role, name: `User ${phone.slice(-4)}` });
      await user.save();
      console.log("✅ New user:", user._id);
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });

    res.json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;