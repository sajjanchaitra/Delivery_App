// backend/src/routes/upload.routes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// ==================== UPLOAD SINGLE IMAGE ====================
router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    // Generate the URL for the uploaded image
    const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    console.log("✅ Image uploaded:", req.file.filename);
    console.log("   URL:", imageUrl);

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to upload image",
    });
  }
});

// ==================== UPLOAD MULTIPLE IMAGES ====================
router.post("/multiple", upload.array("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No image files provided",
      });
    }

    const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    const imageUrls = req.files.map((file) => `${baseUrl}/uploads/${file.filename}`);

    console.log("✅ Multiple images uploaded:", req.files.length);

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      imageUrls: imageUrls,
      count: req.files.length,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to upload images",
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5MB",
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
  
  next();
});

module.exports = router;