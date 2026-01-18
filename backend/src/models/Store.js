// backend/src/models/Store.js
const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One store per vendor
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    images: [{ type: String }],
    category: {
      type: String,
      enum: ["grocery", "vegetables", "fruits", "dairy", "bakery", "meat", "fish", "pharmacy", "restaurant", "other"],
      default: "grocery",
    },
    // Contact
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: "",
    },
    // Address
    address: {
      street: { type: String, required: true },
      landmark: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      pincode: { type: String, required: true },
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    // Business hours
    businessHours: {
      monday: { open: { type: String, default: "09:00" }, close: { type: String, default: "21:00" }, isOpen: { type: Boolean, default: true } },
      tuesday: { open: { type: String, default: "09:00" }, close: { type: String, default: "21:00" }, isOpen: { type: Boolean, default: true } },
      wednesday: { open: { type: String, default: "09:00" }, close: { type: String, default: "21:00" }, isOpen: { type: Boolean, default: true } },
      thursday: { open: { type: String, default: "09:00" }, close: { type: String, default: "21:00" }, isOpen: { type: Boolean, default: true } },
      friday: { open: { type: String, default: "09:00" }, close: { type: String, default: "21:00" }, isOpen: { type: Boolean, default: true } },
      saturday: { open: { type: String, default: "09:00" }, close: { type: String, default: "21:00" }, isOpen: { type: Boolean, default: true } },
      sunday: { open: { type: String, default: "09:00" }, close: { type: String, default: "21:00" }, isOpen: { type: Boolean, default: false } },
    },
    // Delivery settings
    deliverySettings: {
      deliveryRadius: { type: Number, default: 5 },
      minimumOrder: { type: Number, default: 100 },
      deliveryFee: { type: Number, default: 30 },
      freeDeliveryAbove: { type: Number, default: 500 },
      estimatedDeliveryTime: { type: String, default: "30-45 mins" },
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    // Ratings
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    // Stats
    stats: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalProducts: { type: Number, default: 0 },
    },
    // Bank details
    bankDetails: {
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
    // Documents
    documents: {
      gstNumber: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      fssaiLicense: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Indexes
storeSchema.index({ vendor: 1 });
storeSchema.index({ location: "2dsphere" });
storeSchema.index({ category: 1 });
storeSchema.index({ isActive: 1, isApproved: 1 });

module.exports = mongoose.model("Store", storeSchema);