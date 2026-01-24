// mobile/services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

// ==================== API CONFIGURATION ====================
// Change this based on your environment

// 🔧 For Android Emulator (Default)
const API_BASE_URL = "http://13.203.206.134:5000";

// 🔧 For iOS Simulator
// const API_BASE_URL = "http://localhost:5000";

// 🔧 For Physical Device (Replace XXX.XXX.XXX.XXX with your computer's local IP)
// Windows: Run 'ipconfig' in terminal, look for IPv4 Address
// Mac/Linux: Run 'ifconfig | grep inet' or 'ip addr show'
// const API_BASE_URL = "http://192.168.1.XXX:5000";

// 🔧 For Production (AWS Server)
// const API_BASE_URL = "http://13.203.206.134:5000";

// ==================== TYPES ====================
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface User {
  id: string;
  _id: string;
  phone: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  isPhoneVerified?: boolean;
  createdAt?: string;
}

interface LoginResponse {
  token: string;
  user: User;
  isNewUser?: boolean;
  testMode?: boolean;
}

interface CartItem {
  product: string;
  store: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  unit: string;
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  savings?: number;
  promoDiscount?: number;
  total?: number;
}

// ==================== API SERVICE CLASS ====================
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🌐 API Service initialized with:', this.baseURL);
  }

  // Get auth token from storage
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem("authToken");
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  // Set auth token
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem("authToken", token);
    } catch (error) {
      console.error("Error setting token:", error);
    }
  }

  // Clear auth token
  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userRole");
      await AsyncStorage.removeItem("isLoggedIn");
    } catch (error) {
      console.error("Error clearing token:", error);
    }
  }

  // Make API request with automatic token attachment
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const token = await this.getToken();
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Attach token if available
    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`📡 API Request: ${options.method || "GET"} ${endpoint}`);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle token expiry
      if (response.status === 401 && data.code === "TOKEN_EXPIRED") {
        console.log("🔑 Token expired, clearing auth...");
        await this.clearToken();
      }

      if (!response.ok) {
        console.log(`❌ API Error: ${response.status}`, data);
        throw {
          status: response.status,
          message: data.error || data.message || "Request failed",
          data,
        };
      }

      console.log(`✅ API Success: ${endpoint}`);
      return data;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      console.error(`❌ Network Error: ${endpoint}`, error.message);
      throw {
        status: 0,
        message: "Network error. Please check your connection and make sure the backend server is running.",
        error,
      };
    }
  }

  // ==================== HTTP METHODS ====================
  get<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    const queryString = Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return this.request<T>(`${endpoint}${queryString}`, { method: "GET" });
  }

  post<T = any>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  put<T = any>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  patch<T = any>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // ==================== AUTH APIs ====================
  
  testLogin(phone: string, role: string = "customer"): Promise<ApiResponse<LoginResponse>> {
    console.log('🧪 Calling test-login with:', { phone, role });
    return this.post("/api/auth/test-login", { phone, role, testMode: true });
  }

  otpLogin(firebaseToken: string, phone: string, role: string = "customer"): Promise<ApiResponse<LoginResponse>> {
    return this.post("/api/auth/otp-login", { firebaseToken, phone, role });
  }

  sendOtp(phone: string): Promise<ApiResponse<{ verificationId: string }>> {
    return this.post("/api/auth/send-otp", { phone });
  }

  verifyOtp(phone: string, otp: string, role: string = "customer"): Promise<ApiResponse<LoginResponse>> {
    return this.post("/api/auth/verify-otp", { phone, otp, role });
  }

  getMe(): Promise<ApiResponse<User>> {
    return this.get("/api/auth/me");
  }

  updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.put("/api/auth/profile", data);
  }

  changeRole(role: string): Promise<ApiResponse<LoginResponse>> {
    return this.post("/api/auth/change-role", { role });
  }

  validateToken(): Promise<ApiResponse<{ valid: boolean; user: User }>> {
    return this.get("/api/auth/validate");
  }

  // ==================== CUSTOMER APIs ====================

  getStores(params: Record<string, any> = {}): Promise<ApiResponse> {
    return this.get("/api/customer/stores", params);
  }

  getFeaturedStores(): Promise<ApiResponse> {
    return this.get("/api/customer/stores/featured");
  }

  getStore(storeId: string): Promise<ApiResponse> {
    return this.get(`/api/customer/stores/${storeId}`);
  }

  getStoreProducts(storeId: string, params: Record<string, any> = {}): Promise<ApiResponse> {
    return this.get(`/api/customer/stores/${storeId}/products`, params);
  }

  getProducts(params: Record<string, any> = {}): Promise<ApiResponse> {
    return this.get("/api/customer/products", params);
  }

  getProduct(productId: string): Promise<ApiResponse> {
    return this.get(`/api/customer/products/${productId}`);
  }

  getCategories(): Promise<ApiResponse> {
    return this.get("/api/customer/categories");
  }

  search(query: string, type: string = "all"): Promise<ApiResponse> {
    return this.get("/api/customer/search", { q: query, type });
  }

  getCustomerProfile(): Promise<ApiResponse> {
    return this.get("/api/customer/profile");
  }

  updateCustomerProfile(data: any): Promise<ApiResponse> {
    return this.put("/api/customer/profile", data);
  }

  addAddress(address: any): Promise<ApiResponse> {
  return this.post("/api/address", address);
}
deleteAddress(addressId: string): Promise<ApiResponse> {
  return this.delete(`/api/address/${addressId}`);
}
getAddresses(): Promise<ApiResponse> {
  return this.get("/api/address");
}
  toggleFavoriteStore(storeId: string): Promise<ApiResponse> {
    return this.post(`/api/customer/favorites/stores/${storeId}`);
  }

  // ==================== CART APIs ====================

  getCart(): Promise<ApiResponse<{ cart: { items: CartItem[] }; summary: CartSummary }>> {
    return this.get("/api/cart");
  }

  addToCart(productId: string, quantity: number = 1): Promise<ApiResponse> {
    return this.post("/api/cart/add", { productId, quantity });
  }

  updateCartItem(productId: string, quantity: number): Promise<ApiResponse> {
    return this.put("/api/cart/update", { productId, quantity });
  }

  removeFromCart(productId: string): Promise<ApiResponse> {
    return this.delete(`/api/cart/remove/${productId}`);
  }

  clearCart(): Promise<ApiResponse> {
    return this.delete("/api/cart/clear");
  }

  applyPromo(code: string): Promise<ApiResponse> {
    return this.post("/api/cart/promo", { code });
  }

  removePromo(): Promise<ApiResponse> {
    return this.delete("/api/cart/promo");
  }

  // ==================== ORDER APIs ====================

  createOrder(orderData: any): Promise<ApiResponse> {
    return this.post("/api/orders", orderData);
  }

  getOrders(params: Record<string, any> = {}): Promise<ApiResponse> {
    return this.get("/api/orders", params);
  }

  getOrder(orderId: string): Promise<ApiResponse> {
    return this.get(`/api/orders/${orderId}`);
  }

  cancelOrder(orderId: string, reason: string): Promise<ApiResponse> {
    return this.post(`/api/orders/${orderId}/cancel`, { reason });
  }

  rateOrder(orderId: string, rating: any): Promise<ApiResponse> {
    return this.post(`/api/orders/${orderId}/rate`, rating);
  }

  // ==================== VENDOR APIs ====================

  getVendorStore(): Promise<ApiResponse> {
    return this.get("/api/vendor/store");
  }

  createStore(storeData: any): Promise<ApiResponse> {
    return this.post("/api/vendor/store", storeData);
  }

  updateStore(storeData: any): Promise<ApiResponse> {
    return this.put("/api/vendor/store", storeData);
  }

  toggleStore(): Promise<ApiResponse> {
    return this.patch("/api/vendor/store/toggle");
  }

  getVendorProducts(params: Record<string, any> = {}): Promise<ApiResponse> {
    return this.get("/api/vendor/products", params);
  }

  getVendorProduct(productId: string): Promise<ApiResponse> {
    return this.get(`/api/vendor/products/${productId}`);
  }

  createProduct(productData: any): Promise<ApiResponse> {
    return this.post("/api/vendor/products", productData);
  }

  updateProduct(productId: string, productData: any): Promise<ApiResponse> {
    return this.put(`/api/vendor/products/${productId}`, productData);
  }

  deleteProduct(productId: string): Promise<ApiResponse> {
    return this.delete(`/api/vendor/products/${productId}`);
  }

  toggleProductStock(productId: string): Promise<ApiResponse> {
    return this.patch(`/api/vendor/products/${productId}/stock`);
  }

  getVendorOrders(params: Record<string, any> = {}): Promise<ApiResponse> {
    return this.get("/api/vendor/orders", params);
  }

  getVendorOrder(orderId: string): Promise<ApiResponse> {
    return this.get(`/api/vendor/orders/${orderId}`);
  }

  updateOrderStatus(orderId: string, status: string, note: string = ""): Promise<ApiResponse> {
    return this.patch(`/api/vendor/orders/${orderId}/status`, { status, note });
  }

  getVendorDashboard(): Promise<ApiResponse> {
    return this.get("/api/vendor/dashboard");
  }

  getVendorAnalytics(period: string = "week"): Promise<ApiResponse> {
    return this.get("/api/vendor/analytics", { period });
  }

  // ==================== DELIVERY APIs ====================

  getAvailableDeliveryOrders(): Promise<ApiResponse> {
    return this.get("/api/orders/delivery/available");
  }

  acceptDeliveryOrder(orderId: string): Promise<ApiResponse> {
    return this.post(`/api/orders/${orderId}/accept`);
  }

  updateDeliveryStatus(orderId: string, status: string, note: string = ""): Promise<ApiResponse> {
    return this.patch(`/api/orders/${orderId}/delivery-status`, { status, note });
  }

  getMyDeliveryOrders(status?: string): Promise<ApiResponse> {
    return this.get("/api/orders/delivery/my-orders", status ? { status } : {});
  }
}

// Export singleton instance
const api = new ApiService();
export default api;

// Also export types and class
export { ApiService, API_BASE_URL };
export type { ApiResponse, User, LoginResponse, CartItem, CartSummary };