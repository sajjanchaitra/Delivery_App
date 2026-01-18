const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Remove index: true
    },
    otp: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index is OK here
      index: { expires: 600 },
    },
  },
  { timestamps: true }
);

// Define index separately (not in field definition)
otpSchema.index({ phone: 1 });

module.exports = mongoose.model("OTP", otpSchema);