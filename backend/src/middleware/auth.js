// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization required.',
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info to request
      req.userId = decoded.userId; // ⚠️ Changed from req.user to req.userId
      req.phone = decoded.phone;
      req.role = decoded.role;

      console.log('✅ Auth successful for user:', req.userId, 'Role:', req.role);
      next();
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

// Role-based middleware
const isVendor = (req, res, next) => {
  console.log('🔍 Checking vendor role for user:', req.userId, 'Role:', req.role);
  
  if (req.role !== 'vendor') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Vendor role required.',
    });
  }
  
  console.log('✅ Vendor role verified');
  next();
};

const isCustomer = (req, res, next) => {
  if (req.role !== 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Customer role required.',
    });
  }
  next();
};

const isDelivery = (req, res, next) => {
  if (req.role !== 'delivery') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Delivery partner role required.',
    });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin role required.',
    });
  }
  next();
};

// Export all middleware functions
module.exports = {
  auth,
  isVendor,
  isCustomer,
  isDelivery,
  isAdmin,
};