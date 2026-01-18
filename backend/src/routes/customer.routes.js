// routes/customer.routes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../models/Store');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// Get nearby stores
router.get('/stores/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    
    const stores = await Store.find({
      isOpen: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius * 1000 // Convert to meters
        }
      }
    }).limit(20);
    
    res.json({ success: true, data: stores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get products by category
router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const products = await Product.find({
      category: categoryId,
      isAvailable: true
    })
      .populate('storeId', 'name rating')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments({ category: categoryId, isAvailable: true });
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get product details
router.get('/products/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('storeId', 'name rating location deliveryTime');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get cart
router.get('/cart', async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    let cart = await Cart.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: 'name price images unit'
      });
    
    if (!cart) {
      cart = await Cart.create({ userId, items: [], totalAmount: 0 });
    }
    
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add to cart
router.post('/cart/add', async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, selectedSize } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({ userId, items: [], totalAmount: 0 });
    }
    
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.selectedSize === selectedSize
    );
    
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        selectedSize,
        price: product.price
      });
    }
    
    // Calculate total
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate('items.productId', 'name price images unit');
    
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update cart item
router.put('/cart/update/:itemId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    item.quantity = quantity;
    
    // Calculate total
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate('items.productId', 'name price images unit');
    
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove from cart
router.delete('/cart/remove/:itemId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    
    // Calculate total
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate('items.productId', 'name price images unit');
    
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create order
router.post('/orders', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      storeId,
      items,
      deliveryAddress,
      paymentMethod,
      subtotal,
      deliveryFee,
      tax,
      discount,
      totalAmount
    } = req.body;
    
    // Generate unique order ID
    const orderId = `ORD${Date.now()}`;
    
    const order = await Order.create({
      orderId,
      userId,
      storeId,
      items,
      deliveryAddress,
      paymentMethod,
      subtotal,
      deliveryFee,
      tax,
      discount,
      totalAmount,
      orderStatus: 'pending',
      paymentStatus: 'pending'
    });
    
    // Clear cart
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalAmount: 0 }
    );
    
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user orders
router.get('/orders', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { userId };
    if (status) {
      query.orderStatus = status;
    }
    
    const orders = await Order.find(query)
      .populate('storeId', 'name image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get order details
router.get('/orders/:orderId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId, userId })
      .populate('storeId', 'name image location phone')
      .populate('deliveryPersonId', 'name phone');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel order
router.put('/orders/:orderId/cancel', async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { cancelReason } = req.body;
    
    const order = await Order.findOne({ orderId, userId });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order cannot be cancelled at this stage' 
      });
    }
    
    order.orderStatus = 'cancelled';
    order.cancelReason = cancelReason;
    order.updatedAt = new Date();
    
    await order.save();
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    
    const products = await Product.find({
      $text: { $search: query },
      isAvailable: true
    })
      .populate('storeId', 'name rating')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments({
      $text: { $search: query },
      isAvailable: true
    });
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;