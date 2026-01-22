// backend/src/routes/auth.routes.js
const express = require('express');
const mongoose = require("mongoose");

const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// ==================== EXISTING ROUTES ====================
// OTP Login with Firebase
router.post('/otp-login', authController.otpLogin);

// Temporarily commented out to debug - uncomment after fixing auth middleware
// Get current user profile (Protected)
// router.get('/me', auth, authController.getMe);

// Update user profile (Protected)
// router.put('/profile', auth, authController.updateProfile);

// Logout (Protected)
// router.post('/logout', auth, authController.logout);

// ==================== TEST LOGIN ENDPOINT ====================
// 🧪 For development and testing only - bypasses Firebase OTP
router.post('/test-login', async (req, res) => {
  try {
    // Only enable in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Test login is only available in development mode'
      });
    }

   const { phone, role } = req.body;

    console.log('🧪 Test Login Request:', { phone, role, testMode });

    // Validate request
  if (!phone) {
  return res.status(400).json({
    success: false,
    error: "Phone number required"
  });
}


    // Validate phone format (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be 10 digits'
      });
    }

    // Validate role
    const validRoles = ['customer', 'vendor', 'delivery'];
    const userRole = role || 'customer';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be customer, vendor, or delivery'
      });
    }

    // Find or create user
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      console.log('📝 Creating new test user...');
      user = await User.create({
        phone,
        role: userRole,
        name: `Test ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`,
      });
      isNewUser = true;
      console.log('✅ Test user created:', user._id);
    } else {
      console.log('✅ Using existing user:', user._id);
      
      // Update role if changed
      if (role && user.role !== userRole) {
        user.role = userRole;
        user.name = `Test ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`;
        await user.save();
        console.log('🔄 Updated user role to:', userRole);
      }
    }

    // Generate JWT token (using userId to match your auth controller)
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        phone: user.phone,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Test token generated successfully');

    // Return response (matching your controller's response format)
    res.status(200).json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      token: token,
      user: {
        _id: user._id.toString(),
        phone: user.phone,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error('❌ Test login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again.',
    });
  }
});

module.exports = router;