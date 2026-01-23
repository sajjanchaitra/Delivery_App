// backend/src/routes/admin.routes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Store = require("../models/Store");
const Product = require("../models/Product");

// Import auth middleware
const { auth, isAdmin } = require("../middleware/auth");

// All routes require admin authentication
router.use(auth);

// ============================================
// DASHBOARD
// ============================================

// GET /api/admin/dashboard - Get admin dashboard stats
router.get("/dashboard", async (req, res) => {
  try {
    console.log("📊 GET /api/admin/dashboard");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      totalVendors,
      totalDeliveryPartners,
      totalStores,
      totalProducts,
      totalOrders,
      todayOrders,
      monthOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      recentOrders,
      topStores,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "vendor" }),
      User.countDocuments({ role: "delivery" }),
      Store.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),
      Order.countDocuments({
        status: { $in: ["pending", "confirmed", "preparing", "ready"] },
      }),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { status: "delivered", deliveredAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { status: "delivered", deliveredAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.find()
        .populate("store", "name")
        .populate("customer", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Store.find().sort({ "stats.totalRevenue": -1 }).limit(5).lean(),
    ]);

    res.json({
      success: true,
      dashboard: {
        users: {
          total: totalCustomers + totalVendors + totalDeliveryPartners,
          customers: totalCustomers,
          vendors: totalVendors,
          deliveryPartners: totalDeliveryPartners,
        },
        stores: {
          total: totalStores,
          active: totalStores,
        },
        products: {
          total: totalProducts,
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
          thisMonth: monthOrders,
          pending: pendingOrders,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0,
          thisMonth: monthRevenue[0]?.total || 0,
        },
        recentOrders,
        topStores,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching admin dashboard:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ORDERS MANAGEMENT
// ============================================

// GET /api/admin/orders - Get all orders
router.get("/orders", async (req, res) => {
  try {
    const { status, store, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status && status !== "all") query.status = status;
    if (store) query.store = store;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(query)
      .populate("store", "name")
      .populate("customer", "name phone")
      .populate("deliveryPartner", "name phone")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(query);

    // Get status counts
    const statusCounts = await Order.aggregate([
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
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/orders/:orderId - Get single order
router.get("/orders/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("store", "name phone address")
      .populate("customer", "name phone email")
      .populate("vendor", "name phone")
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

// PATCH /api/admin/orders/:orderId/status - Update order status (Admin override)
router.patch("/orders/:orderId/status", async (req, res) => {
  try {
    const { status, note } = req.body;
    const adminId = req.userId;

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status changed by admin to ${status}`,
      updatedBy: adminId,
    });

    if (status === "cancelled") {
      order.cancelledAt = new Date();
      order.cancellationReason = note || "Cancelled by admin";
      order.cancelledBy = "admin";
    }

    if (status === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus =
        order.paymentMethod === "cod" ? "paid" : order.paymentStatus;
    }

    await order.save();

    res.json({ success: true, message: "Order status updated", order });
  } catch (error) {
    console.error("❌ Error updating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/orders/:orderId/assign-delivery - Assign delivery partner
router.post("/orders/:orderId/assign-delivery", async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const deliveryPartner = await User.findOne({
      _id: deliveryPartnerId,
      role: "delivery",
    });
    if (!deliveryPartner) {
      return res
        .status(404)
        .json({ success: false, error: "Delivery partner not found" });
    }

    order.deliveryPartner = deliveryPartnerId;
    order.status = "assigned";
    order.statusHistory.push({
      status: "assigned",
      timestamp: new Date(),
      note: `Assigned to ${deliveryPartner.name} by admin`,
      updatedBy: req.userId,
    });

    await order.save();

    res.json({ success: true, message: "Delivery partner assigned", order });
  } catch (error) {
    console.error("❌ Error assigning delivery:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// USERS MANAGEMENT
// ============================================

// GET /api/admin/users - Get all users
router.get("/users", async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role && role !== "all") query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/users/:userId - Get single user
router.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .lean();
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Get user's orders if customer
    let orders = [];
    if (user.role === "customer") {
      orders = await Order.find({ customer: user._id })
        .populate("store", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    }

    // Get user's store if vendor
    let store = null;
    if (user.role === "vendor") {
      store = await Store.findOne({ vendor: user._id }).lean();
    }

    res.json({ success: true, user, orders, store });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/admin/users/:userId - Update user
router.patch("/users/:userId", async (req, res) => {
  try {
    const { isActive, role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { isActive, role } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STORES MANAGEMENT
// ============================================

// GET /api/admin/stores - Get all stores
router.get("/stores", async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status === "approved") query.isApproved = true;
    if (status === "pending") query.isApproved = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const stores = await Store.find(query)
      .populate("vendor", "name phone email")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Store.countDocuments(query);

    res.json({
      success: true,
      stores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching stores:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/admin/stores/:storeId/approve - Approve/reject store
router.patch("/stores/:storeId/approve", async (req, res) => {
  try {
    const { approved } = req.body;

    const store = await Store.findByIdAndUpdate(
      req.params.storeId,
      { isApproved: approved },
      { new: true }
    ).populate("vendor", "name phone");

    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    res.json({
      success: true,
      message: approved ? "Store approved" : "Store rejected",
      store,
    });
  } catch (error) {
    console.error("❌ Error updating store:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/delivery-partners - Get all delivery partners
router.get("/delivery-partners", async (req, res) => {
  try {
    const { available, page = 1, limit = 20 } = req.query;

    const query = { role: "delivery" };

    const partners = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    // Get active orders count for each partner
    const partnersWithStats = await Promise.all(
      partners.map(async (partner) => {
        const activeOrders = await Order.countDocuments({
          deliveryPartner: partner._id,
          status: { $in: ["assigned", "picked_up", "on_the_way"] },
        });
        const totalDeliveries = await Order.countDocuments({
          deliveryPartner: partner._id,
          status: "delivered",
        });
        return {
          ...partner,
          activeOrders,
          totalDeliveries,
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      partners: partnersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching delivery partners:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ANALYTICS
// ============================================

// GET /api/admin/analytics - Get analytics data
router.get("/analytics", async (req, res) => {
  try {
    const { period = "week" } = req.query;

    let startDate = new Date();
    if (period === "week") startDate.setDate(startDate.getDate() - 7);
    else if (period === "month") startDate.setMonth(startDate.getMonth() - 1);
    else if (period === "year")
      startDate.setFullYear(startDate.getFullYear() - 1);

    // Orders by day
    const ordersByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Top stores by revenue
    const topStores = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      {
        $group: {
          _id: "$store",
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "_id",
          as: "store",
        },
      },
      { $unwind: "$store" },
      { $project: { name: "$store.name", revenue: 1, orders: 1 } },
    ]);

    // Top products
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      analytics: {
        ordersByDay,
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        topStores,
        topProducts,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching analytics:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;