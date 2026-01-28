// mobile/app/services/api.ts
// PRODUCTION API Service - Add these methods to your existing api.ts

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
      await AsyncStorage.multiRemove([
        'authToken',
        'userId',
        'userRole',
        'user',
        'isLoggedIn',
      ]);
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

  // ... rest of your existing API methods (orders, products, etc.)
};