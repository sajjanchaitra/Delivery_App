// app/(auth)/otp.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../services/api";

const OTP_LENGTH = 6;

interface Role {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function OTP() {

  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; testMode: string }>();
  const phone = params.phone || "";
  const isTestMode = params.testMode === "true";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [selectedRole, setSelectedRole] = useState<string>("customer");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  const handleOtpChange = (value: string, index: number): void => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste
    if (value.length > 1) {
      const digits = value.split("").slice(0, OTP_LENGTH);
      digits.forEach((digit, i) => {
        if (i < OTP_LENGTH) newOtp[i] = digit;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when complete
    // if (newOtp.every((digit) => digit !== "")) {
    //   setTimeout(() => handleVerifyOtp(newOtp.join("")), 300);
    // }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number): void => {
    const key = e.nativeEvent.key;
    if (key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const navigateToHome = (role: string): void => {
    setTimeout(() => {
      switch (role) {
        case "vendor":
          router.replace("/(vendor)/home" as any);
          break;
        case "delivery":
          router.replace("/(delivery)/home" as any);
          break;
        case "admin":
          router.replace("/(dash)/home" as any);
          break;
        default:
          router.replace("/(customer)/home" as any);
      }
    }, 100);
  };

  const handleVerifyOtp = async (otpCode: string): Promise<void> => {
  if (otpCode.length !== 6) {
    Alert.alert("Error", "Please enter a 6-digit OTP");
    return;
  }

  setLoading(true);

  try {
    console.log("🔐 Verifying OTP...");
    console.log("   Phone:", phone);
    console.log("   Role:", selectedRole);
    console.log("   Test Mode:", isTestMode);

    const response = await api.testLogin(phone, selectedRole);
    
    console.log("📨 Response:", JSON.stringify(response));

    // FIX: Access token and user from response.data
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

      console.log("✅ Login Successful!");
      console.log("   User:", user.name);
      console.log("   Role:", user.role);

      setLoading(false);
      
      Alert.alert(
        "Welcome! 🎉",
        `Logged in as ${user.name || "User"} (${user.role})`,
        [{ text: "Continue", onPress: () => navigateToHome(user.role) }]
      );
    } else {
      setLoading(false);
      Alert.alert("Error", response.error || "Login failed");
      resetOtp();
    }
  } catch (error: any) {
    console.error("❌ Login Error:", error);
    setLoading(false);
    Alert.alert("Error", error.message || "Login failed. Please try again.");
    resetOtp();
  }
};

  const resetOtp = (): void => {
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const handleResend = async (): Promise<void> => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      Alert.alert("Success", "OTP resent! (Test Mode: Use any 6 digits)");
      setResendTimer(30);
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");
  const maskedPhone = phone ? `******${phone.slice(-4)}` : "******1234";

  const roles: Role[] = [
    { id: "customer", label: "Customer", icon: "person" },
    { id: "vendor", label: "Vendor", icon: "storefront" },
    { id: "delivery", label: "Delivery", icon: "bicycle" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            {isTestMode
              ? `🧪 Test Mode: Enter any 6 digits\n+91 ${maskedPhone}`
              : `Enter the 6-digit code sent to\n+91 ${maskedPhone}`}
          </Text>
        </View>

        {isTestMode && (
          <View style={styles.testBanner}>
            <Ionicons name="flask" size={16} color="#F59E0B" />
            <Text style={styles.testBannerText}>
              Any 6-digit OTP will work
            </Text>
          </View>
        )}

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                focusedIndex === index && styles.otpInputFocused,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Role Selection */}
        <View style={styles.roleSection}>
          <Text style={styles.roleLabel}>Continue as:</Text>
          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.7}
                style={styles.roleButtonWrapper}
              >
                <View
  style={[
    styles.roleButton,
    selectedRole === role.id && styles.roleButtonSelected,
  ]}
>
  <Ionicons
    name={role.icon}
    size={20}
    color={selectedRole === role.id ? "#1E3A8A" : "#6B7280"}
  />
  <Text
    style={[
      styles.roleText,
      selectedRole === role.id && styles.roleTextSelected,
    ]}
  >
    {role.label}
  </Text>
</View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0 || loading}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.resendButton,
                resendTimer > 0 && styles.resendButtonDisabled,
              ]}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          onPress={() => handleVerifyOtp(otp.join(""))}
          disabled={!isOtpComplete || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isOtpComplete ? ["#DC2626", "#F87171"] : ["#CBD5E1", "#CBD5E1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
    marginBottom: 24,
  },
  header: {
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
    color: "#6B7280",
    lineHeight: 22,
  },
  testBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  testBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    textAlign: "center",
  },
  otpInputFocused: {
    borderColor: "#1E3A8A",
    backgroundColor: "#FFFFFF",
  },
  otpInputFilled: {
    backgroundColor: "#EFF6FF",
    borderColor: "#1E3A8A",
  },
  roleSection: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 10,
  },
  roleButtonWrapper: {
    flex: 1,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  roleButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  roleTextActive: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: "#6B7280",
  },
  resendButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E63946",
  },
  resendButtonDisabled: {
    color: "#94A3B8",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  roleButtonSelected: {
  borderColor: "#1E3A8A",
  backgroundColor: "#EFF6FF",
},

roleTextSelected: {
  color: "#1E3A8A",
},

});