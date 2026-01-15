const express = require("express");
const Product = require("../models/Product");
const Store = require("../models/Store");
const { auth, isVendor } = require("../middleware/auth");

const router = express.Router();

// Create product (vendor only)
router.post("/", auth, isVendor, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      images,
      price,
      discountPrice,
      quantity,
      unit,
      inStock,
    } = req.body;

    // Get vendor's store
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.status(400).json({ error: "Please create a store first" });
    }

    const product = new Product({
      store: store._id,
      vendor: req.userId,
      name,
      description,
      category,
      images: images || [],
      price,
      discountPrice,
      quantity,
      unit,
      inStock,
    });

    await product.save();

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get vendor's products
router.get("/my-products", auth, isVendor, async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.userId, isActive: true })
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products (for customers)
router.get("/", async (req, res) => {
  try {
    const { category, search, storeId, minPrice, maxPrice } = req.query;

    let query = { isActive: true, inStock: true };

    if (category && category !== "all") {
      query.category = category;
    }

    if (storeId) {
      query.store = storeId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice) {
      query.price = { ...query.price, $gte: Number(minPrice) };
    }

    if (maxPrice) {
      query.price = { ...query.price, $lte: Number(maxPrice) };
    }

    const products = await Product.find(query)
      .populate("store", "name image")
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get products by store
router.get("/store/:storeId", async (req, res) => {
  try {
    const products = await Product.find({
      store: req.params.storeId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "store",
      "name image phone"
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product (vendor only)
router.put("/:id", auth, isVendor, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      vendor: req.userId,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const {
      name,
      description,
      category,
      images,
      price,
      discountPrice,
      quantity,
      unit,
      inStock,
    } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category,
        images,
        price,
        discountPrice,
        quantity,
        unit,
        inStock,
      },
      { new: true }
    );

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product (vendor only)
router.delete("/:id", auth, isVendor, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      vendor: req.userId,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Soft delete
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle product stock (vendor only)
router.patch("/:id/toggle-stock", auth, isVendor, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      vendor: req.userId,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.inStock = !product.inStock;
    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;