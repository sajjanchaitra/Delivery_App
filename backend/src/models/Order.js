// backend/src/models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: { type: String, default: "" },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: String, default: "" },
  total: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    items: [orderItemSchema],
    // Pricing
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    // Coupon
    coupon: {
      code: { type: String, default: "" },
      discount: { type: Number, default: 0 },
    },
    // Delivery address
    deliveryAddress: {
      type: { type: String, default: "home" },
      address: { type: String, required: true },
      landmark: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" },
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    customerInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    // Status
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "picked_up", "out_for_delivery", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    statusHistory: [{
      status: { type: String },
      timestamp: { type: Date, default: Date.now },
      note: { type: String, default: "" },
    }],
    // Payment
    paymentMethod: {
      type: String,
      enum: ["cod", "online", "wallet"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    // Delivery
    estimatedDeliveryTime: { type: String, default: "30-45 mins" },
    actualDeliveryTime: { type: Date },
    deliveryOtp: { type: String, default: "" },
    // Notes
    customerNote: { type: String, default: "" },
    vendorNote: { type: String, default: "" },
    cancellationReason: { type: String, default: "" },
    // Rating
    rating: {
      overall: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      delivery: { type: Number, default: 0 },
      review: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ store: 1, createdAt: -1 });
orderSchema.index({ vendor: 1, createdAt: -1 });
orderSchema.index({ deliveryPartner: 1, status: 1 });
orderSchema.index({ status: 1 });

// Generate order number
orderSchema.pre("save", async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);