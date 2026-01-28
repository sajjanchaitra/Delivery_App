// mobile/app/(auth)/admin-login.tsx
// Admin Password Login Screen

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

export default function AdminLogin() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; name: string }>();
  const phone = params.phone || "";
  const adminName = params.name || "Admin";

  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  const handleLogin = async (): Promise<void> => {
    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 Admin login attempt for:", phone);

      const response: any = await api.adminLogin(phone, password);

      if (response.success && response.data?.token && response.data?.user) {
        const { token, user } = response.data;

        // Save auth data
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("userId", user.id || user._id);
        await AsyncStorage.setItem("userPhone", user.phone);
        await AsyncStorage.setItem("userRole", user.role);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("isLoggedIn", "true");

        console.log("✅ Admin login successful!");

        setLoading(false);

        Alert.alert(
          "Welcome Back! 👋",
          `Logged in as ${user.name}`,
          [
            {
              text: "Continue",
              onPress: () => {
                setTimeout(() => {
                  router.replace("/(dash)/home" as any);
                }, 100);
              },
            },
          ]
        );
      } else {
        setLoading(false);
        Alert.alert("Error", response.error || "Login failed");
      }
    } catch (error: any) {
      console.error("❌ Admin login error:", error);
      setLoading(false);
      Alert.alert(
        "Login Failed",
        error.message || "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={24} color="#1E3A8A" />
            <Text style={styles.adminBadgeText}>Admin Login</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            {adminName} • +91 ******{phone.slice(-4)}
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputContainer, focused && styles.inputFocused]}>
            <Ionicons name="lock-closed" size={20} color="#6B7280" />
            
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !password && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={!password || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="log-in" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Login as Admin</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.switchButtonText}>
            Not an admin? <Text style={styles.switchButtonLink}>Login with OTP</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    justifyContent: "center",
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: "absolute",
    top: 50,
    left: 24,
  },
  header: {
    marginBottom: 32,
    marginTop: 80,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  adminBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  inputFocused: {
    borderColor: "#1E3A8A",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E3A8A",
    fontWeight: "500",
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  switchButton: {
    alignItems: "center",
  },
  switchButtonText: {
    fontSize: 14,
    color: "#6B7280",
  },
  switchButtonLink: {
    color: "#E63946",
    fontWeight: "600",
  },
});