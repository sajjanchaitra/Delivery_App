const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const otpService = require("../services/otpService");
const { auth } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "quickmart-secret-123";

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    console.log("📱 Send OTP Request:", phone);

    // Validate phone
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid 10-digit phone number",
      });
    }

    // Send OTP via Fast2SMS
    const result = await otpService.sendOTP(cleanPhone);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        // Only return OTP in development
        ...(process.env.NODE_ENV !== "production" && { otp: result.otp }),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Send OTP Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send OTP. Please try again.",
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and login/register user
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp, role = "customer" } = req.body;

    console.log("🔐 Verify OTP Request:");
    console.log("   Phone:", phone);
    console.log("   OTP:", otp);
    console.log("   Role:", role);

    // Validate inputs
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: "Phone and OTP are required",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    
    // Validate role
    const validRoles = ["customer", "vendor", "delivery"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Verify OTP
    const verifyResult = otpService.verifyOTP(cleanPhone, otp);

    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        error: verifyResult.message,
      });
    }

    console.log("✅ OTP verified successfully");

    // Normalize phone with country code for storage
    const normalizedPhone = `+91${cleanPhone}`;

    // Find or Create User
    let user = await User.findOne({ phone: normalizedPhone });
    let isNewUser = false;

    if (user) {
      console.log("👤 Found existing user:", user._id);
      // Update existing user
      user.role = role;
      user.isPhoneVerified = true;
      user.lastLogin = new Date();
      await user.save();
    } else {
      console.log("🆕 Creating new user");
      isNewUser = true;
      user = new User({
        phone: normalizedPhone,
        role: role,
        isPhoneVerified: true,
        lastLogin: new Date(),
        name: "",
      });
      await user.save();
      console.log("✅ New user created:", user._id);
    }

    // Generate JWT Token
    const token = jwt.sign(
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
      message: isNewUser ? "Account created successfully" : "Login successful",
      data: {
        token,
        user: {
          _id: user._id,
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
      error: "Server error. Please try again.",
    });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP to phone number
 */
router.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const result = await otpService.sendOTP(cleanPhone);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "OTP resent successfully",
        ...(process.env.NODE_ENV !== "production" && { otp: result.otp }),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Resend OTP Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resend OTP",
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
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
    console.error("❌ Get User Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/**
 * POST /api/auth/update-profile
 * Update user profile
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
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
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

/**
 * POST /api/auth/change-role
 * Change user role
 */
router.post("/change-role", auth, async (req, res) => {
  try {
    const { role } = req.body;

    const validRoles = ["customer", "vendor", "delivery"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
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
    console.error("❌ Change Role Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

module.exports = router;