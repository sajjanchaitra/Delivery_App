import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

export interface User {
  _id: string;
  phone: string;
  role: "customer" | "vendor" | "delivery";
  name: string;
  email?: string;
  profileImage?: string;
  isPhoneVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

export interface UseAuthReturn extends AuthState {
  sendOtp: (phone: string) => Promise<AuthResult>;
  verifyOtp: (phone: string, otp: string, role: string) => Promise<AuthResult>;
  login: (phone: string, otp: string, role: string) => Promise<AuthResult>; // Alias for verifyOtp
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; profileImage?: string }) => Promise<void>;
  changeRole: (role: string) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Check existing auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const savedToken = await AsyncStorage.getItem("authToken");
      const savedUser = await AsyncStorage.getItem("user");

      if (savedToken && savedUser) {
        const user = JSON.parse(savedUser) as User;
        setState({
          user,
          token: savedToken,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
        return true;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        isAuthenticated: false,
      }));
      return false;
    } catch (err) {
      console.error("Check auth error:", err);
      setState((prev) => ({ ...prev, loading: false }));
      return false;
    }
  }, []);

  const sendOtp = useCallback(async (phone: string): Promise<AuthResult> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await authAPI.sendOtp(phone);

      setState((prev) => ({ ...prev, loading: false }));

      if (response.success) {
        return { success: true };
      }

      return { success: false, error: response.error || "Failed to send OTP" };
    } catch (err: any) {
      const errorMessage = err.error || err.message || "Failed to send OTP";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string, role: string): Promise<AuthResult> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await authAPI.verifyOtp(phone, otp, role);

      if (response.success && response.data) {
        const { token, user } = response.data;

        // Save to storage
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("userRole", user.role);

        setState({
          user: user as User,
          token,
          loading: false,
          error: null,
          isAuthenticated: true,
        });

        return { success: true };
      }

      setState((prev) => ({ ...prev, loading: false }));
      return { success: false, error: response.error || "Verification failed" };
    } catch (err: any) {
      const errorMessage = err.error || err.message || "Verification failed";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Alias for verifyOtp (for backward compatibility with AuthContext)
  const login = verifyOtp;

  const logout = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Call logout API (optional - for tracking)
      try {
        await authAPI.logout();
      } catch (e) {
        // Ignore API errors during logout
      }

      // Clear storage
      await AsyncStorage.multiRemove(["authToken", "user", "userRole"]);

      setState({
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });

      console.log("✅ Logged out successfully");
    } catch (err: any) {
      console.error("Logout error:", err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const updateProfile = useCallback(
    async (data: { name?: string; email?: string; profileImage?: string }): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await authAPI.updateProfile(data);

        if (response.success && response.data) {
          const updatedUser = response.data as User;

          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

          setState((prev) => ({
            ...prev,
            user: updatedUser,
            loading: false,
          }));

          console.log("✅ Profile updated");
          return;
        }

        throw new Error(response.error || "Update failed");
      } catch (err: any) {
        const errorMessage = err.error || err.message || "Update failed";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        throw new Error(errorMessage);
      }
    },
    []
  );

  const changeRole = useCallback(async (role: string): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await authAPI.changeRole(role);

      if (response.success && response.data) {
        const { token, user } = response.data;

        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("userRole", user.role);

        setState((prev) => ({
          ...prev,
          user: user as User,
          token,
          loading: false,
        }));

        console.log("✅ Role changed to:", role);
        return;
      }

      throw new Error(response.error || "Role change failed");
    } catch (err: any) {
      const errorMessage = err.error || err.message || "Role change failed";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  const clearError = useCallback((): void => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendOtp,
    verifyOtp,
    login,
    logout,
    updateProfile,
    changeRole,
    checkAuth,
    clearError,
  };
};