// app/(auth)/admin-login.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../services/api";

export default function AdminLogin() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; name: string }>();
  const phone = params.phone || "";
  const adminName = params.name || "Admin";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleLogin = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter password");
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 Admin Login...");
      console.log("   Phone:", phone);

      const response = await api.adminLogin(phone, password);

      console.log("📨 Response:", response);

      if (response.success && response.data?.token && response.data?.user) {
        const token = response.data.token;
        const user = response.data.user;

        // Save auth data
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("userId", user.id || user._id);
        await AsyncStorage.setItem("userPhone", user.phone);
        await AsyncStorage.setItem("userRole", user.role);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("isLoggedIn", "true");

        console.log("✅ Admin Login Successful!");

        setLoading(false);

        Alert.alert("Welcome Admin! 🎉", `Logged in as ${user.name}`, [
          {
            text: "Continue",
            onPress: () => router.replace("/(dash)/home" as any),
          },
        ]);
      } else {
        setLoading(false);
        Alert.alert("Error", response.error || "Login failed");
      }
    } catch (error: any) {
      console.error("❌ Admin Login Error:", error);
      setLoading(false);
      Alert.alert(
        "Login Failed",
        error.data?.error || error.message || "Invalid credentials"
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={64} color="#1E3A8A" />
            </View>

            <Text style={styles.title}>Admin Login</Text>
            <Text style={styles.subtitle}>Enter your password to continue</Text>
            <View style={styles.phoneContainer}>
              <Text style={styles.adminName}>{adminName}</Text>
              <Text style={styles.phone}>+91 {phone}</Text>
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[styles.inputContainer, focused && styles.inputFocused]}
            >
              <Ionicons
                name="lock-closed"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter admin password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoFocus
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={!password || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={password ? ["#1E3A8A", "#3B82F6"] : ["#CBD5E1", "#CBD5E1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Login as Admin</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Contact system administrator if you forgot your password
          </Text>

          {/* Extra space for keyboard */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    alignSelf: "flex-start",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 16,
    textAlign: "center",
  },
  phoneContainer: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  adminName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
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
    borderWidth: 2,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    height: 56,
  },
  inputFocused: {
    borderColor: "#1E3A8A",
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  helpText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
});