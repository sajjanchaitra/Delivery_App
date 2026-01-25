// backend/src/routes/vendor.routes.js
const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const Store = require("../models/Store");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { auth, isVendor } = require("../middleware/auth");

const router = express.Router();

// ==================== MULTER SETUP FOR BULK UPLOAD ====================
const bulkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/excel");
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel and CSV files allowed."));
    }
  },
});

// ==================== BULK UPLOAD ROUTE (NO MIDDLEWARE YET) ====================
// This route needs to be BEFORE router.use(auth, isVendor)
router.post("/products/bulk-upload", auth, isVendor, bulkUpload.single("file"), async (req, res) => {
  console.log("📤 Bulk upload route hit");
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { storeType = "general" } = req.body;
    console.log(`Processing bulk upload for ${storeType} store`);

    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: "Excel file is empty" });
    }

    console.log(`📊 Found ${data.length} rows`);

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
          quantity: String(row["Quantity"] || "1"),
          unit: row["Unit"] || "piece",
          stock: parseInt(row["Stock"] || 0),
          stockQuantity: parseInt(row["Stock"] || 0),
          inStock: parseInt(row["Stock"] || 0) > 0,
          isActive: true,
          storeType,
          productType: storeType === "restaurant" ? "food" : storeType,
          images: row["Image URL"] ? [row["Image URL"]] : [],
          meta: {},
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
          productData.brand = row["Brand"] || row["Manufacturer"] || "";
          productData.genericName = row["Generic Name"] || row["Salt"] || "";
          productData.prescriptionRequired = productData.meta.prescriptionRequired;
        } else if (storeType === "restaurant") {
          const isVeg = !String(row["Veg/Non-Veg"] || "veg").toLowerCase().includes("non");
          productData.meta = {
            isVeg,
            prepTime: parseInt(row["Prep Time"] || 0) || null,
            serves: parseInt(row["Serves"] || 0) || null,
          };
          productData.foodType = isVeg ? "veg" : "nonveg";
          productData.preparationTime = productData.meta.prepTime || 20;
          productData.serves = String(productData.meta.serves || "1");
        }

        products.push(productData);
      } catch (error) {
        console.error(`Row ${i + 2} error:`, error.message);
        skippedCount++;
      }
    }

    if (products.length > 0) {
      await Product.insertMany(products, { ordered: false });
      await Store.findByIdAndUpdate(store._id, {
        $inc: { "stats.totalProducts": products.length },
      });
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

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

// ==================== TEMPLATE DOWNLOAD ====================
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

// ==================== APPLY AUTH MIDDLEWARE TO OTHER ROUTES ====================
// All routes below this point require authentication and vendor role
router.use(auth, isVendor);

// ==================== STORE MANAGEMENT ====================

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

router.post("/store", async (req, res) => {
  try {
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
});

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
  console.log("📝 POST /products called");
  console.log("User ID:", req.userId);
  console.log("Body:", JSON.stringify(req.body, null, 2));
  
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

    console.log("✅ Product created successfully");
    res.status(201).json({ success: true, product });
    
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

    await Store.findOneAndUpdate(
      { vendor: req.userId },
      { $inc: { "stats.totalProducts": -1 } }
    );

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// ... (keep all your order routes and dashboard routes as they are)

router.get("/dashboard", async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.json({ success: true, hasStore: false, stats: null });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayOrders = await Order.find({
      store: store._id,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const todayRevenue = todayOrders
      .filter(o => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);

    const pendingOrders = await Order.countDocuments({
      store: store._id,
      status: { $in: ["pending", "confirmed", "preparing"] },
    });

    const recentOrders = await Order.find({ store: store._id })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 })
      .limit(5);

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

module.exports = router;