const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Store = require("../models/Store");
const { auth, isVendor } = require("../middleware/auth");

const router = express.Router();

// POST /api/orders - Create order
router.post("/", auth, async (req, res) => {
  try {
    const { storeId, items, deliveryAddress, customerName, customerPhone } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const price = product.discountPrice || product.price;
        subtotal += price * item.quantity;
        orderItems.push({
          product: product._id,
          name: product.name,
          price,
          quantity: item.quantity,
          unit: product.unit,
        });
      }
    }

    const total = subtotal + (store.deliveryFee || 0);

    const order = new Order({
      customer: req.userId,
      store: store._id,
      vendor: store.vendor,
      items: orderItems,
      subtotal,
      deliveryFee: store.deliveryFee || 0,
      total,
      deliveryAddress,
      customerName,
      customerPhone,
    });

    await order.save();
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/my-orders - Customer's orders
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.userId })
      .populate("store", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/vendor-orders - Vendor's orders
router.get("/vendor-orders", auth, isVendor, async (req, res) => {
  try {
    const orders = await Order.find({ vendor: req.userId })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("store", "name")
      .populate("customer", "name phone");
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/status - Update status
router.patch("/:id/status", auth, isVendor, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, vendor: req.userId },
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/cancel
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ error: "Cannot cancel this order" });
    }
    
    order.status = "cancelled";
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;