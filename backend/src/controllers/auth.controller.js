// backend/src/controllers/auth.controller.js
const admin = require("../config/firebase");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "quickmart-secret-key-2024";

// ==================== CHECK IF PHONE IS ADMIN ====================
const checkAdmin = async (req, res) => {
  try {
    const { phone } = req.body;

    console.log("🔍 Checking if phone is admin:", phone);

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

    if (user) {
      console.log("✅ Admin found:", user.name);
    } else {
      console.log("ℹ️ Not an admin");
    }

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
};

// ==================== ADMIN LOGIN WITH PASSWORD ====================
const adminLogin = async (req, res) => {
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
      { 
        userId: user._id,
        id: user._id, 
        role: user.role,
        phone: user.phone,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log("✅ Admin logged in successfully!");

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          id: user._id,
          phone: user.phone,
          name: user.name,
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
};

// ==================== FIREBASE OTP LOGIN ====================
const firebaseLogin = async (req, res) => {
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
        id: user._id.toString(),
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
          id: user._id,
          phone: user.phone,
          name: user.name,
          role: user.role,
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
};

// OTP Login - Original method (keep for backward compatibility)
const otpLogin = async (req, res) => {
  try {
    const { firebaseToken, phone, role = "customer" } = req.body;

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
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      console.log("✅ Firebase token verified for:", decodedToken.phone_number);
    } catch (firebaseError) {
      console.error("❌ Firebase token verification failed:", firebaseError);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired Firebase token",
      });
    }

    // Check if phone from token matches provided phone
    const tokenPhone = decodedToken.phone_number?.replace("+91", "");
    if (tokenPhone !== phone) {
      return res.status(401).json({
        success: false,
        error: "Phone number mismatch",
      });
    }

    // Find or Create User in MongoDB
    let user = await User.findOne({ phone });

    if (user) {
      // Existing user - Update role if different
      console.log("✅ Existing user found:", user._id);
      
      // Optionally update role (uncomment if you want role switching)
      // if (user.role !== role) {
      //   user.role = role;
      //   await user.save();
      // }
    } else {
      // New user - Create account
      user = await User.create({
        phone,
        role,
        name: "", // Can be updated later in profile
      });
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
      { expiresIn: "30d" } // Token valid for 30 days
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: user.isNew ? "Account created successfully" : "Login successful",
      token: jwtToken,
      user: {
        _id: user._id,
        phone: user.phone,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error("❌ OTP Login Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error. Please try again.",
    });
  }
};

// ==================== UPDATE FCM TOKEN ====================
const updateFCMToken = async (req, res) => {
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
};

// Get Current User (Protected Route)
const getMe = async (req, res) => {
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
      data: {
        _id: user._id,
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        email: user.email || "",
        profileImage: user.profileImage || "",
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
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
      data: {
        _id: user._id,
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        email: user.email || "",
        profileImage: user.profileImage || "",
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Logout
const logout = async (req, res) => {
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
};

// Validate Token
const validateToken = async (req, res) => {
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
};

module.exports = {
  checkAdmin,        // NEW
  adminLogin,        // NEW
  firebaseLogin,     // NEW
  updateFCMToken,    // NEW
  validateToken,     // NEW
  otpLogin,          // EXISTING
  getMe,             // EXISTING
  updateProfile,     // EXISTING (enhanced)
  logout,            // EXISTING (enhanced)
};