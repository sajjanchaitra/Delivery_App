const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["customer", "vendor", "delivery"],
      required: true,
    },
    name: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
