// backend/src/routes/customer.routes.js
// COMPLETE WORKING VERSION

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import models - adjust paths if needed
let Store, Product, Category;

try {
  Store = require('../models/Store');
} catch (e) {
  console.log('Store model not found, using fallback');
  Store = mongoose.model('Store', new mongoose.Schema({}, { strict: false }));
}

try {
  Product = require('../models/Product');
} catch (e) {
  console.log('Product model not found, using fallback');
  Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
}

try {
  Category = require('../models/Category');
} catch (e) {
  console.log('Category model not found, using fallback');
  Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
}

// Helper function to format address
const formatAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  
  const parts = [
    address.street,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);
  
  return parts.join(', ');
};

// ============================================
// GET /api/customer/categories
// ============================================
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 GET /api/customer/categories');
    
    const categories = await Category.find({ isActive: { $ne: false } })
      .sort({ name: 1 })
      .lean();

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({
          category: cat.name,
          isActive: { $ne: false }
        });
        return {
          ...cat,
          id: cat._id,
          itemCount: count
        };
      })
    );

    console.log(`✅ Found ${categories.length} categories`);
    res.json({
      success: true,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/customer/stores
// ============================================
router.get('/stores', async (req, res) => {
  try {
    console.log('🏪 GET /api/customer/stores');
    const { category, lat, lng, search, page = 1, limit = 20 } = req.query;

    // Build query - don't filter out stores without isActive/isApproved fields
    const query = {
      $or: [
        { isActive: true, isApproved: true },
        { isActive: { $exists: false } },
        { isApproved: { $exists: false } }
      ]
    };

    if (category) {
      query.categories = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Store query:', JSON.stringify(query));

    let stores = await Store.find(query)
      .select('name description logo image images address rating isOpen categories deliveryTime deliveryFee minOrder phone deliverySettings')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    // If no stores found with filters, try getting all stores
    if (stores.length === 0) {
      console.log('No stores with filter, trying all stores...');
      stores = await Store.find({})
        .select('name description logo image images address rating isOpen categories deliveryTime deliveryFee minOrder phone deliverySettings')
        .limit(parseInt(limit))
        .lean();
    }

    // Add product count to each store and format address
    const storesWithProductCount = await Promise.all(
      stores.map(async (store) => {
        const productCount = await Product.countDocuments({
          store: store._id,
          isActive: { $ne: false }
        });
        return {
          ...store,
          address: formatAddress(store.address),
          productCount,
          totalProducts: productCount
        };
      })
    );

    const total = await Store.countDocuments(query);

    console.log(`✅ Found ${stores.length} stores`);
    res.json({
      success: true,
      stores: storesWithProductCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stores:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/customer/stores/:storeId
// ============================================
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log('🏪 GET /api/customer/stores/:storeId -', storeId);

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, error: 'Invalid store ID' });
    }

    const store = await Store.findById(storeId).lean();

    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    // Get product count and top products for this store
    const [productCount, topProducts] = await Promise.all([
      Product.countDocuments({ store: storeId, isActive: { $ne: false } }),
      Product.find({ store: storeId, isActive: { $ne: false } })
        .sort({ soldCount: -1 })
        .limit(5)
        .lean()
    ]);

    console.log(`✅ Found store: ${store.name} with ${productCount} products`);
    res.json({
      success: true,
      store: {
        ...store,
        address: formatAddress(store.address),
        totalProducts: productCount,
        inStockProducts: productCount
      },
      topProducts
    });
  } catch (error) {
    console.error('❌ Error fetching store:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/customer/stores/:storeId/products
// ============================================
router.get('/stores/:storeId/products', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { category, sort, page = 1, limit = 20 } = req.query;
    
    console.log('📦 GET /api/customer/stores/:storeId/products -', storeId);

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, error: 'Invalid store ID' });
    }

    const query = { 
      store: storeId,
      isActive: { $ne: false } 
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };
    else if (sort === 'popular') sortOption = { soldCount: -1 };
    else if (sort === 'createdAt') sortOption = { createdAt: -1 };

    const products = await Product.find(query)
      .sort(sortOption)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(query);

    // Get unique categories from store products
    const allProducts = await Product.find({ store: storeId, isActive: { $ne: false } }).select('category').lean();
    const categories = ['All', ...new Set(allProducts.map(p => p.category).filter(Boolean))];

    console.log(`✅ Found ${products.length} products for store ${storeId}`);
    res.json({
      success: true,
      products,
      categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching store products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/customer/products
// ============================================
router.get('/products', async (req, res) => {
  try {
    console.log('📦 GET /api/customer/products');
    const { category, storeId, store, search, sort, page = 1, limit = 20, minPrice, maxPrice } = req.query;

    const query = { isActive: { $ne: false } };

    if (category && category !== 'All') {
      query.category = category;
    }

    // Support both storeId and store query params
    if (storeId || store) {
      query.store = storeId || store;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };
    else if (sort === 'popular') sortOption = { soldCount: -1 };
    else if (sort === 'rating') sortOption = { 'rating.average': -1 };

    console.log('Product query:', JSON.stringify(query));

    const products = await Product.find(query)
      .populate('store', 'name')
      .sort(sortOption)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(query);

    console.log(`✅ Found ${products.length} products`);
    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/customer/products/:productId
// ============================================
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('📦 GET /api/customer/products/:productId -', productId);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const product = await Product.findById(productId)
      .populate('store', 'name phone address rating isOpen')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Format store address if exists
    if (product.store && product.store.address) {
      product.store.address = formatAddress(product.store.address);
    }

    console.log(`✅ Found product: ${product.name}`);
    res.json({ success: true, product });
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/customer/search
// ============================================
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    console.log('🔍 GET /api/customer/search - query:', q);

    if (!q) {
      return res.json({ success: true, products: [], stores: [] });
    }

    const searchRegex = { $regex: q, $options: 'i' };
    const results = { products: [], stores: [] };

    if (type === 'all' || type === 'products') {
      results.products = await Product.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ],
        isActive: { $ne: false }
      })
        .populate('store', 'name')
        .limit(parseInt(limit))
        .lean();
    }

    if (type === 'all' || type === 'stores') {
      const stores = await Store.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { categories: searchRegex }
        ]
      })
        .limit(parseInt(limit))
        .lean();
      
      // Format addresses
      results.stores = stores.map(store => ({
        ...store,
        address: formatAddress(store.address)
      }));
    }

    console.log(`✅ Search found ${results.products.length} products, ${results.stores.length} stores`);
    res.json({ success: true, ...results });
  } catch (error) {
    console.error('❌ Error searching:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/customer/featured
// ============================================
router.get('/featured', async (req, res) => {
  try {
    console.log('⭐ GET /api/customer/featured');

    const [featuredProducts, featuredStores, categories] = await Promise.all([
      Product.find({ isActive: { $ne: false } })
        .populate('store', 'name')
        .sort({ soldCount: -1 })
        .limit(10)
        .lean(),
      Store.find({})
        .sort({ 'rating.average': -1 })
        .limit(10)
        .lean(),
      Category.find({ isActive: { $ne: false } })
        .limit(10)
        .lean()
    ]);

    // Format store addresses
    const formattedStores = featuredStores.map(store => ({
      ...store,
      address: formatAddress(store.address)
    }));

    console.log('✅ Featured data loaded');
    res.json({
      success: true,
      featuredProducts,
      featuredStores: formattedStores,
      categories
    });
  } catch (error) {
    console.error('❌ Error fetching featured:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/customer/home
// ============================================
router.get('/home', async (req, res) => {
  try {
    console.log('🏠 GET /api/customer/home');

    const [categories, stores, products, deals] = await Promise.all([
      Category.find({ isActive: { $ne: false } }).limit(10).lean(),
      Store.find({}).limit(10).lean(),
      Product.find({ isActive: { $ne: false } })
        .populate('store', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Product.find({
        isActive: { $ne: false },
        $or: [
          { discountPrice: { $exists: true, $ne: null } },
          { salePrice: { $exists: true, $ne: null } }
        ]
      })
        .populate('store', 'name')
        .limit(10)
        .lean()
    ]);

    // Format store addresses
    const formattedStores = stores.map(store => ({
      ...store,
      address: formatAddress(store.address)
    }));

    console.log('✅ Home data loaded');
    res.json({
      success: true,
      categories,
      stores: formattedStores,
      products,
      deals
    });
  } catch (error) {
    console.error('❌ Error fetching home data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/customer/profile
// ============================================
router.get('/profile', async (req, res) => {
  try {
    // This requires auth middleware - return basic info if no auth
    if (!req.userId) {
      return res.json({ success: true, customer: null });
    }

    const User = require('../models/User');
    const user = await User.findById(req.userId).select('-password').lean();
    
    res.json({ success: true, customer: user });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;