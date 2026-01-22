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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================
// Import routes
const authRoutes = require('./routes/auth.routes');
// const cartRoutes = require('./routes/cart.routes');
const customerRoutes = require('./routes/customer.routes');
const deliveryRoutes = require('./routes/delivery.routes');
// const ordersRoutes = require('./routes/orders.routes');
// const productsRoutes = require('./routes/products.routes');
// const storesRoutes = require('./routes/stores.routes');
// const uploadRoutes = require('./routes/upload.routes');
const vendorRoutes = require('./routes/vendor.routes');

// Register routes
app.use('/api/auth', authRoutes);
// app.use('/api/cart', cartRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/delivery', deliveryRoutes);
// app.use('/api/orders', ordersRoutes);
// app.use('/api/products', productsRoutes);
// app.use('/api/stores', storesRoutes);
// app.use('/api/upload', uploadRoutes);
app.use('/api/vendor', vendorRoutes);

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