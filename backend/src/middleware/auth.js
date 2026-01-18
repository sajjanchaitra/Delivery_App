const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "quickmart-secret-123";

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

/**
 * Role Check Middleware
 */
const isVendor = (req, res, next) => {
  if (req.user?.role !== "vendor") {
    return res.status(403).json({
      success: false,
      error: "Vendor access only",
    });
  }
  next();
};

const isCustomer = (req, res, next) => {
  if (req.user?.role !== "customer") {
    return res.status(403).json({
      success: false,
      error: "Customer access only",
    });
  }
  next();
};

const isDelivery = (req, res, next) => {
  if (req.user?.role !== "delivery") {
    return res.status(403).json({
      success: false,
      error: "Delivery access only",
    });
  }
  next();
};

module.exports = {
  auth,
  isVendor,
  isCustomer,
  isDelivery,
  JWT_SECRET,
};