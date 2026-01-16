const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number,
    quantity: Number,
    unit: String,
  }],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
    default: "pending" 
  },
  paymentMethod: { type: String, default: "COD" },
  paymentStatus: { type: String, default: "pending" },
  deliveryAddress: {
    street: String,
    city: String,
    pincode: String,
  },
  customerPhone: String,
  customerName: String,
  deliveredAt: Date,
}, { timestamps: true });

orderSchema.pre("save", async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);