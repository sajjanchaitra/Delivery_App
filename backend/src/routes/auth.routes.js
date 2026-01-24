// backend/src/routes/auth.routes.js
const express = require("express");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "quickmart-secret-key-2024";

// ==================== TEST LOGIN (FAKE OTP) ====================
/**
 * POST /api/auth/test-login
 * For development/testing - Creates real JWT token without OTP verification
 */
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

    // Find existing user
    let user = await User.findOne({ phone, role });

    if (user) {
      console.log("👤 Found existing user:", user._id);
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Generate token
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

    // Create new user only if not found
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


// ==================== CHECK IF PHONE IS ADMIN ====================
/**
 * POST /api/auth/check-admin
 * Check if phone number belongs to admin
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

    const user = await User.findOne({ phone, role: "admin" });

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
 * Admin authentication with password
 */
router.post("/admin-login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log("🔐 Admin Login Request:");
    console.log("   Phone:", phone);

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: "Phone and password are required",
      });
    }

    // Find admin user
    const user = await User.findOne({ phone, role: "admin" });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: "Admin account not configured properly",
      });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
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

// ==================== SEND OTP (PLACEHOLDER) ====================
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    console.log("📱 OTP Request for:", cleanPhone);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully (Test Mode: Use any 6 digits)",
      verificationId: "TEST_VERIFICATION_" + Date.now(),
      testMode: true,
    });
  } catch (error) {
    console.error("❌ Send OTP Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== VERIFY OTP ====================
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp, role = "customer", verificationId } = req.body;

    console.log("🔐 Verify OTP Request:");
    console.log("   Phone:", phone);
    console.log("   OTP:", otp);
    console.log("   Role:", role);

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: "Phone and OTP are required",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: "OTP must be 6 digits",
      });
    }

    const validRoles = ["customer", "vendor", "delivery", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const normalizedPhone = `+91${cleanPhone}`;

    let user = await User.findOne({ phone: normalizedPhone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const roleNames = {
        customer: "Customer",
        vendor: "Vendor",
        delivery: "Delivery Partner",
        admin: "Admin",
      };

      user = new User({
        phone: normalizedPhone,
        role: role,
        isPhoneVerified: true,
        name: roleNames[role] || "User",
        lastLogin: new Date(),
      });
      await user.save();
    } else {
      user.role = role;
      user.isPhoneVerified = true;
      user.lastLogin = new Date();
      await user.save();
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        phone: user.phone,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log("✅ OTP Verified Successfully!");

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        token: token,
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
    console.error("❌ Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== GET CURRENT USER ====================
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
    ).select("-__v");

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

// ==================== CHANGE ROLE ====================
router.post("/change-role", auth, async (req, res) => {
  try {
    const { role } = req.body;

    const validRoles = ["customer", "vendor", "delivery", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { role },
      { new: true }
    ).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const newToken = jwt.sign(
      {
        userId: user._id.toString(),
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
        user: {
          id: user._id.toString(),
          _id: user._id.toString(),
          phone: user.phone,
          role: user.role,
          name: user.name,
          email: user.email || "",
        },
      },
    });
  } catch (error) {
    console.error("❌ Change Role Error:", error);
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