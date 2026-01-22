// backend/src/routes/cart.routes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import models with fallback
let Cart, Product;

try {
  Cart = require('../models/Cart');
} catch (e) {
  console.log('Cart model not found, using fallback');
  const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
  });
  
  const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    items: [cartItemSchema]
  }, { timestamps: true });
  
  Cart = mongoose.model('Cart', cartSchema);
}

try {
  Product = require('../models/Product');
} catch (e) {
  console.log('Product model not found, using fallback');
  Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
}

// Import auth middleware with fallback
let auth;
try {
  const authModule = require('../middleware/auth');
  auth = authModule.auth || authModule; // Handle both export styles
} catch (e) {
  console.log('Auth middleware not found, using fallback');
  // Simple auth middleware fallback
  auth = async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: 'No authentication token' });
      }
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = { id: decoded.id || decoded.userId || decoded._id };
      req.userId = req.user.id;  // ✅ CORRECT
      next();
    } catch (error) {
      res.status(401).json({ success: false, error: 'Invalid token' });
    }
  };
}
// All cart routes require authentication
router.use(auth);

// ============================================
// GET /api/cart - Get user's cart
// ============================================
router.get('/', async (req, res) => {
  try {
    console.log('🛒 GET /api/cart - User:', req.userId);
    
    let cart = await Cart.findOne({ user: req.userId })
      .populate({
        path: 'items.product',
        select: 'name images price discountPrice salePrice unit quantity inStock stock'
      })
      .populate('store', 'name');

    if (!cart) {
      return res.json({
        success: true,
        cart: { items: [], store: null }
      });
    }

    // Filter out items where product is null (deleted products)
    cart.items = cart.items.filter(item => item.product);

    console.log(`✅ Cart found with ${cart.items.length} items`);
    res.json({ success: true, cart });
  } catch (error) {
    console.error('❌ Error fetching cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/cart/add - Add item to cart
// ============================================
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    console.log('🛒 POST /api/cart/add:', { productId, quantity, user: req.userId });

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Check if product is in stock
    if (product.inStock === false) {
      return res.status(400).json({ success: false, error: 'Product is out of stock' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({
        user: req.userId,
        store: product.store,
        items: []
      });
    }

    // Check if adding from a different store
    if (cart.store && cart.items.length > 0 && cart.store.toString() !== product.store.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You can only add items from one store at a time. Clear your cart first.',
        differentStore: true
      });
    }

    // Update store if cart was empty
    if (!cart.store || cart.items.length === 0) {
      cart.store = product.store;
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity: quantity });
    }

    await cart.save();

    // Populate and return updated cart
    cart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name images price discountPrice salePrice unit quantity inStock stock'
      })
      .populate('store', 'name');

    console.log('✅ Item added to cart');
    res.json({ success: true, cart, message: 'Item added to cart' });
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/cart/update - Update item quantity
// ============================================
router.post('/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log('🛒 POST /api/cart/update:', { productId, quantity });

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, error: 'Product ID and quantity are required' });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    if (cart.items.length === 0) {
      cart.store = null;
    }

    await cart.save();

    cart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name images price discountPrice salePrice unit quantity inStock stock'
      })
      .populate('store', 'name');

    console.log('✅ Cart updated');
    res.json({ success: true, cart });
  } catch (error) {
    console.error('❌ Error updating cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/cart/remove - Remove item from cart
// ============================================
router.post('/remove', async (req, res) => {
  try {
    const { productId } = req.body;
    console.log('🛒 POST /api/cart/remove:', { productId });

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    if (cart.items.length === 0) {
      cart.store = null;
    }

    await cart.save();

    cart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name images price discountPrice salePrice unit quantity inStock stock'
      })
      .populate('store', 'name');

    console.log('✅ Item removed from cart');
    res.json({ success: true, cart });
  } catch (error) {
    console.error('❌ Error removing from cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/cart/clear - Clear entire cart
// ============================================
router.post('/clear', async (req, res) => {
  try {
    console.log('🛒 POST /api/cart/clear - User:', req.userId);

    const cart = await Cart.findOneAndUpdate(
      { user: req.userId },
      { items: [], store: null },
      { new: true }
    );

    console.log('✅ Cart cleared');
    res.json({ success: true, cart: cart || { items: [], store: null } });
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;