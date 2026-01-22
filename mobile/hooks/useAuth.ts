// mobile/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { User, LoginResponse } from "../services/api";

export interface UseAuthReturn {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; verificationId?: string; error?: string }>;
  verifyOtp: (phone: string, otp: string, role: string) => Promise<{ success: boolean; error?: string }>;
  login: (phone: string, otp: string, role: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changeRole: (role: string) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const storedToken = await AsyncStorage.getItem("authToken");
      const storedUser = await AsyncStorage.getItem("user");

      console.log("🔍 Checking auth...");
      console.log("   Token exists:", !!storedToken);
      console.log("   User exists:", !!storedUser);

      if (storedToken && storedToken !== "null" && storedToken !== "undefined") {
        setToken(storedToken);

        if (storedUser && storedUser !== "null") {
          try {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log("✅ Auth restored:", parsedUser.name || parsedUser.phone);
            return true;
          } catch (parseError) {
            console.log("⚠️ Failed to parse user");
          }
        }

        try {
          const response = await api.getMe();
          if (response.success && response.data) {
            setUser(response.data);
            await AsyncStorage.setItem("user", JSON.stringify(response.data));
            console.log("✅ Auth verified with API");
            return true;
          }
        } catch (apiError: any) {
          console.log("⚠️ API auth check failed:", apiError.message);
          if (apiError.status === 401) {
            await clearAuthData();
          }
        }
      }

      console.log("❌ Not authenticated");
      return false;
    } catch (err: any) {
      console.error("❌ Auth check error:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAuthData = async (): Promise<void> => {
    await AsyncStorage.multiRemove([
      "authToken",
      "user",
      "userId",
      "userPhone",
      "userRole",
      "isLoggedIn",
    ]);
    setToken(null);
    setUser(null);
  };

  const sendOtp = useCallback(async (phone: string): Promise<{ success: boolean; verificationId?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.sendOtp(phone);
      console.log("📱 OTP sent:", response.success);
      
      return {
        success: response.success,
        verificationId: response.data?.verificationId,
      };
    } catch (err: any) {
      console.error("❌ Send OTP error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string, role: string = "customer"): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.verifyOtp(phone, otp, role);
      
      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;

        await AsyncStorage.setItem("authToken", newToken);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        await AsyncStorage.setItem("userId", userData.id || userData._id);
        await AsyncStorage.setItem("userRole", userData.role);
        await AsyncStorage.setItem("isLoggedIn", "true");

        setToken(newToken);
        setUser(userData);

        console.log("✅ OTP verified:", userData.name || userData.phone);
        return { success: true };
      }

      return { success: false, error: response.error || "Verification failed" };
    } catch (err: any) {
      console.error("❌ Verify OTP error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (phone: string, _otp: string, role: string = "customer"): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      console.log("🧪 Attempting test login...");
      
      const response = await api.testLogin(phone, role);
      
      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;

        await AsyncStorage.setItem("authToken", newToken);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        await AsyncStorage.setItem("userId", userData.id || userData._id);
        await AsyncStorage.setItem("userPhone", userData.phone);
        await AsyncStorage.setItem("userRole", userData.role);
        await AsyncStorage.setItem("isLoggedIn", "true");

        setToken(newToken);
        setUser(userData);

        console.log("✅ Test login successful!");
        console.log("   User:", userData.name || userData.phone);
        console.log("   Role:", userData.role);
        console.log("   Token:", newToken.substring(0, 30) + "...");
        
        return { success: true, user: userData };
      }

      return { success: false, error: response.error || "Login failed" };
    } catch (err: any) {
      console.error("❌ Test login error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      try {
        await api.post("/api/auth/logout");
      } catch (e) {
        // Ignore
      }

      await clearAuthData();
      console.log("✅ Logged out");
    } catch (err: any) {
      console.error("❌ Logout error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.updateProfile(data);
      
      if (response.success && response.data) {
        const updatedUser: User = { ...user!, ...response.data };
        setUser(updatedUser);
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (err: any) {
      console.error("❌ Update profile error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const changeRole = useCallback(async (newRole: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.changeRole(newRole);
      
      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;

        await AsyncStorage.setItem("authToken", newToken);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        await AsyncStorage.setItem("userRole", userData.role);

        setToken(newToken);
        setUser(userData);

        console.log("✅ Role changed to:", newRole);
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (err: any) {
      console.error("❌ Change role error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    sendOtp,
    verifyOtp,
    login,
    logout,
    updateProfile,
    changeRole,
    checkAuth,
    clearError,
  };
}

export type { User };
export default useAuth;