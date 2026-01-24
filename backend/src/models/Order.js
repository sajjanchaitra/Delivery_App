// backend/src/models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true },
  image: { type: String, default: "" },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: "" },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
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

    // Status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "assigned",
        "picked_up",
        "on_the_way",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    statusHistory: [statusHistorySchema],

    // Delivery Address
    deliveryAddress: {
      street: { type: String, required: true },
      landmark: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      pincode: { type: String, required: true },
      coordinates: {
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 },
      },
    },

    // Contact
    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },

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
    paymentId: { type: String, default: "" },

    // Timestamps
    confirmedAt: { type: Date },
    preparedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },

    // Notes
    customerNote: { type: String, default: "" },
    vendorNote: { type: String, default: "" },
    cancellationReason: { type: String, default: "" },
    cancelledBy: {
      type: String,
      enum: ["customer", "vendor", "admin", "system", ""],
      default: "",
    },

    // Ratings
    customerRating: {
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String, default: "" },
      createdAt: { type: Date },
    },
    deliveryRating: {
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String, default: "" },
      createdAt: { type: Date },
    },

    // Estimated times
    estimatedDeliveryTime: { type: String, default: "30-45 mins" },
    actualDeliveryTime: { type: Number },
  },
  { timestamps: true }
);

// ✅ FIXED: Generate order number before saving
// Remove 'next' parameter when using async/await
orderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.orderNumber = `ORD${year}${month}${day}${random}`;
  }
  // ✅ No next() call needed with async functions
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ store: 1, createdAt: -1 });
orderSchema.index({ vendor: 1, status: 1 });
orderSchema.index({ deliveryPartner: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);