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
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["vegetables", "fruits", "dairy", "grocery", "bakery", "beverages", "snacks", "other"],
      default: "other",
    },
    images: [
      {
        type: String,
      },
    ],
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      default: null,
    },
    quantity: {
      type: String,
      default: "1",
    },
    unit: {
      type: String,
      enum: ["kg", "g", "L", "ml", "pcs", "dozen", "pack"],
      default: "pcs",
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for search
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);