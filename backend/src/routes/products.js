const express = require("express");
const Product = require("../models/Product");
const Store = require("../models/Store");
const { auth, isVendor } = require("../middleware/auth");

const router = express.Router();

// POST /api/products - Create product
router.post("/", auth, isVendor, async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    if (!store) {
      return res.status(400).json({ error: "Create a store first" });
    }

    const product = new Product({
      ...req.body,
      store: store._id,
      vendor: req.userId,
    });
    await product.save();

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products - Get all products
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true, inStock: true };

    if (category && category !== "all") query.category = category;
    if (search) query.name = { $regex: search, $options: "i" };

    const products = await Product.find(query).populate("store", "name");
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/my-products - Vendor's products
router.get("/my-products", auth, isVendor, async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.userId, isActive: true });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("store");
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id - Update product
router.put("/:id", auth, isVendor, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.userId },
      req.body,
      { new: true }
    );
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", auth, isVendor, async (req, res) => {
  try {
    await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.userId },
      { isActive: false }
    );
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;