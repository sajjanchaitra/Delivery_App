// backend/src/routes/bulk-upload.routes.js
// Bulk Upload Routes for Excel Product Import

const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const { auth, isVendor } = require("../middleware/auth");
const Store = require("../models/Store");
const Product = require("../models/Product");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel and CSV files are allowed."));
    }
  },
});

// ==================== BULK UPLOAD ====================

// POST /api/vendor/products/bulk-upload
router.post("/bulk-upload", auth, isVendor, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { storeType = "general" } = req.body;
    console.log(`📤 Processing bulk upload for ${storeType} store`);

    // Get vendor's store
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found. Create a store first." });
    }

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, error: "Excel file is empty" });
    }

    console.log(`📊 Found ${data.length} rows in Excel`);

    // Process based on store type
    let products = [];
    let skippedCount = 0;
    let errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        let productData;

        switch (storeType) {
          case "medical":
            productData = processMedicalProduct(row, store._id, req.userId);
            break;
          case "restaurant":
            productData = processRestaurantProduct(row, store._id, req.userId);
            break;
          default:
            productData = processGeneralProduct(row, store._id, req.userId);
        }

        if (productData) {
          products.push(productData);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Row ${i + 2} error:`, error.message);
        errors.push({ row: i + 2, error: error.message });
        skippedCount++;
      }
    }

    // Insert products into database
    if (products.length > 0) {
      await Product.insertMany(products, { ordered: false });
      
      // Update store product count
      await Store.findByIdAndUpdate(store._id, {
        $inc: { "stats.totalProducts": products.length },
      });
    }

    // Delete uploaded file
    fs.unlinkSync(req.file.path);

    console.log(`✅ Uploaded ${products.length} products, skipped ${skippedCount}`);

    res.json({
      success: true,
      uploadedCount: products.length,
      skippedCount,
      errors: errors.slice(0, 10), // Return first 10 errors
      message: `Successfully uploaded ${products.length} products`,
    });

  } catch (error) {
    console.error("❌ Bulk upload error:", error);
    
    // Delete file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PRODUCT PROCESSORS ====================

// Process Medical/Pharmacy Products
function processMedicalProduct(row, storeId, vendorId) {
  const name = row["Medicine Name"] || row["Name"] || row["Product Name"];
  if (!name) return null;

  return {
    store: storeId,
    vendor: vendorId,
    name: name.trim(),
    genericName: row["Generic Name"] || row["Salt"] || "",
    description: row["Description"] || "",
    category: row["Category"] || "Medicine",
    
    price: parseFloat(row["MRP"] || row["Price"] || 0),
    discountPrice: parseFloat(row["Selling Price"] || row["Sale Price"] || row["MRP"] || 0),
    
    manufacturer: row["Manufacturer"] || row["Company"] || row["Brand"] || "",
    batchNumber: row["Batch No"] || row["Batch"] || "",
    hsnCode: row["HSN Code"] || row["HSN"] || "",
    
    expiryDate: parseExcelDate(row["Expiry Date"] || row["Expiry"]),
    manufactureDate: parseExcelDate(row["Manufacture Date"] || row["Mfg Date"]),
    
    stock: parseInt(row["Stock"] || row["Quantity"] || row["Qty"] || 0),
    unit: row["Unit"] || "strip",
    packSize: row["Pack Size"] || row["Pack"] || "1",
    
    prescriptionRequired: parseBoolean(row["Prescription Required"] || row["Rx Required"]),
    isControlled: parseBoolean(row["Controlled"] || row["Schedule H"]),
    
    images: row["Image URL"] ? [row["Image URL"]] : [],
    
    inStock: parseInt(row["Stock"] || row["Quantity"] || 0) > 0,
    isActive: true,
    productType: "medical",
  };
}

// Process Restaurant Menu Items
function processRestaurantProduct(row, storeId, vendorId) {
  const name = row["Item Name"] || row["Dish Name"] || row["Name"];
  if (!name) return null;

  return {
    store: storeId,
    vendor: vendorId,
    name: name.trim(),
    description: row["Description"] || "",
    category: row["Category"] || row["Menu Category"] || "Main Course",
    
    price: parseFloat(row["Price"] || row["MRP"] || 0),
    discountPrice: parseFloat(row["Selling Price"] || row["Offer Price"] || row["Price"] || 0),
    
    foodType: (row["Veg/Non-Veg"] || row["Type"] || "veg").toLowerCase().includes("non") ? "nonveg" : "veg",
    spiceLevel: row["Spice Level"] || "medium",
    cuisine: row["Cuisine"] || row["Cuisine Type"] || "",
    
    preparationTime: parseInt(row["Prep Time"] || row["Preparation Time"] || 20),
    serves: row["Serves"] || row["Portion"] || "1",
    
    ingredients: row["Ingredients"] ? row["Ingredients"].split(",").map(i => i.trim()) : [],
    allergens: row["Allergens"] ? row["Allergens"].split(",").map(i => i.trim()) : [],
    
    calories: parseInt(row["Calories"] || 0),
    
    images: row["Image URL"] ? [row["Image URL"]] : [],
    
    inStock: !parseBoolean(row["Not Available"]),
    isAvailable: parseBoolean(row["Available"] || "yes"),
    isActive: true,
    productType: "food",
    
    addons: [], // Can be added later
    variants: [], // Can be added later
  };
}

// Process General Store Products
function processGeneralProduct(row, storeId, vendorId) {
  const name = row["Product Name"] || row["Name"] || row["Item Name"];
  if (!name) return null;

  return {
    store: storeId,
    vendor: vendorId,
    name: name.trim(),
    description: row["Description"] || "",
    category: row["Category"] || "Grocery",
    brand: row["Brand"] || row["Company"] || "",
    
    price: parseFloat(row["MRP"] || row["Price"] || 0),
    discountPrice: parseFloat(row["Selling Price"] || row["Sale Price"] || row["MRP"] || 0),
    
    unit: row["Unit"] || "pcs",
    quantity: row["Size"] || row["Weight"] || row["Volume"] || "1",
    packSize: row["Pack Size"] || "1",
    
    stock: parseInt(row["Stock"] || row["Qty"] || row["Quantity"] || 0),
    minStock: parseInt(row["Min Stock"] || row["Reorder Level"] || 5),
    
    barcode: row["Barcode"] || row["EAN"] || "",
    sku: row["SKU"] || row["Product Code"] || "",
    hsnCode: row["HSN Code"] || row["HSN"] || "",
    
    gstRate: parseFloat(row["GST %"] || row["GST Rate"] || 0),
    
    expiryDate: parseExcelDate(row["Expiry Date"] || row["Expiry"]),
    
    images: row["Image URL"] ? [row["Image URL"]] : [],
    
    inStock: parseInt(row["Stock"] || row["Qty"] || 0) > 0,
    isActive: true,
    productType: "general",
  };
}

// ==================== HELPER FUNCTIONS ====================

function parseBoolean(value) {
  if (!value) return false;
  const str = String(value).toLowerCase().trim();
  return ["yes", "true", "1", "y"].includes(str);
}

function parseExcelDate(value) {
  if (!value) return null;
  
  // If it's a number (Excel date serial)
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return new Date(date.y, date.m - 1, date.d);
  }
  
  // Try parsing as string
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// ==================== TEMPLATE DOWNLOADS ====================

// GET /api/vendor/templates/:type
router.get("/templates/:type", (req, res) => {
  const { type } = req.params;
  
  let headers = [];
  let sampleData = [];

  switch (type) {
    case "medical":
      headers = [
        "Medicine Name", "Generic Name", "Category", "MRP", "Selling Price",
        "Manufacturer", "Batch No", "Expiry Date", "Stock", "Unit",
        "Pack Size", "Prescription Required", "HSN Code", "Description", "Image URL"
      ];
      sampleData = [
        ["Paracetamol 500mg", "Paracetamol", "Pain Relief", 25, 22,
         "Cipla", "B001", "2025-12-31", 100, "strip",
         "10 tablets", "No", "30049099", "For fever and pain", ""],
        ["Amoxicillin 250mg", "Amoxicillin", "Antibiotics", 85, 78,
         "Sun Pharma", "B002", "2025-06-30", 50, "strip",
         "10 capsules", "Yes", "30041000", "Antibiotic medication", ""]
      ];
      break;

    case "restaurant":
      headers = [
        "Item Name", "Category", "Price", "Selling Price", "Veg/Non-Veg",
        "Prep Time", "Serves", "Description", "Cuisine", "Spice Level",
        "Calories", "Ingredients", "Available", "Image URL"
      ];
      sampleData = [
        ["Butter Chicken", "Main Course", 320, 299, "Non-Veg",
         30, "2", "Creamy tomato gravy with chicken", "North Indian", "Medium",
         450, "Chicken, Butter, Cream, Tomatoes", "Yes", ""],
        ["Paneer Tikka", "Starters", 220, 199, "Veg",
         20, "2", "Grilled cottage cheese with spices", "North Indian", "Mild",
         280, "Paneer, Bell Peppers, Onions", "Yes", ""]
      ];
      break;

    case "grocery":
    case "vegetables":
    case "general":
    default:
      headers = [
        "Product Name", "Category", "Brand", "MRP", "Selling Price",
        "Unit", "Size", "Stock", "Barcode", "SKU",
        "HSN Code", "GST %", "Expiry Date", "Description", "Image URL"
      ];
      sampleData = [
        ["Tata Salt", "Grocery", "Tata", 28, 26,
         "kg", "1", 100, "8901234567890", "SALT001",
         "25010010", 5, "", "Iodised salt", ""],
        ["Amul Butter", "Dairy", "Amul", 56, 54,
         "g", "100", 50, "8901234567891", "BUTTER001",
         "04051000", 12, "2025-03-15", "Salted butter", ""]
      ];
      break;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Set column widths
  ws["!cols"] = headers.map(() => ({ wch: 18 }));

  XLSX.utils.book_append_sheet(wb, ws, "Products");

  // Generate buffer
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${type}-template.xlsx`);
  res.send(buffer);
});

module.exports = router;