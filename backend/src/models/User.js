// backend/src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    name: { type: String, default: "User" },
    email: { type: String, trim: true, lowercase: true },
    profileImage: { type: String, default: "" },
    role: { 
      type: String, 
      enum: ["customer", "vendor", "delivery", "admin"], 
      default: "customer" 
    },
    
    // ✅ UPDATED: Address as object for delivery partners and vendors
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true }
    },
    
    // ✅ ADDED: Vehicle details for delivery partners
    vehicle: {
      type: { type: String },
      number: { type: String },
      model: { type: String }
    },
    
    // ✅ ADDED: Documents for delivery partners
    documents: {
      aadhar: { type: String },
      pan: { type: String },
      drivingLicense: { type: String }
    },
    
    // ✅ ADDED: Online status for delivery partners
    isOnline: { type: Boolean, default: false },
    
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    isPhoneVerified: { type: Boolean, default: false },
    isTestUser: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    lastLogout: { type: Date, default: null },
    
    // For delivery partners (legacy - can be removed if using new fields above)
    deliveryDetails: {
      vehicleType: {
        type: String,
        enum: ["bike", "scooter", "bicycle", "car"],
        default: "bike",
      },
      vehicleNumber: String,
      licenseNumber: String,
      isAvailable: { type: Boolean, default: true },
    },
    
    // Addresses for customers (multiple addresses)
    addresses: [
      {
        type: { type: String, enum: ["home", "work", "other"], default: "home" },
        label: String,
        address: String,
        landmark: String,
        city: String,
        pincode: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    
    // Favorites
    favoriteStores: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
    favoriteProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

// Index for phone lookup
userSchema.index({ phone: 1 });

// Method to get public profile
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    phone: this.phone,
    name: this.name,
    email: this.email || "",
    profileImage: this.profileImage || "",
    role: this.role,
    isPhoneVerified: this.isPhoneVerified,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);