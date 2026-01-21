// backend/src/routes/customer.routes.js
// Replace your existing customer.routes.js with this file

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../models/Store');
const auth = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================

// GET /api/customer/categories
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 Fetching categories...');
    
    const categories = await Product.aggregate([
      { $match: { isActive: { $ne: false } } }, // Include products where isActive is true or not set
      { 
        $group: { 
          _id: "$category", 
          count: { $sum: 1 },
          sampleImage: { $first: "$images" }
        } 
      },
      { $sort: { count: -1 } }
    ]);

    const formattedCategories = categories
      .filter(cat => cat._id)
      .map(cat => ({
        _id: cat._id,
        id: cat._id,
        name: cat._id,
        itemCount: cat.count,
        image: cat.sampleImage && cat.sampleImage.length > 0 ? cat.sampleImage[0] : null
      }));

    console.log(`✅ Found ${formattedCategories.length} categories`);
    res.json({ success: true, categories: formattedCategories });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customer/stores
router.get('/stores', async (req, res) => {
  try {
    console.log('🏪 Fetching stores...');
    const { search, page = 1, limit = 20 } = req.query;
    
    // Start with empty query to get ALL stores
    let query = {};

    // Only add filters if stores exist with those fields
    const totalStores = await Store.countDocuments({});
    console.log(`Total stores in DB: ${totalStores}`);

    if (totalStores > 0) {
      // Check if any stores have isActive field
      const activeStores = await Store.countDocuments({ isActive: true });
      const approvedStores = await Store.countDocuments({ isApproved: true });
      
      console.log(`Active stores: ${activeStores}, Approved stores: ${approvedStores}`);

      // Only filter by isActive/isApproved if stores have these fields set
      if (activeStores > 0 || approvedStores > 0) {
        query = {
          $or: [
            { isActive: true, isApproved: true },
            { isActive: { $exists: false } },
            { isApproved: { $exists: false } }
          ]
        };
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } }
      ];
    }

    console.log('Store query:', JSON.stringify(query));

    const stores = await Store.find(query)
      .populate("vendor", "name phone")
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Store.countDocuments(query);

    // Add product count for each store
    const storesWithCount = await Promise.all(
      stores.map(async (store) => {
        const productCount = await Product.countDocuments({
          store: store._id,
          isActive: { $ne: false },
        });
        return {
          ...store.toObject(),
          productCount,
          isOpen: store.isOpen !== false,
        };
      })
    );

    console.log(`✅ Found ${storesWithCount.length} stores`);

    res.json({
      success: true,
      stores: storesWithCount,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching stores:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customer/stores/:id
router.get('/stores/:id', async (req, res) => {
  try {
    console.log('🏪 Fetching store details:', req.params.id);
    
    const store = await Store.findById(req.params.id)
      .populate("vendor", "name phone");

    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" });
    }

    const topProducts = await Product.find({
      store: store._id,
      isActive: { $ne: false },
    })
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(10);

    const totalProducts = await Product.countDocuments({
      store: store._id,
      isActive: { $ne: false },
    });

    const inStockProducts = await Product.countDocuments({
      store: store._id,
      isActive: { $ne: false },
      inStock: { $ne: false },
    });

    console.log(`✅ Found store: ${store.name} with ${totalProducts} products`);

    res.json({
      success: true,
      store: {
        ...store.toObject(),
        totalProducts,
        inStockProducts,
        isOpen: store.isOpen !== false,
      },
      topProducts,
    });
  } catch (error) {
    console.error('❌ Error fetching store:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customer/stores/:id/products
router.get('/stores/:id/products', async (req, res) => {
  try {
    console.log('📦 Fetching store products:', req.params.id);
    const { category, search, minPrice, maxPrice, inStock, page = 1, limit = 20, sort = "createdAt" } = req.query;

    let query = { 
      store: req.params.id,
      isActive: { $ne: false }
    };

    if (category && category !== 'All') query.category = category;
    if (inStock === "true") query.inStock = true;
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
      case "price-low": sortOption = { price: 1 }; break;
      case "price-high": sortOption = { price: -1 }; break;
      case "popular": sortOption = { soldCount: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    console.log(`✅ Found ${products.length} products for store`);

    res.json({
      success: true,
      products,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('❌ Error fetching store products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customer/products
router.get('/products', async (req, res) => {
  try {
    console.log('📦 Fetching products...');
    const { category, search, minPrice, maxPrice, inStock, featured, page = 1, limit = 20, sort = "createdAt" } = req.query;

    let query = { isActive: { $ne: false } };

    if (category && category !== 'All') query.category = category;
    if (inStock === "true") query.inStock = true;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortOption = {};
    switch (sort) {
      case "price-low": sortOption = { price: 1 }; break;
      case "price-high": sortOption = { price: -1 }; break;
      case "rating": sortOption = { "rating.average": -1 }; break;
      case "popular": sortOption = { soldCount: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .populate("store", "name isOpen rating")
      .sort(sortOption)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    console.log(`✅ Found ${products.length} products`);

    res.json({
      success: true,
      products,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customer/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    console.log('📦 Fetching product details:', req.params.id);
    
    const product = await Product.findById(req.params.id)
      .populate("store", "name rating isOpen address phone");

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    console.log(`✅ Found product: ${product.name}`);
    res.json({ success: true, product });
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PROTECTED ROUTES (Auth required) ====================

// GET /api/customer/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, customer: user, user: user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/customer/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const { name, phone, email, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, email, address },
      { new: true }
    ).select('-password');

    res.json({ success: true, customer: user, user: user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;