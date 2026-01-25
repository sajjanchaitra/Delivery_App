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

// ==================== BULK UPLOAD ====================

const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");

// Configure multer for bulk upload
const bulkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/excel";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const bulkUpload = multer({
  storage: bulkStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// POST /api/vendor/products/bulk-upload
router.post("/products/bulk-upload", bulkUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { storeType = "general" } = req.body;
    console.log(`📤 Processing bulk upload for ${storeType} store`);

    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      // Clean up
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, error: "Excel file is empty" });
    }

    console.log(`📊 Found ${data.length} rows in Excel`);

    let products = [];
    let skippedCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const name = row["Product Name"] || row["Name"] || row["Medicine Name"] || row["Item Name"];
        if (!name) {
          skippedCount++;
          continue;
        }

        const productData = {
          store: store._id,
          vendor: req.userId,
          name: name.trim(),
          description: row["Description"] || "",
          category: row["Category"] || "General",
          price: parseFloat(row["Price"] || row["MRP"] || 0),
          discountPrice: parseFloat(row["Selling Price"] || row["Price"] || 0),
          quantity: row["Quantity"] || "1",
          unit: row["Unit"] || "piece",
          stock: parseInt(row["Stock"] || 0),
          stockQuantity: parseInt(row["Stock"] || 0),
          inStock: parseInt(row["Stock"] || 0) > 0,
          isActive: true,
          storeType,
          productType: storeType === "restaurant" ? "food" : storeType,
          images: row["Image URL"] ? [row["Image URL"]] : [],
        };

        // Add store-specific metadata
        if (storeType === "medical") {
          productData.meta = {
            mrp: parseFloat(row["MRP"] || 0),
            brand: row["Brand"] || row["Manufacturer"] || "",
            saltName: row["Generic Name"] || row["Salt"] || "",
            batchNo: row["Batch No"] || "",
            expiryDate: row["Expiry Date"] || "",
            prescriptionRequired: String(row["Prescription Required"]).toLowerCase() === "yes",
          };
        } else if (storeType === "restaurant") {
          productData.meta = {
            isVeg: !String(row["Veg/Non-Veg"] || "veg").toLowerCase().includes("non"),
            prepTime: parseInt(row["Prep Time"] || 0) || null,
            serves: parseInt(row["Serves"] || 0) || null,
          };
        }

        products.push(productData);
      } catch (error) {
        console.error(`Row ${i + 2} error:`, error.message);
        skippedCount++;
      }
    }

    // Insert products
    if (products.length > 0) {
      await Product.insertMany(products, { ordered: false });
      await Store.findByIdAndUpdate(store._id, {
        $inc: { "stats.totalProducts": products.length },
      });
    }

    // Delete uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.log(`✅ Uploaded ${products.length} products, skipped ${skippedCount}`);

    res.json({
      success: true,
      uploadedCount: products.length,
      skippedCount,
      message: `Successfully uploaded ${products.length} products`,
    });

  } catch (error) {
    console.error("❌ Bulk upload error:", error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vendor/templates/:type - Download template
router.get("/templates/:type", (req, res) => {
  const { type } = req.params;
  
  let headers = [];
  let sampleData = [];

  switch (type) {
    case "medical":
      headers = ["Medicine Name", "Category", "MRP", "Selling Price", "Stock", "Unit", "Brand", "Generic Name", "Batch No", "Expiry Date", "Prescription Required", "Description"];
      sampleData = [["Paracetamol 500mg", "Medicines", 25, 22, 100, "strip", "Cipla", "Paracetamol", "B001", "2025-12", "No", "For fever"]];
      break;
    case "restaurant":
      headers = ["Item Name", "Category", "Price", "Selling Price", "Veg/Non-Veg", "Prep Time", "Serves", "Description"];
      sampleData = [["Butter Chicken", "Main Course", 320, 299, "Non-Veg", 30, 2, "Creamy chicken curry"]];
      break;
    default:
      headers = ["Product Name", "Category", "Price", "Selling Price", "Stock", "Unit", "Description"];
      sampleData = [["Fresh Tomatoes", "Vegetables", 40, 35, 100, "kg", "Fresh red tomatoes"]];
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  ws["!cols"] = headers.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${type}-template.xlsx`);
  res.send(buffer);
});


module.exports = router;