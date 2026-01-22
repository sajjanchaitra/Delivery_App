// backend/src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Express app
const app = express();

// ==================== MIDDLEWARE ====================
// CORS - Allow requests from your mobile app
app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================
// Import routes - with error handling
let authRoutes, cartRoutes, customerRoutes, deliveryRoutes, ordersRoutes;
let productsRoutes, storesRoutes, uploadRoutes, vendorRoutes;

try {
  authRoutes = require('./routes/auth.routes');
  console.log('✅ Auth routes loaded');
} catch (err) {
  console.error('❌ Error loading auth routes:', err.message);
}

try {
  cartRoutes = require('./routes/cart.routes');
  console.log('✅ Cart routes loaded');
} catch (err) {
  console.error('❌ Error loading cart routes:', err.message);
}

try {
  customerRoutes = require('./routes/customer.routes');
  console.log('✅ Customer routes loaded');
} catch (err) {
  console.error('❌ Error loading customer routes:', err.message);
}

try {
  deliveryRoutes = require('./routes/delivery.routes');
  console.log('✅ Delivery routes loaded');
} catch (err) {
  console.error('❌ Error loading delivery routes:', err.message);
}

try {
  ordersRoutes = require('./routes/order.routes');
  console.log('✅ Orders routes loaded');
} catch (err) {
  console.error('❌ Error loading orders routes:', err.message);
}

try {
  uploadRoutes = require('./routes/upload.routes');
  console.log('✅ Upload routes loaded');
} catch (err) {
  console.error('❌ Error loading upload routes:', err.message);
}

try {
  vendorRoutes = require('./routes/vendor.routes');
  console.log('✅ Vendor routes loaded');
} catch (err) {
  console.error('❌ Error loading vendor routes:', err.message);
}

// Register routes only if they loaded successfully
if (authRoutes) app.use('/api/auth', authRoutes);
if (cartRoutes) app.use('/api/cart', cartRoutes);
if (customerRoutes) app.use('/api/customer', customerRoutes);
if (deliveryRoutes) app.use('/api/delivery', deliveryRoutes);
if (ordersRoutes) app.use('/api/orders', ordersRoutes);
if (uploadRoutes) app.use('/api/upload', uploadRoutes);
if (vendorRoutes) app.use('/api/vendor', vendorRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Delivery App API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery_app';
    
    // These options are no longer needed in Mongoose 6+
    await mongoose.connect(mongoURI);

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    app.listen(PORT, HOST, () => {
      console.log('\n🚀 ================================');
      console.log(`   Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`   Network: http://${HOST}:${PORT}`);
      console.log('   ================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = app;