import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with your backend URL
const API_BASE_URL = "http://192.168.1.100:5000/api"; // Change to your IP/server

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // 'customer', 'vendor', 'delivery'

  // Check for existing session on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      const storedUser = await AsyncStorage.getItem("user");
      const storedRole = await AsyncStorage.getItem("userRole");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setUserRole(storedRole);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP to phone number
  const sendOtp = async (phoneNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      return { success: true, data };
    } catch (error) {
      console.error("Send OTP error:", error);
      return { success: false, error: error.message };
    }
  };

  // Verify OTP and login
  const verifyOtp = async (phoneNumber, otp, firebaseToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: otp,
          firebaseToken: firebaseToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify OTP");
      }

      // Store auth data
      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("userRole", data.user.role || "customer");

      setToken(data.token);
      setUser(data.user);
      setUserRole(data.user.role || "customer");

      return { success: true, data };
    } catch (error) {
      console.error("Verify OTP error:", error);
      return { success: false, error: error.message };
    }
  };

  // Login with Firebase token (alternative method)
  const loginWithFirebaseToken = async (firebaseToken, phone) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseToken: firebaseToken,
          phone: phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to login");
      }

      // Store auth data
      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("userRole", data.user.role || "customer");

      setToken(data.token);
      setUser(data.user);
      setUserRole(data.user.role || "customer");

      return { success: true, data };
    } catch (error) {
      console.error("Firebase login error:", error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userRole");
      setToken(null);
      setUser(null);
      setUserRole(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  // Update user role
  const updateUserRole = async (role) => {
    try {
      await AsyncStorage.setItem("userRole", role);
      setUserRole(role);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    userRole,
    isAuthenticated: !!token,
    sendOtp,
    verifyOtp,
    loginWithFirebaseToken,
    logout,
    updateUserRole,
    API_BASE_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;