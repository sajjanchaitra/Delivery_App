// app/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.multiRemove([
        'authToken',
        'userId',
        'userRole',
        'user',
        'isLoggedIn',
      ]);
      // Navigate to login
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default {
  // ==================== AUTH ====================
  
  /**
   * Firebase OTP Login (Production)
   */
  firebaseLogin: async (firebaseToken: string, phone: string, role: string) => {
    return api.post('/auth/firebase-login', {
      firebaseToken,
      phone,
      role,
    });
  },

  /**
   * Test Login (Development)
   */
  testLogin: async (phone: string, role: string) => {
    return api.post('/auth/test-login', { phone, role });
  },

  /**
   * Check if phone is admin
   */
  checkAdmin: async (phone: string) => {
    return api.post('/auth/check-admin', { phone });
  },

  /**
   * Admin login with password
   */
  adminLogin: async (phone: string, password: string) => {
    return api.post('/auth/admin-login', { phone, password });
  },

  /**
   * Get current user
   */
  getMe: async () => {
    return api.get('/auth/me');
  },

  /**
   * Update profile
   */
  updateProfile: async (data: { name?: string; email?: string; profileImage?: string }) => {
    return api.put('/auth/profile', data);
  },

  /**
   * Update FCM token for push notifications
   */
  updateFCMToken: async (fcmToken: string) => {
    return api.post('/auth/fcm-token', { fcmToken });
  },

  /**
   * Logout
   */
  logout: async () => {
    return api.post('/auth/logout');
  },

  /**
   * Validate token
   */
  validateToken: async () => {
    return api.get('/auth/validate');
  },

  // ==================== ORDERS ====================
  
  /**
   * Create order
   */
  createOrder: async (orderData: any) => {
    return api.post('/orders', orderData);
  },

  /**
   * Get user orders
   */
  getOrders: async (params?: { status?: string; role?: string }) => {
    return api.get('/orders', { params });
  },

  /**
   * Get order by ID
   */
  getOrderById: async (orderId: string) => {
    return api.get(`/orders/${orderId}`);
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId: string, status: string, data?: any) => {
    return api.patch(`/orders/${orderId}/status`, { status, ...data });
  },

  /**
   * Cancel order
   */
  cancelOrder: async (orderId: string, reason: string) => {
    return api.patch(`/orders/${orderId}/cancel`, { reason });
  },

  /**
   * Assign delivery partner
   */
  assignDeliveryPartner: async (orderId: string, deliveryPartnerId: string) => {
    return api.patch(`/orders/${orderId}/assign`, { deliveryPartnerId });
  },

  // ==================== VENDORS ====================
  
  /**
   * Get all vendors
   */
  getVendors: async () => {
    return api.get('/vendors');
  },

  /**
   * Get vendor by ID
   */
  getVendorById: async (vendorId: string) => {
    return api.get(`/vendors/${vendorId}`);
  },

  /**
   * Get vendor products
   */
  getVendorProducts: async (vendorId: string) => {
    return api.get(`/vendors/${vendorId}/products`);
  },

  // ==================== PRODUCTS ====================
  
  /**
   * Get all products
   */
  getProducts: async (params?: { category?: string; search?: string }) => {
    return api.get('/products', { params });
  },

  /**
   * Get product by ID
   */
  getProductById: async (productId: string) => {
    return api.get(`/products/${productId}`);
  },

  /**
   * Create product (Vendor)
   */
  createProduct: async (productData: any) => {
    return api.post('/products', productData);
  },

  /**
   * Update product (Vendor)
   */
  updateProduct: async (productId: string, productData: any) => {
    return api.put(`/products/${productId}`, productData);
  },

  /**
   * Delete product (Vendor)
   */
  deleteProduct: async (productId: string) => {
    return api.delete(`/products/${productId}`);
  },

  // ==================== CART ====================
  
  /**
   * Get cart
   */
  getCart: async () => {
    return api.get('/cart');
  },

  /**
   * Add to cart
   */
  addToCart: async (productId: string, quantity: number) => {
    return api.post('/cart/add', { productId, quantity });
  },

  /**
   * Update cart item
   */
  updateCartItem: async (productId: string, quantity: number) => {
    return api.patch('/cart/update', { productId, quantity });
  },

  /**
   * Remove from cart
   */
  removeFromCart: async (productId: string) => {
    return api.delete(`/cart/remove/${productId}`);
  },

  /**
   * Clear cart
   */
  clearCart: async () => {
    return api.delete('/cart/clear');
  },

  // ==================== DELIVERY ====================
  
  /**
   * Get available deliveries
   */
  getAvailableDeliveries: async () => {
    return api.get('/delivery/available');
  },

  /**
   * Accept delivery
   */
  acceptDelivery: async (orderId: string) => {
    return api.post(`/delivery/${orderId}/accept`);
  },

  /**
   * Complete delivery
   */
  completeDelivery: async (orderId: string) => {
    return api.post(`/delivery/${orderId}/complete`);
  },

  /**
   * Get delivery history
   */
  getDeliveryHistory: async () => {
    return api.get('/delivery/history');
  },

  // ==================== ANALYTICS ====================
  
  /**
   * Get vendor analytics
   */
  getVendorAnalytics: async () => {
    return api.get('/analytics/vendor');
  },

  /**
   * Get admin analytics
   */
  getAdminAnalytics: async () => {
    return api.get('/analytics/admin');
  },
};