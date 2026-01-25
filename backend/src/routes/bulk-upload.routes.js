// backend/src/routes/bulk-upload.routes.js
// Bulk Upload Routes for Excel Product Import
// UPDATED: Only essential fields required, all others optional

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
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
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

// ==================== HELPER FUNCTIONS ====================

// Safely get string value
function getString(value, defaultVal = "") {
  if (value === null || value === undefined) return defaultVal;
  return String(value).trim();
}

// Safely get number value
function getNumber(value, defaultVal = 0) {
  if (value === null || value === undefined) return defaultVal;
  const num = parseFloat(value);
  return isNaN(num) ? defaultVal : num;
}

// Safely get integer value
function getInt(value, defaultVal = 0) {
  if (value === null || value === undefined) return defaultVal;
  const num = parseInt(value);
  return isNaN(num) ? defaultVal : num;
}

// Parse boolean from various formats
function parseBoolean(value, defaultVal = false) {
  if (value === null || value === undefined) return defaultVal;
  const str = String(value).toLowerCase().trim();
  return ["yes", "true", "1", "y"].includes(str);
}

// Parse Excel date
function parseExcelDate(value) {
  if (!value) return null;

  try {
    // If it's a number (Excel date serial)
    if (typeof value === "number") {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return new Date(date.y, date.m - 1, date.d);
      }
    }

    // Try parsing as string
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (error) {
    return null;
  }
}

// Get value from row with multiple possible column names
function getFromRow(row, possibleNames, defaultVal = "") {
  for (const name of possibleNames) {
    if (row[name] !== null && row[name] !== undefined && row[name] !== "") {
      return row[name];
    }
  }
  return defaultVal;
}

// ==================== PRODUCT PROCESSORS ====================

// Process Medical/Pharmacy Products - MINIMAL REQUIRED FIELDS
function processMedicalProduct(row, storeId, vendorId) {
  // Get name from multiple possible columns
  const name = getString(
    getFromRow(row, ["Medicine Name", "Name", "Product Name", "Item Name", "medicine name", "name"])
  );

  // Name is required
  if (!name) return null;

  // Get price - try multiple columns
  const mrp = getNumber(getFromRow(row, ["MRP", "mrp", "Price", "price"]), 0);
  const sellingPrice = getNumber(
    getFromRow(row, ["Selling Price", "selling price", "Sale Price", "sale price", "SP"]),
    mrp
  );

  // Price is required
  if (mrp <= 0 && sellingPrice <= 0) return null;

  const finalPrice = mrp > 0 ? mrp : sellingPrice;
  const finalDiscountPrice = sellingPrice > 0 ? sellingPrice : finalPrice;

  return {
    store: storeId,
    vendor: vendorId,
    name: name,
    
    // Optional fields with safe defaults
    genericName: getString(getFromRow(row, ["Generic Name", "generic name", "Salt", "salt", "Salt Name"])),
    description: getString(getFromRow(row, ["Description", "description", "Desc"])),
    category: getString(getFromRow(row, ["Category", "category", "Cat"]), "Medicine"),

    price: finalPrice,
    discountPrice: finalDiscountPrice,

    manufacturer: getString(getFromRow(row, ["Manufacturer", "manufacturer", "Company", "company", "Brand", "brand"])),
    brand: getString(getFromRow(row, ["Brand", "brand", "Manufacturer", "manufacturer"])),
    batchNumber: getString(getFromRow(row, ["Batch No", "batch no", "Batch", "batch", "Batch Number"])),
    hsnCode: getString(getFromRow(row, ["HSN Code", "hsn code", "HSN", "hsn"])),

    expiryDate: parseExcelDate(getFromRow(row, ["Expiry Date", "expiry date", "Expiry", "expiry", "Exp Date"])),
    manufactureDate: parseExcelDate(getFromRow(row, ["Manufacture Date", "manufacture date", "Mfg Date", "mfg date"])),

    stock: getInt(getFromRow(row, ["Stock", "stock", "Quantity", "quantity", "Qty", "qty"]), 10),
    stockQuantity: getInt(getFromRow(row, ["Stock", "stock", "Quantity", "quantity", "Qty", "qty"]), 10),
    unit: getString(getFromRow(row, ["Unit", "unit"]), "strip"),
    packSize: getString(getFromRow(row, ["Pack Size", "pack size", "Pack", "pack"]), "1"),

    prescriptionRequired: parseBoolean(getFromRow(row, ["Prescription Required", "prescription required", "Rx Required", "Rx"])),
    isControlled: parseBoolean(getFromRow(row, ["Controlled", "controlled", "Schedule H", "schedule h"])),

    // Image is optional
    images: getString(getFromRow(row, ["Image URL", "image url", "Image", "image"])) 
      ? [getString(getFromRow(row, ["Image URL", "image url", "Image", "image"]))] 
      : [],

    inStock: getInt(getFromRow(row, ["Stock", "stock", "Quantity", "quantity"]), 10) > 0,
    isActive: true,
    isAvailable: true,
    productType: "medical",
    storeType: "medical",
  };
}

