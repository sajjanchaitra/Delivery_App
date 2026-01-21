// backend/src/server.js
// COMPLETE WORKING VERSION

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// DATABASE CONNECTION
// ============================================
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery_app';
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// ============================================
// IMPORT ROUTES (with error handling)
// ============================================

// Helper function to safely load routes
const loadRoute = (routePath, routeName) => {
  try {
    return require(routePath);
  } catch (error) {
    console.warn(`⚠️  Could not load ${routeName}: ${error.message}`);
    // Return empty router
    return express.Router();
  }
};

const authRoutes = loadRoute('./routes/auth.routes', 'auth.routes');
const customerRoutes = loadRoute('./routes/customer.routes', 'customer.routes');
const cartRoutes = loadRoute('./routes/cart', 'cart');
const orderRoutes = loadRoute('./routes/orders', 'orders');
const storeRoutes = loadRoute('./routes/stores', 'stores');
const productRoutes = loadRoute('./routes/products', 'products');
const vendorRoutes = loadRoute('./routes/vendor.routes', 'vendor.routes');
const deliveryRoutes = loadRoute('./routes/delivery.routes', 'delivery.routes');
const uploadRoutes = loadRoute('./routes/upload.routes', 'upload.routes');

// ============================================
// REGISTER ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/upload', uploadRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Delivery App API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('==========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`📍 Network: http://0.0.0.0:${PORT}`);
  console.log('==========================================');
  console.log('');
  console.log('📌 Available Routes:');
  console.log('   GET  /api/health');
  console.log('   POST /api/auth/send-otp');
  console.log('   POST /api/auth/verify-otp');
  console.log('   GET  /api/customer/categories');
  console.log('   GET  /api/customer/stores');
  console.log('   GET  /api/customer/products');
  console.log('   GET  /api/cart');
  console.log('   POST /api/cart/add');
  console.log('');
});

module.exports = app;