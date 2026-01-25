// backend/src/routes/bulk-upload.routes.js
// FIXED VERSION - Handles your exact Excel format

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
    const uploadDir = path.join(__dirname, "../../uploads/excel");
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/octet-stream",
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel and CSV files are allowed."));
    }
  },
});

// ==================== HELPER FUNCTIONS ====================

function getString(value, defaultVal = "") {
  if (value === null || value === undefined || value === "") return defaultVal;
  return String(value).trim();
}

function getNumber(value, defaultVal = 0) {
  if (value === null || value === undefined || value === "") return defaultVal;
  const num = parseFloat(value);
  return isNaN(num) ? defaultVal : num;
}

function getInt(value, defaultVal = 0) {
  if (value === null || value === undefined || value === "") return defaultVal;
  const num = parseInt(value);
  return isNaN(num) ? defaultVal : num;
}

function parseBoolean(value, defaultVal = false) {
  if (value === null || value === undefined || value === "") return defaultVal;
  const str = String(value).toLowerCase().trim();
  return ["yes", "true", "1", "y"].includes(str);
}

// Flexible column finder - tries multiple possible column names
function getFromRow(row, possibleNames, defaultVal = "") {
  for (const name of possibleNames) {
    // Try exact match
    if (row[name] !== null && row[name] !== undefined && row[name] !== "") {
      return row[name];
    }
    // Try case-insensitive match
    const keys = Object.keys(row);
    const foundKey = keys.find(k => k.toLowerCase() === name.toLowerCase());
    if (foundKey && row[foundKey] !== null && row[foundKey] !== undefined && row[foundKey] !== "") {
      return row[foundKey];
    }
  }
  return defaultVal;
}

// ==================== RESTAURANT PRODUCT PROCESSOR (FIXED) ====================

function processRestaurantProduct(row, storeId, vendorId) {
  console.log("\n  📝 Processing row:", JSON.stringify(row).substring(0, 150));
  
  // Get item name with multiple possible column names
  const name = getString(
    getFromRow(row, [
      "Item Name", "item name", "ItemName", "ITEM NAME",
      "Dish Name", "dish name", "DishName", "DISH NAME",
      "Name", "name", "NAME",
      "Product Name", "product name", "ProductName"
    ])
  );
  
  if (!name) {
    console.log("  ❌ No name found. Available columns:", Object.keys(row));
    return null;
  }

  // Get price
  const price = getNumber(
    getFromRow(row, ["Price", "price", "PRICE", "MRP", "mrp"]), 
    0
  );
  
  // Get selling price (optional)
  const sellingPrice = getNumber(
    getFromRow(row, [
      "Selling Price", "selling price", "SellingPrice", "SELLING PRICE",
      "Offer Price", "offer price", "OfferPrice",
      "Discounted Price", "discounted price"
    ]), 
    price
  );

  // Validate price
  if (price <= 0 && sellingPrice <= 0) {
    console.log(`  ❌ No valid price for: ${name}`);
    return null;
  }

  const finalPrice = price > 0 ? price : sellingPrice;
  const finalDiscountPrice = sellingPrice > 0 && sellingPrice < finalPrice ? sellingPrice : finalPrice;

  // Get food type and clean it
  const foodTypeRaw = getString(
    getFromRow(row, [
      "Veg/Non-Veg", "veg/non-veg", "VegNonVeg", 
      "Type", "type", "TYPE",
      "Food Type", "food type", "FoodType"
    ]), 
    "veg"
  );
  
  // Remove spaces and hyphens, then check
  const cleanFoodType = foodTypeRaw.toLowerCase().replace(/[\s-]/g, "");
  const isNonVeg = cleanFoodType.includes("non") || cleanFoodType.includes("chicken") || cleanFoodType.includes("meat");
  const foodType = isNonVeg ? "nonveg" : "veg";

  // Get other fields
  const category = getString(
    getFromRow(row, ["Category", "category", "CATEGORY", "Menu Category"]), 
    "Main Course"
  );

  const prepTime = getInt(
    getFromRow(row, ["Prep Time", "prep time", "PrepTime", "Preparation Time"]), 
    20
  );

  const serves = getString(
    getFromRow(row, ["Serves", "serves", "SERVES", "Portion"]), 
    "1"
  );

  const description = getString(
    getFromRow(row, ["Description", "description", "DESCRIPTION", "Desc"])
  );

  console.log(`  ✅ ${name} | ₹${finalPrice} | ${foodType.toUpperCase()} | ${category}`);

  return {
    store: storeId,
    vendor: vendorId,
    name: name,
    description: description,
    category: category,
    price: finalPrice,
    discountPrice: finalDiscountPrice,
    foodType: foodType,
    spiceLevel: getString(getFromRow(row, ["Spice Level", "spice level", "Spice"]), "medium"),
    cuisine: getString(getFromRow(row, ["Cuisine", "cuisine", "Cuisine Type"])),
    preparationTime: prepTime,
    serves: serves,
    ingredients: getString(getFromRow(row, ["Ingredients", "ingredients"]))
      ? getString(getFromRow(row, ["Ingredients", "ingredients"])).split(",").map(i => i.trim()).filter(Boolean)
      : [],
    allergens: getString(getFromRow(row, ["Allergens", "allergens"]))
      ? getString(getFromRow(row, ["Allergens", "allergens"])).split(",").map(i => i.trim()).filter(Boolean)
      : [],
    calories: getInt(getFromRow(row, ["Calories", "calories"]), 0),
    images: getString(getFromRow(row, ["Image URL", "image url", "Image", "image"]))
      ? [getString(getFromRow(row, ["Image URL", "image url", "Image", "image"]))]
      : [],
    stock: 100,
    stockQuantity: 100,
    inStock: true,
    isAvailable: true,
    isActive: true,
    productType: "food",
    storeType: "restaurant",
    addons: [],
    variants: [],
  };
}

