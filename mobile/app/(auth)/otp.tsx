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
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OTP_LENGTH = 6;
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://13.203.206.134:5000";

export default function Otp() {
  const params = useLocalSearchParams();
  const phone = (params.phone as string) || "";
  const verificationId = (params.verificationId as string) || "";
  const router = useRouter();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedRole, setSelectedRole] = useState("customer");

  // Fix: Properly type the input refs array
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

  // Fix: Add proper types to function parameters
  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];

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
  };

  // Fix: Add proper types to function parameters
  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Fix: Add proper type to function parameter
  const navigateToHome = (role: string) => {
    setTimeout(() => {
      switch (role) {
        case "vendor":
          router.replace("/(vendor)/home");
          break;
        case "delivery":
          router.replace("/(delivery)/home");
          break;
        default:
          router.replace("/(customer)/home");
      }
    }, 100);
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert("Error", "Please enter complete 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 Verifying OTP with Firebase...");

      // Step 1: Verify with Firebase
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      const userCredential = await signInWithCredential(auth, credential);
      
      console.log("✅ Firebase authentication successful");

      // Step 2: Get Firebase ID token
      const firebaseToken = await userCredential.user.getIdToken();
      console.log("🎟️ Got Firebase token");

      // Step 3: Send to backend to create/login user
      console.log("💾 Saving to backend...");
      
      const response = await fetch(`${API_URL}/api/auth/firebase-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseToken,
          phone,
          role: selectedRole,
        }),
      });

      const data = await response.json();
      console.log("📨 Backend response:", data);

      if (data.success) {
        const { token, user } = data.data;

        // Save auth data
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("userRole", user.role);

        setLoading(false);
        Alert.alert("Success! ✅", `Welcome ${user.name || "User"}!`, [
          {
            text: "Continue",
            onPress: () => navigateToHome(user.role),
          },
        ]);
      } else {
        setLoading(false);
        Alert.alert("Error", data.error || "Failed to save user");
        resetOtp();
      }
    } catch (error) {
      setLoading(false);
      console.error("❌ Error:", error);

      // Fix: Type the error properly
      const err = error as any;
      let errorMessage = "Failed to verify OTP. Please try again.";

      if (err.code === "auth/invalid-verification-code") {
        errorMessage = "Invalid OTP. Please check and try again.";
      } else if (err.code === "auth/code-expired") {
        errorMessage = "OTP expired. Please request a new one.";
      }

      Alert.alert("Error", errorMessage);
      resetOtp();
    }
  };

  const resetOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    router.back();
  };

  const isOtpComplete = otp.every((digit) => digit !== "");
  const maskedPhone = phone ? `******${phone.slice(-4)}` : "******1234";

  const roles = [
    { id: "customer", label: "Customer", icon: "person" as const },
    { id: "vendor", label: "Vendor", icon: "storefront" as const },
    { id: "delivery", label: "Delivery", icon: "bicycle" as const },
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
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.phoneText}>+91 {maskedPhone}</Text>
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (inputRefs.current) {
                  inputRefs.current[index] = ref;
                }
              }}
              style={[
                styles.otpInput,
                focusedIndex === index && styles.otpInputFocused,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e.nativeEvent.key, index)}
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.roleSection}>
          <Text style={styles.roleLabel}>Continue as:</Text>
          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleButton,
                  selectedRole === role.id && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={role.icon}
                  size={20}
                  color={selectedRole === role.id ? "#FFFFFF" : "#64748B"}
                />
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === role.id && styles.roleTextActive,
                  ]}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0}
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

        <TouchableOpacity
          style={[styles.button, !isOtpComplete && styles.buttonDisabled]}
          onPress={verifyOtp}
          disabled={!isOtpComplete || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
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
    backgroundColor: "#F8FAFC",
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
    color: "#1E293B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
  },
  phoneText: {
    fontWeight: "600",
    color: "#1E293B",
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
    color: "#1E293B",
    textAlign: "center",
  },
  otpInputFocused: {
    borderColor: "#22C55E",
    backgroundColor: "#FFFFFF",
  },
  otpInputFilled: {
    backgroundColor: "#F0FDF4",
    borderColor: "#22C55E",
  },
  roleSection: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 10,
  },
  roleButton: {
    flex: 1,
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
  roleButtonActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  roleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  roleTextActive: {
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
    color: "#64748B",
  },
  resendButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
  },
  resendButtonDisabled: {
    color: "#94A3B8",
  },
  button: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});