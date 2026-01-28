// backend/src/routes/auth.routes.js
// PRODUCTION AUTH ROUTES - Add these to your existing auth.routes.js

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const admin = require("../config/firebase");
const { auth } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "quickmart-secret-key-2024";

// ==================== FIREBASE OTP LOGIN (PRODUCTION) ====================
/**
 * POST /api/auth/firebase-login
 * Verify Firebase token and login/create user
 */
router.post("/firebase-login", async (req, res) => {
  try {
    const { firebaseToken, phone, role = "customer" } = req.body;

    console.log("🔐 Firebase Login Request:");
    console.log("   Phone:", phone);
    console.log("   Role:", role);

    if (!firebaseToken || !phone) {
      return res.status(400).json({
        success: false,
        error: "Firebase token and phone number are required",
      });
    }

    // Validate role
    const validRoles = ["customer", "vendor", "delivery"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role",
      });
    }

    // Verify Firebase Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      console.log("✅ Firebase token verified:", decodedToken.phone_number);
    } catch (firebaseError) {
      console.error("❌ Firebase verification failed:", firebaseError.message);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired Firebase token",
      });
    }

    // Extract and normalize phone
    const tokenPhone = decodedToken.phone_number?.replace("+91", "");
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    
    if (tokenPhone !== cleanPhone && !tokenPhone.endsWith(cleanPhone)) {
      return res.status(401).json({
        success: false,
        error: "Phone number mismatch",
      });
    }

    const normalizedPhone = `+91${cleanPhone}`;

    // Find or create user
    let user = await User.findOne({ phone: normalizedPhone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const roleNames = {
        customer: "Customer",
        vendor: "Vendor",
        delivery: "Delivery Partner",
      };

      user = new User({
        phone: normalizedPhone,
        role,
        name: roleNames[role],
        isPhoneVerified: true,
        lastLogin: new Date(),
      });

      await user.save();
      console.log("✅ New user created:", user._id);
    } else {
      user.role = role;
      user.isPhoneVerified = true;
      user.lastLogin = new Date();
      await user.save();
      console.log("✅ Existing user logged in:", user._id);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        phone: user.phone,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log("✅ Login successful!");

    res.status(200).json({
      success: true,
      message: isNewUser ? "Account created successfully" : "Login successful",
      data: {
        token,
        user: user.toPublicJSON(),
        isNewUser,
      },
    });
  } catch (error) {
    console.error("❌ Firebase Login Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error. Please try again.",
    });
  }
});

// ==================== CHECK IF PHONE IS ADMIN ====================
/**
 * POST /api/auth/check-admin
 * Check if phone belongs to admin
 */
router.post("/check-admin", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone is required",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const normalizedPhone = `+91${cleanPhone}`;

    const user = await User.findOne({ 
      $or: [
        { phone: normalizedPhone, role: "admin" },
        { phone: cleanPhone, role: "admin" },
      ]
    });

    res.json({
      success: true,
      isAdmin: !!user,
      name: user ? user.name : null,
    });
  } catch (error) {
    console.error("❌ Check Admin Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== ADMIN LOGIN WITH PASSWORD ====================
/**
 * POST /api/auth/admin-login
 * Admin login with password
 */
router.post("/admin-login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log("🔐 Admin Login Request:", phone);

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: "Phone and password are required",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const normalizedPhone = `+91${cleanPhone}`;

    const user = await User.findOne({ 
      $or: [
        { phone: normalizedPhone, role: "admin" },
        { phone: cleanPhone, role: "admin" },
      ]
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log("✅ Admin logged in successfully!");

    res.json({
      success: true,
      data: {
        token,
        user: user.toPublicJSON(),
      },
      message: "Admin login successful",
    });
  } catch (error) {
    console.error("❌ Admin Login Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== UPDATE FCM TOKEN ====================
/**
 * POST /api/auth/fcm-token
 * Save FCM token for push notifications
 */
router.post("/fcm-token", auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        error: "FCM token is required",
      });
    }

    await User.findByIdAndUpdate(req.userId, {
      fcmToken,
      fcmTokenUpdatedAt: new Date(),
    });

    console.log("✅ FCM token updated for user:", req.userId);

    res.json({
      success: true,
      message: "FCM token updated successfully",
    });
  } catch (error) {
    console.error("❌ FCM Token Update Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update FCM token",
    });
  }
});

// ==================== GET CURRENT USER ====================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("❌ Get Me Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// ==================== UPDATE PROFILE ====================
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, profileImage } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    ).select("-password -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// ==================== LOGOUT ====================
router.post("/logout", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      lastLogout: new Date(),
      $unset: { fcmToken: 1 },
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// ==================== VALIDATE TOKEN ====================
router.get("/validate", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        valid: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: user._id.toString(),
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false,
      error: "Invalid token",
    });
  }
});

module.exports = router;