// ==================== MEDICAL PRODUCT PROCESSOR ====================

function processMedicalProduct(row, storeId, vendorId) {
  const name = getString(getFromRow(row, [
    "Medicine Name", "medicine name", "MedicineName",
    "Name", "name", "Product Name"
  ]));
  
  if (!name) return null;

  const mrp = getNumber(getFromRow(row, ["MRP", "mrp", "Price", "price"]), 0);
  const sellingPrice = getNumber(getFromRow(row, ["Selling Price", "selling price", "Sale Price"]), mrp);

  if (mrp <= 0 && sellingPrice <= 0) return null;

  const finalPrice = mrp > 0 ? mrp : sellingPrice;
  const finalDiscountPrice = sellingPrice > 0 ? sellingPrice : finalPrice;

  return {
    store: storeId,
    vendor: vendorId,
    name: name,
    genericName: getString(getFromRow(row, ["Generic Name", "generic name", "Salt"])),
    description: getString(getFromRow(row, ["Description", "description"])),
    category: getString(getFromRow(row, ["Category", "category"]), "Medicine"),
    price: finalPrice,
    discountPrice: finalDiscountPrice,
    manufacturer: getString(getFromRow(row, ["Manufacturer", "manufacturer", "Company", "Brand"])),
    brand: getString(getFromRow(row, ["Brand", "brand", "Manufacturer"])),
    stock: getInt(getFromRow(row, ["Stock", "stock", "Quantity"]), 10),
    stockQuantity: getInt(getFromRow(row, ["Stock", "stock", "Quantity"]), 10),
    unit: getString(getFromRow(row, ["Unit", "unit"]), "strip"),
    prescriptionRequired: parseBoolean(getFromRow(row, ["Prescription Required", "prescription required"])),
    images: [],
    inStock: true,
    isActive: true,
    isAvailable: true,
    productType: "medical",
    storeType: "medical",
  };
}

// ==================== GENERAL PRODUCT PROCESSOR ====================

function processGeneralProduct(row, storeId, vendorId) {
  const name = getString(getFromRow(row, [
    "Product Name", "product name", "ProductName",
    "Name", "name", "Item Name"
  ]));
  
  if (!name) return null;

  const mrp = getNumber(getFromRow(row, ["MRP", "mrp", "Price", "price"]), 0);
  const sellingPrice = getNumber(getFromRow(row, ["Selling Price", "selling price", "Sale Price"]), mrp);

  if (mrp <= 0 && sellingPrice <= 0) return null;

  const finalPrice = mrp > 0 ? mrp : sellingPrice;
  const finalDiscountPrice = sellingPrice > 0 ? sellingPrice : finalPrice;

  return {
    store: storeId,
    vendor: vendorId,
    name: name,
    description: getString(getFromRow(row, ["Description", "description"])),
    category: getString(getFromRow(row, ["Category", "category"]), "General"),
    brand: getString(getFromRow(row, ["Brand", "brand"])),
    price: finalPrice,
    discountPrice: finalDiscountPrice,
    unit: getString(getFromRow(row, ["Unit", "unit"]), "pcs"),
    stock: getInt(getFromRow(row, ["Stock", "stock", "Quantity"]), 10),
    stockQuantity: getInt(getFromRow(row, ["Stock", "stock", "Quantity"]), 10),
    images: [],
    inStock: true,
    isActive: true,
    isAvailable: true,
    productType: "general",
    storeType: "general",
  };
}

