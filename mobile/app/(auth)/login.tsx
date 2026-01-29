// mobile/app/(auth)/login.tsx
// ✅ FINAL – Firebase OTP + Admin Login (PRODUCTION READY)

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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import firebaseOTPService from "../../services/firebase-otp.service";

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleContinue = async () => {
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      console.log("📱 Checking phone:", cleanPhone);

      // 🔐 STEP 1: Check admin from backend
      const adminCheck: any = await api.checkAdmin(cleanPhone);

      if (adminCheck?.success && adminCheck?.isAdmin) {
        setLoading(false);
        router.push({
          pathname: "/(auth)/admin-login",
          params: {
            phone: cleanPhone,
            name: adminCheck.name || "Admin",
          },
        });
        return;
      }

      // 🔥 STEP 2: Send Firebase OTP
      console.log("📱 Sending Firebase OTP...");
      await firebaseOTPService.sendOTP(`+91${cleanPhone}`);

      console.log("✅ OTP sent successfully");

      setLoading(false);
      router.push({
        pathname: "/(auth)/otp",
        params: { phone: cleanPhone },
      });
    } catch (error: any) {
      console.error("❌ LOGIN ERROR:", error);
      setLoading(false);
      Alert.alert("Error", error.message || "Failed to send OTP");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Let's Get Started</Text>
          <Text style={styles.subtitle}>
            We’ll send a verification code to your phone
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Phone Number</Text>

          <View style={[styles.inputContainer, focused && styles.inputFocused]}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.code}>+91</Text>
            </View>

            <View style={styles.divider} />

            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />

            {phone.length === 10 && (
              <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, phone.length !== 10 && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={phone.length !== 10 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our{" "}
          <Text style={styles.link}>Terms</Text> &{" "}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", color: "#1E3A8A" },
  subtitle: { color: "#6B7280", marginTop: 6 },

  inputSection: { marginBottom: 24 },
  label: { fontWeight: "600", marginBottom: 8, color: "#1E3A8A" },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#F8FAFC",
  },
  inputFocused: {
    borderColor: "#1E3A8A",
    backgroundColor: "#FFF",
  },

  countryCode: { flexDirection: "row", alignItems: "center", gap: 6 },
  flag: { fontSize: 20 },
  code: { fontWeight: "600", color: "#1E3A8A" },
  divider: { width: 1, height: 28, backgroundColor: "#E2E8F0", marginHorizontal: 12 },

  input: { flex: 1, fontSize: 16 },

  button: {
    backgroundColor: "#E63946",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#CBD5E1" },
  buttonText: { color: "#FFF", fontWeight: "600", fontSize: 16 },

  termsText: {
    marginTop: 20,
    fontSize: 12,
    textAlign: "center",
    color: "#94A3B8",
  },
  link: { color: "#E63946", fontWeight: "600" },
});
