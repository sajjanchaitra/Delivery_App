import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://13.203.206.134:5000";

console.log("🔗 API Base URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["authToken", "user", "userRole"]);
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authAPI = {
  firebaseLogin: async (firebaseToken, phone, role) => {
    const response = await api.post("/api/auth/firebase-login", {
      firebaseToken,
      phone,
      role,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.post("/api/auth/update-profile", data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },

  changeRole: async (role) => {
    const response = await api.post("/api/auth/change-role", { role });
    return response.data;
  },
};

export default api;