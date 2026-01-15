const admin = require("../config/firebase");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// OTP Login - Verify Firebase Token & Create/Login User
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
      process.env.JWT_SECRET,
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

// Get Current User (Protected Route)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-__v");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
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
    const { name } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name },
      { new: true }
    ).select("-__v");

    res.status(200).json({
      success: true,
      message: "Profile updated",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Logout (Optional - For token blacklisting if needed)
const logout = async (req, res) => {
  // If you implement token blacklisting, add logic here
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = {
  otpLogin,
  getMe,
  updateProfile,
  logout,
};