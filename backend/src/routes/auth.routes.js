const express = require("express");
const jwt = require("jsonwebtoken");
const admin = require("../config/firebase");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "quickmart-secret-123";

/**
 * POST /api/auth/firebase-login
 * Verify Firebase token and login/register user
 */
router.post("/firebase-login", async (req, res) => {
  try {
    const { firebaseToken, phone, role = "customer" } = req.body;

    console.log("🔐 Firebase Login Request:");
    console.log("   Phone:", phone);
    console.log("   Role:", role);

    // Validation
    if (!firebaseToken) {
      return res.status(400).json({
        success: false,
        error: "Firebase token is required",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const validRoles = ["customer", "vendor", "delivery"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be: ${validRoles.join(", ")}`,
      });
    }

    // Verify Firebase Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      console.log("✅ Firebase token verified for UID:", decodedToken.uid);
    } catch (error) {
      console.error("❌ Firebase verification failed:", error.message);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired Firebase token",
      });
    }

    // Normalize phone number
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const normalizedPhone = `+91${cleanPhone}`;

    console.log("📱 Processing phone:", normalizedPhone);

    // Find or Create User
    let user = await User.findOne({ phone: normalizedPhone });
    let isNewUser = false;

    if (user) {
      console.log("👤 Found existing user:", user._id);
      user.role = role;
      user.isPhoneVerified = true;
      user.lastLogin = new Date();
      if (!user.firebaseUid) {
        user.firebaseUid = decodedToken.uid;
      }
      await user.save();
    } else {
      console.log("🆕 Creating new user");
      isNewUser = true;
      user = new User({
        phone: normalizedPhone,
        firebaseUid: decodedToken.uid,
        role: role,
        isPhoneVerified: true,
        lastLogin: new Date(),
        name: "",
      });
      await user.save();
      console.log("✅ New user created:", user._id);
    }

    // Generate JWT Token
    const jwtToken = jwt.sign(
      {
        userId: user._id,
        phone: user.phone,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log("✅ Login successful!");

    res.status(200).json({
      success: true,
      message: isNewUser ? "Account created" : "Login successful",
      data: {
        token: jwtToken,
        user: {
          _id: user._id,
          phone: user.phone,
          firebaseUid: user.firebaseUid,
          role: user.role,
          name: user.name,
          email: user.email || "",
          profileImage: user.profileImage || "",
          isPhoneVerified: user.isPhoneVerified,
          createdAt: user.createdAt,
        },
        isNewUser,
      },
    });
  } catch (error) {
    console.error("❌ Firebase Login Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

/**
 * GET /api/auth/me
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/**
 * POST /api/auth/update-profile
 */
router.post("/update-profile", auth, async (req, res) => {
  try {
    const { name, email, profileImage } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select("-__v");

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/**
 * POST /api/auth/logout
 */
router.post("/logout", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      lastLogout: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/**
 * POST /api/auth/change-role
 */
router.post("/change-role", auth, async (req, res) => {
  try {
    const { role } = req.body;

    const validRoles = ["customer", "vendor", "delivery"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role`,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { role },
      { new: true }
    ).select("-__v");

    const newToken = jwt.sign(
      {
        userId: user._id,
        phone: user.phone,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      success: true,
      message: `Role changed to ${role}`,
      data: {
        token: newToken,
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

module.exports = router;