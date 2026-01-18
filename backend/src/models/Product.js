// backend/src/models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    images: [{ type: String }],
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      default: "",
    },
    // Pricing
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      default: null,
    },
    // Quantity & Unit
    quantity: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      enum: ["kg", "g", "ml", "l", "piece", "dozen", "pack", "box"],
      default: "piece",
    },
    // Stock
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 100,
    },
    // Variants
    variants: [{
      name: { type: String },
      price: { type: Number },
      discountPrice: { type: Number },
      stockQuantity: { type: Number, default: 100 },
      inStock: { type: Boolean, default: true },
    }],
    // Tags
    tags: [{ type: String }],
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Ratings
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    // Stats
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
productSchema.index({ store: 1, isActive: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);