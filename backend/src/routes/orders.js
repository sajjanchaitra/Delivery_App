// backend/src/routes/orders.routes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Store = require("../models/Store");
const Product = require("../models/Product");
const User = require("../models/User");

// Import auth middleware
const { auth } = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// ============================================
// CUSTOMER ROUTES
// ============================================

// POST /api/orders - Create new order (Customer)
router.post("/", async (req, res) => {
  try {
    const customerId = req.userId;
    console.log("📦 POST /api/orders - Customer:", customerId);

    const {
      deliveryAddress,
      customerPhone,
      customerName,
      customerNote,
      paymentMethod,
    } = req.body;

    // ✅ FIX: Normalize delivery address (supports both formats)
    let normalizedAddress = null;

    if (deliveryAddress) {
      // If frontend sends "street"
      if (deliveryAddress.street) {
        normalizedAddress = {
          street: deliveryAddress.street,
          landmark: deliveryAddress.landmark || "",
          city: deliveryAddress.city || "",
          state: deliveryAddress.state || "",
          pincode: deliveryAddress.pincode || "",
        };
      }
      // If frontend sends houseNo/area (your current app)
      else if (deliveryAddress.houseNo || deliveryAddress.area) {
        normalizedAddress = {
          street: `${deliveryAddress.houseNo || ""}${
            deliveryAddress.area ? ", " + deliveryAddress.area : ""
          }`.trim(),
          landmark: deliveryAddress.landmark || "",
          city: deliveryAddress.city || "",
          state: deliveryAddress.state || "",
          pincode: deliveryAddress.pincode || "",
        };
      }
    }

    // Validate required fields
    if (
      !normalizedAddress ||
      !normalizedAddress.street ||
      !normalizedAddress.city ||
      !normalizedAddress.pincode
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Delivery address is required" });
    }

    if (!customerPhone) {
      return res
        .status(400)
        .json({ success: false, error: "Phone number is required" });
    }

    // Get cart
    const cart = await Cart.findOne({ user: customerId }).populate({
      path: "items.product",
      select: "name price discountPrice salePrice images store vendor",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // Get store details
    const store = await Store.findById(cart.store).populate("vendor");
    if (!store) {
      return res.status(400).json({ success: false, error: "Store not found" });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const price =
        item.product.discountPrice ||
        item.product.salePrice ||
        item.product.price;

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      return {
        product: item.product._id,
        name: item.product.name,
        price: price,
        quantity: item.quantity,
        total: itemTotal,
        image: item.product.images?.[0] || "",
      };
    });

    const freeDeliveryAbove = store.deliverySettings?.freeDeliveryAbove || 500;
    const baseDeliveryFee = store.deliverySettings?.deliveryFee || 30;
    const deliveryFee = subtotal >= freeDeliveryAbove ? 0 : baseDeliveryFee;
    const total = subtotal + deliveryFee;

    // Create order
    const order = new Order({
      customer: customerId,
      store: store._id,
      vendor: store.vendor._id || store.vendor,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,

      // ✅ FIX: Save normalized address
      deliveryAddress: normalizedAddress,

      customerPhone,
      customerName: customerName || "Customer",
      customerNote: customerNote || "",
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Order placed by customer",
        },
      ],
      estimatedDeliveryTime:
        store.deliverySettings?.estimatedDeliveryTime || "30-45 mins",
    });

    await order.save();

    // Clear cart
    cart.items = [];
    cart.store = null;
    await cart.save();

    // Update store stats
    await Store.findByIdAndUpdate(store._id, {
      $inc: { "stats.totalOrders": 1 },
    });

    console.log("✅ Order created:", order.orderNumber);

    // Populate and return
    const populatedOrder = await Order.findById(order._id)
      .populate("store", "name phone address image logo")
      .populate("customer", "name phone email");

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/orders - Get customer's orders
router.get("/", async (req, res) => {
  try {
    const customerId = req.userId;
    const { status, page = 1, limit = 20 } = req.query;
    console.log("📦 GET /api/orders - Customer:", customerId);

    const query = { customer: customerId };
    if (status && status !== "all") {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("store", "name phone image logo")
      .populate("deliveryPartner", "name phone")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(query);

    console.log(`✅ Found ${orders.length} orders`);
    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/orders/:orderId - Get single order
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("📦 GET /api/orders/:orderId -", orderId);

    const order = await Order.findById(orderId)
      .populate("store", "name phone address image logo")
      .populate("customer", "name phone email")
      .populate("deliveryPartner", "name phone")
      .populate("items.product", "name images")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/orders/:orderId/cancel - Cancel order (Customer)
router.patch("/:orderId/cancel", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const customerId = req.userId;

    const order = await Order.findOne({ _id: orderId, customer: customerId });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: "Order cannot be cancelled at this stage",
      });
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by customer";
    order.cancelledBy = "customer";
    order.statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      note: reason || "Cancelled by customer",
      updatedBy: customerId,
    });

    await order.save();

    console.log("✅ Order cancelled:", order.orderNumber);
    res.json({ success: true, message: "Order cancelled", order });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/orders/:orderId/rate - Rate order (Customer)
router.post("/:orderId/rate", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review, type } = req.body;
    const customerId = req.userId;

    const order = await Order.findOne({ _id: orderId, customer: customerId });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        error: "Can only rate delivered orders",
      });
    }

    if (type === "delivery" && order.deliveryPartner) {
      order.deliveryRating = {
        rating,
        review: review || "",
        createdAt: new Date(),
      };
    } else {
      order.customerRating = {
        rating,
        review: review || "",
        createdAt: new Date(),
      };

      const store = await Store.findById(order.store);
      if (store) {
        const newCount = (store.rating?.count || 0) + 1;
        const currentAvg = store.rating?.average || 0;
        const newAverage = (currentAvg * (newCount - 1) + rating) / newCount;
        store.rating = { average: newAverage, count: newCount };
        await store.save();
      }
    }

    await order.save();

    res.json({ success: true, message: "Rating submitted", order });
  } catch (error) {
    console.error("❌ Error rating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
