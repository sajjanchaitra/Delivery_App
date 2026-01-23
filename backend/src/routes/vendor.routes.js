// backend/src/routes/vendor.routes.js
const express = require("express");
const Store = require("../models/Store");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { auth, isVendor } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication and vendor role
router.use(auth, isVendor);

// ==================== STORE MANAGEMENT ====================

// GET /api/vendor/store - Get vendor's store
router.get("/store", async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    
    if (!store) {
      return res.json({ success: true, hasStore: false, store: null });
    }

    res.json({ success: true, hasStore: true, store });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vendor/store - Create store
router.post("/store", async (req, res) => {
  try {
    // Check if vendor already has a store
    const existingStore = await Store.findOne({ vendor: req.userId });
    if (existingStore) {
      return res.status(400).json({ success: false, error: "You already have a store" });
    }

    const store = new Store({
      vendor: req.userId,
      ...req.body,
    });
    await store.save();

    res.status(201).json({ success: true, store });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
  console.log("REQ USERID:", req.userId);
console.log("REQ BODY:", req.body);

});

// PUT /api/vendor/store - Update store
router.put("/store", async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { vendor: req.userId },
      { $set: req.body },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/vendor/store/toggle - Toggle store open/close
router.patch("/store/toggle", async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    store.isOpen = !store.isOpen;
    await store.save();

    res.json({ success: true, isOpen: store.isOpen });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PRODUCT MANAGEMENT ====================

// GET /api/vendor/products - Get all products
router.get("/products", async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    const { category, inStock, search, page = 1, limit = 20 } = req.query;
    let query = { store: store._id, isActive: true };

    if (category) query.category = category;
    if (inStock !== undefined) query.inStock = inStock === "true";
    if (search) query.name = { $regex: search, $options: "i" };

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vendor/products/:id - Get single product
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      vendor: req.userId,
    });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vendor/products - Create product
router.post("/products", async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.status(404).json({ success: false, error: "Create a store first" });
    }

    const product = new Product({
      store: store._id,
      vendor: req.userId,
      ...req.body,
    });
    await product.save();

    // Update store stats
    store.stats.totalProducts += 1;
    await store.save();

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/vendor/products/:id - Update product
router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.userId },
      { $set: req.body },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/vendor/products/:id - Delete product (soft delete)
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Update store stats
    await Store.findOneAndUpdate(
      { vendor: req.userId },
      { $inc: { "stats.totalProducts": -1 } }
    );

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/vendor/products/:id/stock - Toggle stock status
router.patch("/products/:id/stock", async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      vendor: req.userId,
    });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    product.inStock = !product.inStock;
    await product.save();

    res.json({ success: true, inStock: product.inStock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add these routes to your existing vendor.routes.js

// ==================== ORDER MANAGEMENT ====================

// GET /api/vendor/orders - Get all orders for vendor's store
router.get("/orders", async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { store: store._id };

    if (status && status !== "all") {
      if (status === "active") {
        query.status = { $in: ["pending", "confirmed", "preparing", "ready"] };
      } else {
        query.status = status;
      }
    }

    const orders = await Order.find(query)
      .populate("customer", "name phone email")
      .populate("deliveryPartner", "name phone")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(query);

    // Get counts by status
    const statusCounts = await Order.aggregate([
      { $match: { store: store._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      orders,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching vendor orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vendor/orders/:orderId - Get single order details
router.get("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const store = await Store.findOne({ vendor: req.userId });

    const order = await Order.findOne({ _id: orderId, store: store._id })
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

// PATCH /api/vendor/orders/:orderId/status - Update order status
router.patch("/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const vendorId = req.userId;

    const store = await Store.findOne({ vendor: vendorId });
    const order = await Order.findOne({ _id: orderId, store: store._id });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["assigned", "picked_up"],
    };

    if (validTransitions[order.status] && !validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: vendorId,
    });

    // Set timestamps
    if (status === "confirmed") order.confirmedAt = new Date();
    if (status === "preparing") order.preparedAt = new Date();
    if (status === "cancelled") {
      order.cancelledAt = new Date();
      order.cancellationReason = note || "Cancelled by vendor";
      order.cancelledBy = "vendor";
    }

    await order.save();

    // Return updated order
    const updatedOrder = await Order.findById(orderId)
      .populate("customer", "name phone")
      .populate("deliveryPartner", "name phone")
      .lean();

    console.log(`✅ Order ${order.orderNumber} status updated to ${status}`);
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vendor/orders/stats - Get order statistics
router.get("/orders-stats", async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
    ] = await Promise.all([
      Order.countDocuments({ store: store._id }),
      Order.countDocuments({ store: store._id, createdAt: { $gte: today } }),
      Order.countDocuments({ store: store._id, status: { $in: ["pending", "confirmed", "preparing"] } }),
      Order.aggregate([
        { $match: { store: store._id, status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { store: store._id, status: "delivered", createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        todayOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching order stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DASHBOARD & STATS ====================

// GET /api/vendor/dashboard - Get dashboard stats
router.get("/dashboard", async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.json({
        success: true,
        hasStore: false,
        stats: null,
      });
    }

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's orders
    const todayOrders = await Order.find({
      store: store._id,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const todayRevenue = todayOrders
      .filter(o => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);

    // Get pending orders count
    const pendingOrders = await Order.countDocuments({
      store: store._id,
      status: { $in: ["pending", "confirmed", "preparing"] },
    });

    // Get recent orders
    const recentOrders = await Order.find({ store: store._id })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get products count
    const totalProducts = await Product.countDocuments({
      store: store._id,
      isActive: true,
    });

    const outOfStockProducts = await Product.countDocuments({
      store: store._id,
      isActive: true,
      inStock: false,
    });

    res.json({
      success: true,
      hasStore: true,
      store: {
        _id: store._id,
        name: store.name,
        isOpen: store.isOpen,
        isApproved: store.isApproved,
        rating: store.rating,
      },
      stats: {
        todayOrders: todayOrders.length,
        todayRevenue,
        pendingOrders,
        totalOrders: store.stats.totalOrders,
        totalRevenue: store.stats.totalRevenue,
        totalProducts,
        outOfStockProducts,
      },
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vendor/analytics - Get analytics
router.get("/analytics", async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    const { period = "week" } = req.query;
    
    let startDate = new Date();
    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Revenue over time
    const revenueData = await Order.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startDate },
          status: "delivered",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          sold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      analytics: {
        revenueData,
        topProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;