const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { auth } = require("../middleware/auth");

const router = express.Router();

// GET /api/cart
router.get("/", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId })
      .populate("items.product")
      .populate("store", "name deliveryFee");
    res.json({ success: true, cart: cart || { items: [] } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cart/add
router.post("/add", auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) return res.status(404).json({ error: "Product not found" });

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({ user: req.userId, store: product.store, items: [] });
    }

    // Clear cart if different store
    if (cart.store && cart.store.toString() !== product.store.toString()) {
      cart.items = [];
      cart.store = product.store;
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    cart.store = product.store;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product")
      .populate("store", "name deliveryFee");

    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/cart/update
router.patch("/update", auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) return res.status(404).json({ error: "Item not in cart" });

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    if (cart.items.length === 0) cart.store = null;

    await cart.save();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart/remove/:productId
router.delete("/remove/:productId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    if (cart.items.length === 0) cart.store = null;

    await cart.save();
    res.json({ success: true, message: "Item removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart/clear
router.delete("/clear", auth, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.userId }, { items: [], store: null });
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;