// backend/src/middleware/auth.js
// Authentication and authorization middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Main authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization header must be: Bearer <token>'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key-here');
    
    console.log('✅ Token verified for user:', decoded.id);

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is inactive'
      });
    }

    // Attach user info to request
    req.userId = user._id.toString();
    req.user = user;
    req.userRole = user.role;

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
};

// Role-based middleware
const isVendor = (req, res, next) => {
  if (req.userRole !== 'vendor') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Vendor role required.'
    });
  }
  next();
};

const isCustomer = (req, res, next) => {
  if (req.userRole !== 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Customer role required.'
    });
  }
  next();
};

const isDelivery = (req, res, next) => {
  if (req.userRole !== 'delivery') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Delivery partner role required.'
    });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Multiple roles allowed
const hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = {
  auth,
  isVendor,
  isCustomer,
  isDelivery,
  isAdmin,
  hasRole,
};

// ============================================
// USAGE EXAMPLES:
// ============================================
// 
// const { auth, isVendor, hasRole } = require('../middleware/auth');
//
// // Protect route (any authenticated user)
// router.get('/profile', auth, getProfile);
//
// // Protect route (only vendors)
// router.post('/store', auth, isVendor, createStore);
//
// // Protect route (vendors or admins)
// router.get('/analytics', auth, hasRole('vendor', 'admin'), getAnalytics);