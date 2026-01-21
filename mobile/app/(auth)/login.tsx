// app/(auth)/login.tsx
// FIXED: Removed expo-firebase-recaptcha which causes crash
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    
    if (cleanPhone.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      console.log("📱 Sending OTP to:", `+91${cleanPhone}`);

      // Call backend to send OTP
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await response.json();
      console.log("OTP Response:", data);

      if (data.success) {
        console.log("✅ OTP Sent!");
        router.push({
          pathname: "/(auth)/otp",
          params: {
            phone: cleanPhone,
            verificationId: data.verificationId || data.sessionId || "backend",
          },
        });
      } else {
        Alert.alert("Error", data.message || data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("❌ Error sending OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please check your connection.");
    } finally {
      setLoading(false);
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
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{"Enter your mobile\nnumber"}</Text>
          <Text style={styles.subtitle}>{"We will send you a verification code"}</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>{"Phone Number"}</Text>
          <View style={[styles.inputContainer, focused && styles.inputFocused]}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>{"🇮🇳"}</Text>
              <Text style={styles.code}>{"+91"}</Text>
              <Ionicons name="chevron-down" size={16} color="#94A3B8" />
            </View>

            <View style={styles.divider} />

            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/\D/g, ""))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />

            {phone.length === 10 ? (
              <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, phone.length < 10 && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={phone.length < 10 || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>{"Send OTP"}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          <Text>{"By continuing, you agree to our "}</Text>
          <Text style={styles.termsLink}>{"Terms of Service"}</Text>
          <Text>{" & "}</Text>
          <Text style={styles.termsLink}>{"Privacy Policy"}</Text>
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 50 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", color: "#1E293B", lineHeight: 36, marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#64748B" },
  inputSection: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 10 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 16, height: 56 },
  inputFocused: { borderColor: "#22C55E", backgroundColor: "#FFFFFF" },
  countryCode: { flexDirection: "row", alignItems: "center", gap: 6 },
  flag: { fontSize: 20 },
  code: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  divider: { width: 1, height: 28, backgroundColor: "#E2E8F0", marginHorizontal: 14 },
  input: { flex: 1, fontSize: 16, color: "#1E293B", fontWeight: "500" },
  button: { backgroundColor: "#22C55E", borderRadius: 12, paddingVertical: 16, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  buttonDisabled: { backgroundColor: "#CBD5E1" },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  termsText: { fontSize: 13, color: "#94A3B8", textAlign: "center", lineHeight: 20 },
  termsLink: { color: "#22C55E", fontWeight: "600" },
});