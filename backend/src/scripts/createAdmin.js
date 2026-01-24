const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

const ADMIN_PHONE = "1234567890"; // ✅ Set your admin phone number
const ADMIN_PASSWORD = "Admin@123"; // ✅ Set your admin password
const ADMIN_NAME = "Super Admin";
const ADMIN_EMAIL = "admin@quickmart.com";

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    let admin = await User.findOne({ phone: ADMIN_PHONE, role: "admin" });

    if (admin) {
      console.log("⚠️  Admin already exists!");
      console.log("📱 Phone:", admin.phone);
      console.log("👤 Name:", admin.name);
      
      // Update password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      admin.password = hashedPassword;
      await admin.save();
      console.log("🔐 Password updated!");
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      admin = new User({
        phone: ADMIN_PHONE,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
        isPhoneVerified: true,
        isActive: true,
      });

      await admin.save();
      console.log("✅ Admin created successfully!");
    }

    console.log("\n📋 Admin Credentials:");
    console.log("📱 Phone:", ADMIN_PHONE);
    console.log("🔐 Password:", ADMIN_PASSWORD);
    console.log("\n⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();