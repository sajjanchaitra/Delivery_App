// mobile/app/(auth)/otp.tsx
// ✅ FINAL – React Native Firebase OTP (NO CAPTCHA, APK SAFE)

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
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

// ✅ Use React Native Firebase (NOT firebase/auth)
import auth from '@react-native-firebase/auth';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

import api from "../../services/api";
import notificationService from "../../services/notification.service";

const OTP_LENGTH = 6;

export default function OTP() {
  const router = useRouter();
  const { phone = "" } = useLocalSearchParams<{ phone: string }>();

  // Store confirmation result
  const confirmationRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(true);
  const [resendTimer, setResendTimer] = useState(30);
  const [selectedRole, setSelectedRole] = useState<"customer" | "vendor" | "delivery">("customer");

  // ⏱ Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // 🔥 Send OTP on mount
  useEffect(() => {
    sendOTP();
  }, []);

  // 📱 SEND OTP using React Native Firebase
  const sendOTP = async () => {
    try {
      setSendingOTP(true);
      const fullPhone = `+91${phone}`;

      console.log("📱 Sending OTP to:", fullPhone);

      // ✅ React Native Firebase - NO reCAPTCHA needed!
      const confirmation = await auth().signInWithPhoneNumber(fullPhone);
      confirmationRef.current = confirmation;

      setResendTimer(30);
      console.log("✅ OTP sent successfully");
    } catch (err: any) {
      console.error("❌ OTP SEND ERROR:", err.code, err.message);
      
      let errorMessage = "Failed to send OTP";
      
      switch (err.code) {
        case 'auth/invalid-phone-number':
          errorMessage = "Invalid phone number";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many attempts. Try again later";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Check your connection";
          break;
        case 'auth/app-not-authorized':
          errorMessage = "App not authorized. Contact support";
          break;
        default:
          errorMessage = err.message || "Failed to send OTP";
      }
      
      Alert.alert("OTP Error", errorMessage);
    } finally {
      setSendingOTP(false);
    }
  };

  // 🔐 VERIFY OTP
  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      Alert.alert("Error", "Enter 6-digit OTP");
      return;
    }

    if (!confirmationRef.current) {
      Alert.alert("Error", "OTP session expired. Please resend OTP");
      return;
    }

    try {
      setLoading(true);

      console.log("🔐 Verifying OTP...");

      // ✅ Confirm OTP with React Native Firebase
      const userCredential = await confirmationRef.current.confirm(code);
      
      if (!userCredential.user) {
        throw new Error("Verification failed");
      }

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      console.log("✅ OTP verified, calling backend...");

      // Call backend
      const response: any = await api.firebaseLogin(idToken, phone, selectedRole);

      if (!response?.data?.success) {
        throw new Error(response?.data?.error || "Login failed");
      }

      const { token, user } = response.data.data;

      // Store auth data
      await AsyncStorage.multiSet([
        ["authToken", token],
        ["user", JSON.stringify(user)],
        ["userRole", user.role],
        ["isLoggedIn", "true"],
      ]);

      // Initialize notifications
      try {
        await notificationService.initialize();
      } catch (notifErr) {
        console.log("Notification init error (non-fatal):", notifErr);
      }

      console.log("✅ Login successful as:", user.role);

      Alert.alert("Welcome 🎉", `Logged in as ${user.role}`, [
        {
          text: "Continue",
          onPress: () => {
            if (user.role === "vendor") {
              router.replace("/(vendor)/home" as any);
            } else if (user.role === "delivery") {
              router.replace("/(delivery)/home" as any);
            } else {
              router.replace("/(customer)/home" as any);
            }
          },
        },
      ]);
    } catch (err: any) {
      console.error("❌ OTP VERIFY ERROR:", err.code, err.message);
      
      let errorMessage = "Invalid OTP. Please try again";
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid OTP code";
      } else if (err.code === 'auth/code-expired' || err.code === 'auth/session-expired') {
        errorMessage = "OTP expired. Please resend";
      }
      
      Alert.alert("Verification Failed", errorMessage);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleChange = (v: string, i: number) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  // Handle backspace
  const handleKeyPress = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          OTP sent to +91 ******{phone.slice(-4)}
        </Text>

        {/* OTP Input */}
        <View style={styles.otpRow}>
          {otp.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                inputRefs.current[i] = r;
              }}
              style={[
                styles.otpInput,
                d && styles.otpInputFilled,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={d}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              editable={!sendingOTP}
            />
          ))}
        </View>

        {/* Role Selection */}
        <Text style={styles.roleLabel}>Login as:</Text>
        <View style={styles.roleRow}>
          {(["customer", "vendor", "delivery"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setSelectedRole(r)}
              style={[
                styles.roleBtn,
                selectedRole === r && styles.roleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.roleBtnText,
                  selectedRole === r && styles.roleBtnTextActive,
                ]}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity 
          onPress={verifyOTP} 
          disabled={loading || sendingOTP || otp.join("").length !== 6}
        >
          <LinearGradient
            colors={loading || sendingOTP ? ["#94A3B8", "#94A3B8"] : ["#1E3A8A", "#2563EB"]}
            style={styles.btn}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : sendingOTP ? (
              <Text style={styles.btnText}>Sending OTP...</Text>
            ) : (
              <Text style={styles.btnText}>Verify & Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity 
          disabled={resendTimer > 0 || sendingOTP} 
          onPress={sendOTP}
        >
          <Text style={[
            styles.resend,
            (resendTimer > 0 || sendingOTP) && styles.resendDisabled
          ]}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "700", color: "#1E293B", marginBottom: 8 },
  subtitle: { color: "#6B7280", marginBottom: 32 },
  
  otpRow: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },
  otpInputFilled: {
    borderColor: "#1E3A8A",
    backgroundColor: "#FFF",
  },
  
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
  },
  roleRow: { 
    flexDirection: "row", 
    marginBottom: 24, 
    gap: 10,
  },
  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  roleBtnActive: { 
    backgroundColor: "#DBEAFE",
    borderColor: "#1E3A8A",
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  roleBtnTextActive: {
    color: "#1E3A8A",
  },
  
  btn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  
  resend: { 
    textAlign: "center", 
    marginTop: 20, 
    color: "#DC2626",
    fontWeight: "600",
  },
  resendDisabled: {
    color: "#94A3B8",
  },
});