// Process Restaurant Menu Items - MINIMAL REQUIRED FIELDS
function processRestaurantProduct(row, storeId, vendorId) {
  // Get name from multiple possible columns
  const name = getString(
    getFromRow(row, ["Item Name", "item name", "Dish Name", "dish name", "Name", "name", "Product Name"])
  );

  // Name is required
  if (!name) return null;

  // Get price - try multiple columns
  const price = getNumber(getFromRow(row, ["Price", "price", "MRP", "mrp"]), 0);
  const sellingPrice = getNumber(
    getFromRow(row, ["Selling Price", "selling price", "Offer Price", "offer price"]),
    price
  );

  // Price is required
  if (price <= 0 && sellingPrice <= 0) return null;

  const finalPrice = price > 0 ? price : sellingPrice;
  const finalDiscountPrice = sellingPrice > 0 ? sellingPrice : finalPrice;

  // Determine veg/non-veg
  const foodTypeRaw = getString(getFromRow(row, ["Veg/Non-Veg", "veg/non-veg", "Type", "type", "Food Type", "food type"]), "veg");
  const isNonVeg = foodTypeRaw.toLowerCase().includes("non");

  return {
    store: storeId,
    vendor: vendorId,
    name: name,

    // Optional fields with safe defaults
    description: getString(getFromRow(row, ["Description", "description", "Desc"])),
    category: getString(getFromRow(row, ["Category", "category", "Menu Category", "menu category"]), "Main Course"),

    price: finalPrice,
    discountPrice: finalDiscountPrice,

    foodType: isNonVeg ? "nonveg" : "veg",
    spiceLevel: getString(getFromRow(row, ["Spice Level", "spice level", "Spice"]), "medium"),
    cuisine: getString(getFromRow(row, ["Cuisine", "cuisine", "Cuisine Type"])),

    preparationTime: getInt(getFromRow(row, ["Prep Time", "prep time", "Preparation Time", "preparation time"]), 20),
    serves: getString(getFromRow(row, ["Serves", "serves", "Portion", "portion"]), "1"),

    // Parse ingredients if provided (comma-separated)
    ingredients: getString(getFromRow(row, ["Ingredients", "ingredients"]))
      ? getString(getFromRow(row, ["Ingredients", "ingredients"])).split(",").map((i) => i.trim()).filter(Boolean)
      : [],

    // Parse allergens if provided (comma-separated)
    allergens: getString(getFromRow(row, ["Allergens", "allergens"]))
      ? getString(getFromRow(row, ["Allergens", "allergens"])).split(",").map((i) => i.trim()).filter(Boolean)
      : [],

    calories: getInt(getFromRow(row, ["Calories", "calories"]), 0),

    // Image is optional
    images: getString(getFromRow(row, ["Image URL", "image url", "Image", "image"]))
      ? [getString(getFromRow(row, ["Image URL", "image url", "Image", "image"]))]
      : [],

    // Stock for restaurant = availability
    stock: 100,
    stockQuantity: 100,
    inStock: !parseBoolean(getFromRow(row, ["Not Available", "not available", "Unavailable"])),
    isAvailable: parseBoolean(getFromRow(row, ["Available", "available"]), true),
    isActive: true,
    productType: "food",
    storeType: "restaurant",

    addons: [],
    variants: [],
  };
}

