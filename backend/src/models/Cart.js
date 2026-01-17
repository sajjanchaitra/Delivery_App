const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, min: 1 },
  }],
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);