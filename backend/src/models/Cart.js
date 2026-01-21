// backend/src/models/Cart.js
// COPY THIS FILE TO: backend/src/models/Cart.js

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// Calculate total price
cartSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => {
    if (item.product) {
      const price = item.product.discountPrice || item.product.salePrice || item.product.price;
      return total + (price * item.quantity);
    }
    return total;
  }, 0);
};

module.exports = mongoose.model('Cart', cartSchema);