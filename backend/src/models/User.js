const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Remove "index: true" from here
    },
    firebaseUid: {
      type: String,
      sparse: true,
      // Remove "index: true" from here
    },
    role: {
      type: String,
      enum: ["customer", "vendor", "delivery"],
      required: true,
      default: "customer",
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      sparse: true,
      // Remove "index: true" from here
    },
    profileImage: {
      type: String,
      default: "",
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    lastLogout: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Define indexes here (not in field definitions)
userSchema.index({ phone: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ email: 1 }, { sparse: true });

module.exports = mongoose.model("User", userSchema);