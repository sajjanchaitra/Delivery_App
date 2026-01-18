import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

console.log("🔗 API Base URL:", API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor - Add JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("📤 Request Error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    console.log("📥 Response:", response.status);
    return response;
  },
  async (error) => {
    console.error("📥 Error:", error.response?.status, error.response?.data);

    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["authToken", "user", "userRole"]);
      console.log("🔒 Token expired - logged out");
    }

    return Promise.reject(error.response?.data || error);
  }
);

// ============ AUTH API ============
export const authAPI = {
  /**
   * Send OTP to phone number
   */
  sendOtp: async (phone) => {
    const response = await api.post("/api/auth/send-otp", { phone });
    return response.data;
  },

  /**
   * Verify OTP and login/register
   */
  verifyOtp: async (phone, otp, role) => {
    const response = await api.post("/api/auth/verify-otp", { phone, otp, role });
    return response.data;
  },

  /**
   * Resend OTP
   */
  resendOtp: async (phone) => {
    const response = await api.post("/api/auth/resend-otp", { phone });
    return response.data;
  },

  /**
   * Get current user profile
   */
  getMe: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data) => {
    const response = await api.post("/api/auth/update-profile", data);
    return response.data;
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },

  /**
   * Change user role
   */
  changeRole: async (role) => {
    const response = await api.post("/api/auth/change-role", { role });
    return response.data;
  },
};

export default api;