// backend/src/routes/auth.routes.js
// Add this test-login endpoint to your existing auth routes

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path to your User model

// Your existing auth routes here...
// router.post('/send-otp', ...)
// router.post('/verify-otp', ...)

// ============================================
// 🧪 TEST LOGIN ENDPOINT - DEVELOPMENT ONLY
// ============================================
// This generates real JWT tokens for testing without Firebase OTP
router.post('/test-login', async (req, res) => {
  try {
    // ⚠️ ONLY ENABLE IN DEVELOPMENT
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Test login is only available in development mode'
      });
    }

    const { phone, role, testMode } = req.body;

    console.log('🧪 Test Login Request:', { phone, role, testMode });

    // Validate request
    if (!testMode) {
      return res.status(400).json({
        success: false,
        error: 'Test mode flag required'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number required'
      });
    }

    // Check if user exists
    let user = await User.findOne({ phone });

    if (!user) {
      // Create test user if doesn't exist
      console.log('📝 Creating new test user...');
      user = await User.create({
        phone,
        role: role || 'customer',
        name: `Test ${(role || 'customer').charAt(0).toUpperCase() + (role || 'customer').slice(1)}`,
        email: `test_${phone}@test.com`,
        isTestUser: true, // Flag to identify test users
        createdAt: new Date(),
      });
      console.log('✅ Test user created:', user._id);
    } else {
      console.log('✅ Using existing user:', user._id);
      
      // Update role if changed
      if (role && user.role !== role) {
        user.role = role;
        user.name = `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`;
        await user.save();
        console.log('🔄 Updated user role to:', role);
      }
    }

    // Generate real JWT token (same as your verify-otp endpoint)
    const token = jwt.sign(
      {
        id: user._id.toString(),
        phone: user.phone,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-jwt-secret-key-here',
      { expiresIn: '30d' }
    );

    console.log('✅ Test token generated successfully');

    // Return response (same format as your real auth)
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          _id: user._id.toString(),
          phone: user.phone,
          name: user.name,
          role: user.role,
          email: user.email,
          address: user.address,
          isTestUser: true,
        }
      },
      message: '🧪 Test login successful'
    });

  } catch (error) {
    console.error('❌ Test login error:', error);
    res.status(500).json({
      success: false,
      error: 'Test login failed',
      message: error.message
    });
  }
});

module.exports = router;

// ============================================
// SETUP INSTRUCTIONS:
// ============================================
// 1. Make sure you have a User model at '../models/User'
// 2. Set JWT_SECRET in your .env file
// 3. Make sure NODE_ENV is NOT 'production' for testing
// 4. This route is already registered in server.js as:
//    app.use('/api/auth', authRoutes);
// 5. Test endpoint at: POST http://localhost:5000/api/auth/test-login