// Process General Store Products - MINIMAL REQUIRED FIELDS
function processGeneralProduct(row, storeId, vendorId) {
  // Get name from multiple possible columns
  const name = getString(
    getFromRow(row, ["Product Name", "product name", "Name", "name", "Item Name", "item name"])
  );

  // Name is required
  if (!name) return null;

  // Get price - try multiple columns
  const mrp = getNumber(getFromRow(row, ["MRP", "mrp", "Price", "price"]), 0);
  const sellingPrice = getNumber(
    getFromRow(row, ["Selling Price", "selling price", "Sale Price", "sale price", "SP"]),
    mrp
  );

  // Price is required
  if (mrp <= 0 && sellingPrice <= 0) return null;

  const finalPrice = mrp > 0 ? mrp : sellingPrice;
  const finalDiscountPrice = sellingPrice > 0 ? sellingPrice : finalPrice;

  return {
    store: storeId,
    vendor: vendorId,
    name: name,

    // Optional fields with safe defaults
    description: getString(getFromRow(row, ["Description", "description", "Desc"])),
    category: getString(getFromRow(row, ["Category", "category", "Cat"]), "General"),
    brand: getString(getFromRow(row, ["Brand", "brand", "Company", "company"])),

    price: finalPrice,
    discountPrice: finalDiscountPrice,

    unit: getString(getFromRow(row, ["Unit", "unit"]), "pcs"),
    quantity: getString(getFromRow(row, ["Size", "size", "Weight", "weight", "Volume", "volume"]), "1"),
    packSize: getString(getFromRow(row, ["Pack Size", "pack size"]), "1"),

    stock: getInt(getFromRow(row, ["Stock", "stock", "Qty", "qty", "Quantity", "quantity"]), 10),
    stockQuantity: getInt(getFromRow(row, ["Stock", "stock", "Qty", "qty", "Quantity", "quantity"]), 10),
    minStock: getInt(getFromRow(row, ["Min Stock", "min stock", "Reorder Level"]), 5),

    // Optional identifiers - won't cause error if missing
    barcode: getString(getFromRow(row, ["Barcode", "barcode", "EAN", "ean"])),
    sku: getString(getFromRow(row, ["SKU", "sku", "Product Code", "product code"])),
    hsnCode: getString(getFromRow(row, ["HSN Code", "hsn code", "HSN", "hsn"])),

    gstRate: getNumber(getFromRow(row, ["GST %", "gst %", "GST Rate", "gst rate", "GST"]), 0),

    expiryDate: parseExcelDate(getFromRow(row, ["Expiry Date", "expiry date", "Expiry", "expiry"])),

    // Image is optional
    images: getString(getFromRow(row, ["Image URL", "image url", "Image", "image"]))
      ? [getString(getFromRow(row, ["Image URL", "image url", "Image", "image"]))]
      : [],

    inStock: getInt(getFromRow(row, ["Stock", "stock", "Qty", "qty"]), 10) > 0,
    isActive: true,
    isAvailable: true,
    productType: "general",
    storeType: "general",
  };
}

