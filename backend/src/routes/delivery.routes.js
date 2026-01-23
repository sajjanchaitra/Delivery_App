// backend/src/routes/delivery.routes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Store = require("../models/Store");

// Import auth middleware
const { auth } = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// ============================================
// DELIVERY PARTNER ROUTES
// ============================================

// GET /api/delivery/profile - Get delivery partner profile
router.get("/profile", async (req, res) => {
  try {
    const deliveryPartnerId = req.userId;
    console.log("🚚 GET /api/delivery/profile -", deliveryPartnerId);

    const driver = await User.findById(deliveryPartnerId).select("-password").lean();

    if (!driver) {
      return res.status(404).json({ success: false, error: "Driver not found" });
    }

    res.json({ success: true, driver });
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/delivery/status - Update online status
router.put("/status", async (req, res) => {
  try {
    const deliveryPartnerId = req.userId;
    const { isOnline } = req.body;
    console.log("🚚 PUT /api/delivery/status -", isOnline);

    await User.findByIdAndUpdate(deliveryPartnerId, { isOnline });

    res.json({ success: true, message: `Status updated to ${isOnline ? "online" : "offline"}` });
  } catch (error) {
    console.error("❌ Error updating status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/delivery/available-orders - Get orders ready for pickup
router.get("/available-orders", async (req, res) => {
  try {
    const deliveryPartnerId = req.userId;
    console.log("🚚 GET /api/delivery/available-orders");

    // Get orders that are ready and not assigned
    const orders = await Order.find({
      status: "ready",
      deliveryPartner: null,
    })
      .populate("store", "name phone address image")
      .populate("customer", "name phone")
      .sort({ createdAt: 1 })
      .limit(20)
      .lean();

    console.log(`✅ Found ${orders.length} available orders`);
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error fetching available orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/delivery/my-orders - Get delivery partner's assigned orders
router.get("/my-orders", async (req, res) => {
  try {
    const deliveryPartnerId = req.userId;
    const { status, page = 1, limit = 20 } = req.query;
    console.log("🚚 GET /api/delivery/my-orders -", status);

    const query = { deliveryPartner: deliveryPartnerId };

    if (status === "active") {
      query.status = { $in: ["assigned", "picked_up", "on_the_way"] };
    } else if (status && status !== "all") {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("store", "name phone address image")
      .populate("customer", "name phone")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(query);

    // Get active orders count
    const activeCount = await Order.countDocuments({
      deliveryPartner: deliveryPartnerId,
      status: { $in: ["assigned", "picked_up", "on_the_way"] },
    });

    res.json({
      success: true,
      orders,
      activeCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching delivery orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/delivery/orders - Get orders (for backward compatibility)
router.get("/orders", async (req, res) => {
  try {
    const deliveryPartnerId = req.userId;
    const { status } = req.query;
    console.log("🚚 GET /api/delivery/orders -", status);

    if (status === "new") {
      // Return available orders
      const orders = await Order.find({
        status: "ready",
        deliveryPartner: null,
      })
        .populate("store", "name phone address image")
        .populate("customer", "name phone")
        .sort({ createdAt: 1 })
        .limit(20)
        .lean();

      return res.json({ success: true, orders });
    }

    // Return my orders
    const query = { deliveryPartner: deliveryPartnerId };

    if (status === "active") {
      query.status = { $in: ["assigned", "picked_up", "on_the_way"] };
    } else if (status && status !== "all") {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("store", "name phone address image")
      .populate("customer", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/delivery/accept/:orderId - Accept/Pick an order
router.post("/accept/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryPartnerId = req.userId;
    console.log("🚚 POST /api/delivery/accept -", orderId);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status !== "ready") {
      return res
        .status(400)
        .json({ success: false, error: "Order is not ready for pickup" });
    }

    if (order.deliveryPartner) {
      return res
        .status(400)
        .json({ success: false, error: "Order already assigned" });
    }

    // Check if delivery partner has too many active orders
    const activeOrders = await Order.countDocuments({
      deliveryPartner: deliveryPartnerId,
      status: { $in: ["assigned", "picked_up", "on_the_way"] },
    });

    if (activeOrders >= 3) {
      return res.status(400).json({
        success: false,
        error:
          "You have too many active orders. Complete some before accepting more.",
      });
    }

    order.deliveryPartner = deliveryPartnerId;
    order.status = "assigned";
    order.statusHistory.push({
      status: "assigned",
      timestamp: new Date(),
      note: "Delivery partner assigned",
      updatedBy: deliveryPartnerId,
    });

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate("store", "name phone address image")
      .populate("customer", "name phone")
      .lean();

    console.log(`✅ Order ${order.orderNumber} assigned to delivery partner`);
    res.json({ success: true, message: "Order accepted", order: updatedOrder });
  } catch (error) {
    console.error("❌ Error accepting order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/delivery/orders/:orderId/accept - Alternative accept endpoint
router.post("/orders/:orderId/accept", async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryPartnerId = req.userId;
    console.log("🚚 POST /api/delivery/orders/:orderId/accept -", orderId);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status !== "ready") {
      return res
        .status(400)
        .json({ success: false, error: "Order is not ready for pickup" });
    }

    if (order.deliveryPartner) {
      return res
        .status(400)
        .json({ success: false, error: "Order already assigned" });
    }

    order.deliveryPartner = deliveryPartnerId;
    order.status = "assigned";
    order.statusHistory.push({
      status: "assigned",
      timestamp: new Date(),
      note: "Delivery partner assigned",
      updatedBy: deliveryPartnerId,
    });

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate("store", "name phone address image")
      .populate("customer", "name phone")
      .lean();

    res.json({ success: true, message: "Order accepted", order: updatedOrder });
  } catch (error) {
    console.error("❌ Error accepting order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/delivery/orders/:orderId/reject - Reject an order
router.post("/orders/:orderId/reject", async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("🚚 POST /api/delivery/orders/:orderId/reject -", orderId);

    // For now, just acknowledge the rejection
    // In a real app, you might track rejected orders or reassign
    res.json({ success: true, message: "Order rejected" });
  } catch (error) {
    console.error("❌ Error rejecting order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/delivery/orders/:orderId/status - Update delivery status
router.patch("/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const deliveryPartnerId = req.userId;

    const order = await Order.findOne({
      _id: orderId,
      deliveryPartner: deliveryPartnerId,
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Validate status transition
    const validTransitions = {
      assigned: ["picked_up"],
      picked_up: ["on_the_way"],
      on_the_way: ["delivered"],
    };

    if (!validTransitions[order.status]?.includes(status)) {
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
      updatedBy: deliveryPartnerId,
    });

    // Set timestamps
    if (status === "picked_up") order.pickedUpAt = new Date();
    if (status === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus =
        order.paymentMethod === "cod" ? "paid" : order.paymentStatus;

      // Calculate actual delivery time
      const pickupTime = order.pickedUpAt || order.createdAt;
      order.actualDeliveryTime = Math.round((new Date() - pickupTime) / 60000);

      // Update store stats
      await Store.findByIdAndUpdate(order.store, {
        $inc: { "stats.totalRevenue": order.total },
      });
    }

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate("store", "name phone address")
      .populate("customer", "name phone")
      .lean();

    console.log(`✅ Delivery status updated to ${status}`);
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("❌ Error updating delivery status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/delivery/stats - Get delivery partner statistics
router.get("/stats", async (req, res) => {
  try {
    const deliveryPartnerId = req.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalDeliveries, todayDeliveries, activeOrders, earnings] =
      await Promise.all([
        Order.countDocuments({
          deliveryPartner: deliveryPartnerId,
          status: "delivered",
        }),
        Order.countDocuments({
          deliveryPartner: deliveryPartnerId,
          status: "delivered",
          deliveredAt: { $gte: today },
        }),
        Order.countDocuments({
          deliveryPartner: deliveryPartnerId,
          status: { $in: ["assigned", "picked_up", "on_the_way"] },
        }),
        Order.aggregate([
          {
            $match: {
              deliveryPartner: new mongoose.Types.ObjectId(deliveryPartnerId),
              status: "delivered",
            },
          },
          { $group: { _id: null, total: { $sum: "$deliveryFee" } } },
        ]),
      ]);

    // Calculate today's earnings
    const todayEarningsResult = await Order.aggregate([
      {
        $match: {
          deliveryPartner: new mongoose.Types.ObjectId(deliveryPartnerId),
          status: "delivered",
          deliveredAt: { $gte: today },
        },
      },
      { $group: { _id: null, total: { $sum: "$deliveryFee" } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalDeliveries,
        todayDeliveries,
        activeOrders,
        totalEarnings: earnings[0]?.total || 0,
        todayEarnings: todayEarningsResult[0]?.total || 0,
        rating: 4.5, // Placeholder - calculate from order ratings
      },
    });
  } catch (error) {
    console.error("❌ Error fetching delivery stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/delivery/order/:orderId - Get single order details
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryPartnerId = req.userId;

    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { deliveryPartner: deliveryPartnerId },
        { status: "ready", deliveryPartner: null },
      ],
    })
      .populate("store", "name phone address image")
      .populate("customer", "name phone")
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

module.exports = router;