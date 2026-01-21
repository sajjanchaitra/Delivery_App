// backend/src/routes/customer.routes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../models/Store');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// ==================== PUBLIC ROUTES (No auth required) ====================

// GET /api/customer/stores - Get all active stores
router.get('/stores', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    let query = { 
      isApproved: true,
      isActive: true 
    };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const stores = await Store.find(query)
      .populate("vendor", "name phone")
      .select("-__v")
      .sort({ "rating.average": -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Store.countDocuments(query);

    // Add product count for each store
    const storesWithCount = await Promise.all(
      stores.map(async (store) => {
        const productCount = await Product.countDocuments({
          store: store._id,
          isActive: true,
          inStock: true,
        });
        return {
          ...store.toObject(),
          productCount,
        };
      })
    );

    res.json({
      success: true,
      stores: storesWithCount,
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

// GET /api/customer/stores/:id - Get single store with products
router.get('/stores/:id', async (req, res) => {
  try {
    const store = await Store.findOne({
      _id: req.params.id,
      isApproved: true,
      isActive: true,
    }).populate("vendor", "name phone");

    if (!store) {
      return res.status(404).json({ 
        success: false, 
        error: "Store not found" 
      });
    }

    // Get top products (most sold)
    const topProducts = await Product.find({
      store: store._id,
      isActive: true,
      inStock: true,
    })
      .sort({ soldCount: -1 })
      .limit(10);

    // Get all products count
    const totalProducts = await Product.countDocuments({
      store: store._id,
      isActive: true,
    });

    const inStockProducts = await Product.countDocuments({
      store: store._id,
      isActive: true,
      inStock: true,
    });

    res.json({
      success: true,
      store: {
        ...store.toObject(),
        totalProducts,
        inStockProducts,
      },
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customer/stores/:id/products - Get all products from a store
router.get('/stores/:id/products', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, inStock, page = 1, limit = 20, sort = "createdAt" } = req.query;

    let query = { 
      store: req.params.id,
      isActive: true 
    };

    if (category) query.category = category;
    if (inStock !== undefined) query.inStock = inStock === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case "price-low":
        sortOption = { price: 1 };
        break;
      case "price-high":
        sortOption = { price: -1 };
        break;
      case "popular":
        sortOption = { soldCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .sort(sortOption)
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

// GET /api/customer/products - Get all products (across all stores)
router.get('/products', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice,
      inStock,
      page = 1, 
      limit = 20,
      sort = "createdAt" 
    } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;
    if (inStock !== undefined) query.inStock = inStock === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortOption = {};
    switch (sort) {
      case "price-low":
        sortOption = { price: 1 };
        break;
      case "price-high":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { "rating.average": -1 };
        break;
      case "popular":
        sortOption = { soldCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .populate("store", "name isOpen rating")
      .sort(sortOption)
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

// GET /api/customer/products/:id - Get product details
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("store", "name rating isOpen location phone");

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: "Product not found" 
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customer/categories - Get product categories with counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true, inStock: true } },
      { 
        $group: { 
          _id: "$category", 
          count: { $sum: 1 },
          // Get a sample product image for the category
          sampleImage: { $first: "$images" }
        } 
      },
      { $sort: { count: -1 } }
    ]);

    const formattedCategories = categories.map(cat => ({
      id: cat._id,
      name: cat._id,
      itemCount: cat.count,
      image: cat.sampleImage && cat.sampleImage.length > 0 ? cat.sampleImage[0] : null
    }));

    res.json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;