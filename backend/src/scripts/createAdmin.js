// backend/scripts/create-admin.js
// Run this script to create an admin user in your database

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import User model
const User = require("../src/models/User");

// Admin credentials - CHANGE THESE!
const ADMIN_PHONE = "+919876543210";  // ← CHANGE THIS
const ADMIN_PASSWORD = "Admin@123";    // ← CHANGE THIS
const ADMIN_NAME = "Admin";

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/quickmart";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ phone: ADMIN_PHONE });
    
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("   Phone:", existingAdmin.phone);
      console.log("   Name:", existingAdmin.name);
      console.log("   Role:", existingAdmin.role);
      
      // Update password if needed
      const updatePassword = true; // Set to true to update password
      if (updatePassword) {
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        existingAdmin.password = hashedPassword;
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("✅ Admin password updated!");
      }
      
      mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    const admin = new User({
      phone: ADMIN_PHONE,
      name: ADMIN_NAME,
      password: hashedPassword,
      role: "admin",
      isPhoneVerified: true,
      isActive: true,
    });

    await admin.save();

    console.log("✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📱 Phone:", ADMIN_PHONE);
    console.log("🔑 Password:", ADMIN_PASSWORD);
    console.log("👤 Name:", ADMIN_NAME);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  IMPORTANT: Change the password in production!");

    mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    mongoose.disconnect();
  }
}

// Run the script
createAdmin();