// ==================== BULK UPLOAD ROUTE ====================

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
      // Clean up file
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: "Store not found. Create a store first." });
    }

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: "Excel file is empty" });
    }

    console.log(`📊 Found ${data.length} rows in Excel`);
    console.log(`📋 Columns found:`, Object.keys(data[0] || {}));

    // Process based on store type
    let products = [];
    let skippedCount = 0;
    let errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Skip completely empty rows
      if (!row || Object.keys(row).length === 0) {
        skippedCount++;
        continue;
      }

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
          errors.push({
            row: i + 2,
            error: "Missing required field (Name or Price)",
            data: JSON.stringify(row).substring(0, 100),
          });
        }
      } catch (error) {
        console.error(`Row ${i + 2} error:`, error.message);
        errors.push({ row: i + 2, error: error.message });
        skippedCount++;
      }
    }

    console.log(`📦 Processed ${products.length} valid products, ${skippedCount} skipped`);

    // Insert products into database
    let insertedCount = 0;
    if (products.length > 0) {
      try {
        const result = await Product.insertMany(products, { ordered: false });
        insertedCount = result.length;

        // Update store product count
        await Store.findByIdAndUpdate(store._id, {
          $inc: { "stats.totalProducts": insertedCount },
        });
      } catch (insertError) {
        // Handle partial insert (some succeeded, some failed)
        if (insertError.insertedDocs) {
          insertedCount = insertError.insertedDocs.length;
          await Store.findByIdAndUpdate(store._id, {
            $inc: { "stats.totalProducts": insertedCount },
          });
        }
        console.error("Insert error (partial success):", insertError.message);
      }
    }

    // Delete uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.log(`✅ Uploaded ${insertedCount} products, skipped ${skippedCount}`);

    res.json({
      success: true,
      uploadedCount: insertedCount,
      skippedCount,
      totalRows: data.length,
      errors: errors.slice(0, 5), // Return first 5 errors only
      message: `Successfully uploaded ${insertedCount} products`,
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

// ==================== TEMPLATE DOWNLOADS ====================
// UPDATED: Simplified templates with only essential columns

// GET /api/vendor/templates/:type
router.get("/templates/:type", (req, res) => {
  const { type } = req.params;

  let headers = [];
  let sampleData = [];

  switch (type) {
    case "medical":
      // Essential columns only
      headers = [
        "Medicine Name",
        "Category",
        "MRP",
        "Selling Price",
        "Stock",
        "Unit",
        "Brand",
        "Generic Name",
        "Prescription Required",
      ];
      sampleData = [
        ["Paracetamol 500mg", "Pain Relief", 25, 22, 100, "strip", "Cipla", "Paracetamol", "No"],
        ["Amoxicillin 250mg", "Antibiotics", 85, 78, 50, "strip", "Sun Pharma", "Amoxicillin", "Yes"],
        ["Crocin Advance", "Pain Relief", 30, 28, 75, "strip", "GSK", "Paracetamol", "No"],
      ];
      break;

    case "restaurant":
      // Essential columns only
      headers = [
        "Item Name",
        "Category",
        "Price",
        "Selling Price",
        "Veg/Non-Veg",
        "Prep Time",
        "Serves",
        "Description",
      ];
      sampleData = [
        ["Butter Chicken", "Main Course", 320, 299, "Non-Veg", 30, 2, "Creamy tomato gravy with chicken"],
        ["Paneer Tikka", "Starters", 220, 199, "Veg", 20, 2, "Grilled cottage cheese with spices"],
        ["Dal Makhani", "Main Course", 180, 160, "Veg", 25, 2, "Creamy black lentils"],
      ];
      break;

    case "grocery":
    case "vegetables":
    case "general":
    default:
      // Essential columns only
      headers = [
        "Product Name",
        "Category",
        "MRP",
        "Selling Price",
        "Stock",
        "Unit",
        "Brand",
        "Description",
      ];
      sampleData = [
        ["Tata Salt", "Grocery", 28, 26, 100, "kg", "Tata", "Iodised salt"],
        ["Amul Butter", "Dairy", 56, 54, 50, "pack", "Amul", "Salted butter 100g"],
        ["Fresh Tomatoes", "Vegetables", 40, 35, 200, "kg", "", "Farm fresh tomatoes"],
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