// ==================== BULK UPLOAD ROUTE ====================

router.post("/bulk-upload", auth, isVendor, upload.single("file"), async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("📤 BULK UPLOAD STARTED");
  console.log("=".repeat(60));
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    console.log("📄 File:", req.file.originalname);
    console.log("📋 Body:", req.body);

    const { storeType = "general" } = req.body;
    console.log(`📦 Store Type: ${storeType}`);

    // Get vendor's store
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        success: false, 
        error: "Store not found. Create a store first." 
      });
    }
    console.log("✅ Store found:", store.name);

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Total rows: ${data.length}`);
    console.log("📋 Columns:", Object.keys(data[0] || {}));

    if (!data || data.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: "Excel file is empty" });
    }

    // Process products
    let products = [];
    let skippedCount = 0;
    let errors = [];

    console.log("\n🔄 Processing products...");

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      if (!row || Object.keys(row).length === 0) {
        skippedCount++;
        continue;
      }

      try {
        let productData;

        switch (storeType.toLowerCase()) {
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
          errors.push({ row: i + 2, error: "Missing required fields" });
        }
      } catch (error) {
        console.error(`  ❌ Row ${i + 2}:`, error.message);
        errors.push({ row: i + 2, error: error.message });
        skippedCount++;
      }
    }

    console.log(`\n📦 Valid products: ${products.length}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);

    // Insert into database
    let insertedCount = 0;
    if (products.length > 0) {
      try {
        const result = await Product.insertMany(products, { ordered: false });
        insertedCount = result.length;
        console.log(`✅ Inserted: ${insertedCount}`);

        // Update store stats
        await Store.findByIdAndUpdate(store._id, {
          $inc: { "stats.totalProducts": insertedCount },
        });
      } catch (insertError) {
        console.error("⚠️  Insert error:", insertError.message);
        if (insertError.insertedDocs) {
          insertedCount = insertError.insertedDocs.length;
          console.log(`✅ Partial insert: ${insertedCount}`);
          await Store.findByIdAndUpdate(store._id, {
            $inc: { "stats.totalProducts": insertedCount },
          });
        }
      }
    }

    // Cleanup
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.log("\n" + "=".repeat(60));
    console.log(`✅ COMPLETE: ${insertedCount} added, ${skippedCount} skipped`);
    console.log("=".repeat(60) + "\n");

    res.json({
      success: true,
      uploadedCount: insertedCount,
      skippedCount,
      totalRows: data.length,
      errors: errors.slice(0, 10),
      message: `Successfully uploaded ${insertedCount} products out of ${data.length}`,
    });

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TEMPLATE DOWNLOADS ====================

router.get("/templates/:type", (req, res) => {
  const { type } = req.params;
  let headers = [];
  let sampleData = [];

  switch (type) {
    case "medical":
      headers = ["Medicine Name", "Category", "MRP", "Selling Price", "Stock", "Unit", "Brand", "Generic Name", "Prescription Required"];
      sampleData = [
        ["Paracetamol 500mg", "Pain Relief", 25, 22, 100, "strip", "Cipla", "Paracetamol", "No"],
        ["Amoxicillin 250mg", "Antibiotics", 85, 78, 50, "strip", "Sun Pharma", "Amoxicillin", "Yes"],
      ];
      break;

    case "restaurant":
      headers = ["Item Name", "Category", "Price", "Selling Price", "Veg/Non-Veg", "Prep Time", "Serves", "Description"];
      sampleData = [
        ["Butter Chicken", "Main Course", 320, 299, "Non-Veg", 30, 2, "Creamy chicken curry"],
        ["Paneer Tikka", "Starters", 220, 199, "Veg", 20, 2, "Grilled cottage cheese"],
      ];
      break;

    default:
      headers = ["Product Name", "Category", "MRP", "Selling Price", "Stock", "Unit", "Brand", "Description"];
      sampleData = [
        ["Tata Salt", "Grocery", 28, 26, 100, "kg", "Tata", "Iodised salt"],
        ["Amul Butter", "Dairy", 56, 54, 50, "pack", "Amul", "Salted butter"],
      ];
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