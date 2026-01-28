// backend/src/routes/auth.routes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const firebaseAuthService = require("../services/firebase-auth.service");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "quickmart-secret-key-2024";

// ==================== PRODUCTION: FIREBASE OTP LOGIN ====================
/**
 * POST /api/auth/firebase-login
 * Verify Firebase OTP and create/login user
 */
router.post("/firebase-login", async (req, res) => {
  try {
    const { firebaseToken, phone, role = "customer" } = req.body;

    console.log("🔐 Firebase Login Request:");
    console.log("   Phone:", phone);
    console.log("   Role:", role);

    // Validate input
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
        error: "Invalid role. Must be customer, vendor, or delivery",
      });
    }

    // Verify Firebase Token
    let verificationResult;
    try {
      verificationResult = await firebaseAuthService.verifyIdToken(firebaseToken);
    } catch (error) {
      console.error("❌ Firebase verification failed:", error.message);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired Firebase token",
      });
    }

    // Extract and normalize phone number
    const tokenPhone = verificationResult.phoneNumber?.replace("+91", "");
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    
    // Verify phone number matches
    if (tokenPhone !== cleanPhone && !tokenPhone.endsWith(cleanPhone)) {
      return res.status(401).json({
        success: false,
        error: "Phone number mismatch",
      });
    }

    const normalizedPhone = `+91${cleanPhone}`;

    // Find or create user in MongoDB
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
        firebaseUid: verificationResult.uid,
        lastLogin: new Date(),
      });

      await user.save();
      console.log("✅ New user created:", user._id);
    } else {
      // Update existing user
      user.role = role;
      user.isPhoneVerified = true;
      user.firebaseUid = verificationResult.uid;
      user.lastLogin = new Date();
      await user.save();
      console.log("✅ Existing user logged in:", user._id);
    }

    // Generate JWT token
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
        user: {
          id: user._id.toString(),
          _id: user._id.toString(),
          phone: user.phone,
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
      error: "Server error. Please try again.",
    });
  }
});

// ==================== TEST LOGIN (FOR DEVELOPMENT) ====================
router.post("/test-login", async (req, res) => {
  try {
    const { phone, role } = req.body;
    console.log("🧪 Test Login Request:");
    console.log("   Phone:", phone);
    console.log("   Role:", role);

    if (!phone || !role) {
      return res.status(400).json({
        success: false,
        error: "Phone and role are required",
      });
    }

    let user = await User.findOne({ phone, role });

    if (user) {
      console.log("👤 Found existing user:", user._id);
      user.lastLogin = new Date();
      await user.save();
      
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id.toString(),
            _id: user._id.toString(),
            name: user.name,
            phone: user.phone,
            role: user.role,
            email: user.email || "",
            profileImage: user.profileImage || "",
            isPhoneVerified: user.isPhoneVerified,
            createdAt: user.createdAt,
          },
        },
        message: "Test login successful",
      });
    }

    console.log("👤 Creating new test user");
    const newUser = new User({
      phone,
      role,
      name: `Test ${role}`,
      isPhoneVerified: true,
      isTestUser: true,
      lastLogin: new Date(),
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: newUser._id.toString(),
          _id: newUser._id.toString(),
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          email: newUser.email || "",
          profileImage: newUser.profileImage || "",
          isPhoneVerified: newUser.isPhoneVerified,
          createdAt: newUser.createdAt,
        },
      },
      message: "Test user created and logged in",
    });
  } catch (error) {
    console.error("❌ Test Login Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== ADMIN LOGIN WITH PASSWORD ====================
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

    const user = await User.findOne({ phone, role: "admin" });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const bcrypt = require("bcryptjs");
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
        user: {
          id: user._id.toString(),
          _id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          role: user.role,
          email: user.email || "",
          profileImage: user.profileImage || "",
          isPhoneVerified: user.isPhoneVerified,
          createdAt: user.createdAt,
        },
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
    const user = await User.findById(req.userId).select("-__v -password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        _id: user._id.toString(),
        phone: user.phone,
        role: user.role,
        name: user.name,
        email: user.email || "",
        profileImage: user.profileImage || "",
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
      },
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
    ).select("-__v -password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: {
        id: user._id.toString(),
        _id: user._id.toString(),
        phone: user.phone,
        role: user.role,
        name: user.name,
        email: user.email || "",
        profileImage: user.profileImage || "",
        isPhoneVerified: user.isPhoneVerified,
      },
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
    // Clear FCM token on logout
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