import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ CHANGE THIS TO YOUR BACKEND URL
// For Android Emulator: http://10.0.2.2:5000
// For iOS Simulator: http://localhost:5000
// For Physical Device: http://YOUR_COMPUTER_IP:5000
const API_BASE_URL = "http://192.168.1.36:5000/api";

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Helper function for API requests
const apiRequest = async (endpoint, method = "GET", body = null, isFormData = false) => {
  try {
    const token = await getAuthToken();
    
    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    console.log(`📡 API Request: ${method} ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "API request failed");
    }

    return { success: true, data };
  } catch (error) {
    console.error(`❌ API Error: ${endpoint}`, error);
    return { success: false, error: error.message };
  }
};

// ==================== AUTH API ====================
export const authAPI = {
  otpLogin: async (firebaseToken, phone, role) => {
    return apiRequest("/auth/otp-login", "POST", { firebaseToken, phone, role });
  },
  getMe: async () => {
    return apiRequest("/auth/me");
  },
  logout: async () => {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("userRole");
    return { success: true };
  },
};

// ==================== STORE API ====================
export const storeAPI = {
  saveStore: async (storeData) => {
    return apiRequest("/stores", "POST", storeData);
  },
  getMyStore: async () => {
    return apiRequest("/stores/my-store");
  },
  getAllStores: async () => {
    return apiRequest("/stores");
  },
  getStoreById: async (storeId) => {
    return apiRequest(`/stores/${storeId}`);
  },
  updateStoreStatus: async (isOpen) => {
    return apiRequest("/stores/status", "PATCH", { isOpen });
  },
};

// ==================== PRODUCT API ====================
export const productAPI = {
  createProduct: async (productData) => {
    return apiRequest("/products", "POST", productData);
  },
  getMyProducts: async () => {
    return apiRequest("/products/my-products");
  },
  getAllProducts: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/products?${queryParams}`);
  },
  getProductsByStore: async (storeId) => {
    return apiRequest(`/products/store/${storeId}`);
  },
  getProductById: async (productId) => {
    return apiRequest(`/products/${productId}`);
  },
  updateProduct: async (productId, productData) => {
    return apiRequest(`/products/${productId}`, "PUT", productData);
  },
  deleteProduct: async (productId) => {
    return apiRequest(`/products/${productId}`, "DELETE");
  },
  toggleStock: async (productId) => {
    return apiRequest(`/products/${productId}/toggle-stock`, "PATCH");
  },
};

// ==================== ORDER API ====================
export const orderAPI = {
  createOrder: async (orderData) => {
    return apiRequest("/orders", "POST", orderData);
  },
  getMyOrders: async () => {
    return apiRequest("/orders/my-orders");
  },
  getVendorOrders: async (status = "") => {
    const query = status ? `?status=${status}` : "";
    return apiRequest(`/orders/vendor-orders${query}`);
  },
  getOrderById: async (orderId) => {
    return apiRequest(`/orders/${orderId}`);
  },
  updateOrderStatus: async (orderId, status) => {
    return apiRequest(`/orders/${orderId}/status`, "PATCH", { status });
  },
  cancelOrder: async (orderId) => {
    return apiRequest(`/orders/${orderId}/cancel`, "PATCH");
  },
};

// ==================== CART API ====================
export const cartAPI = {
  getCart: async () => {
    return apiRequest("/cart");
  },
  addToCart: async (productId, quantity) => {
    return apiRequest("/cart/add", "POST", { productId, quantity });
  },
  updateCartItem: async (productId, quantity) => {
    return apiRequest("/cart/update", "PATCH", { productId, quantity });
  },
  removeFromCart: async (productId) => {
    return apiRequest(`/cart/remove/${productId}`, "DELETE");
  },
  clearCart: async () => {
    return apiRequest("/cart/clear", "DELETE");
  },
};

export default {
  auth: authAPI,
  store: storeAPI,
  product: productAPI,
  order: orderAPI,
  cart: cartAPI,
};