// app/(auth)/login.tsx
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

// Test mode flag - set to false for production Firebase OTP
const ENABLE_TEST_MODE = true;

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  const handleContinue = async (): Promise<void> => {
    const cleanPhone = phone.replace(/\D/g, "");
    
    if (cleanPhone.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      console.log("📱 Checking phone:", cleanPhone);
      
      // Check if phone belongs to admin
      const checkResponse = await api.checkAdmin(cleanPhone);
      
      if (checkResponse.success && checkResponse.isAdmin) {
        // Redirect to admin password screen
        console.log("🔐 Admin detected, redirecting to password screen");
        setLoading(false);
        router.push({
          pathname: "/(auth)/admin-login" as any,
          params: { phone: cleanPhone, name: checkResponse.name || "Admin" },
        });
        return;
      }

      // Regular user - Navigate to OTP screen
      console.log("📱 Regular user, continuing to OTP");
      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone: cleanPhone,
          testMode: ENABLE_TEST_MODE ? "true" : "false",
        },
      });
    } catch (error: any) {
      console.error("❌ Error:", error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
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
          <Text style={styles.subtitle}>
            {ENABLE_TEST_MODE 
              ? "🧪 Test Mode - Any 6-digit OTP works" 
              : "We will send you a verification code"}
          </Text>
        </View>

        {ENABLE_TEST_MODE && (
          <View style={styles.testBanner}>
            <Ionicons name="flask" size={16} color="#F59E0B" />
            <Text style={styles.testBannerText}>
              Testing Mode Active
            </Text>
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputContainer, focused && styles.inputFocused]}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.code}>+91</Text>
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
              onChangeText={(text: string) => setPhone(text.replace(/\D/g, ""))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />

            {phone.length === 10 && (
              <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, phone.length < 10 && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={phone.length < 10 || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our{" "}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {" & "}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingTop: 50 
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: "#F8FAFC", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 24 
  },
  header: { 
    marginBottom: 32 
  },
  title: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#1E293B", 
    lineHeight: 36, 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 15, 
    color: "#64748B" 
  },
  testBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  testBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  inputSection: { 
    marginBottom: 24 
  },
  label: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#334155", 
    marginBottom: 10 
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#F8FAFC", 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: "#E2E8F0", 
    paddingHorizontal: 16, 
    height: 56 
  },
  inputFocused: { 
    borderColor: "#22C55E", 
    backgroundColor: "#FFFFFF" 
  },
  countryCode: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6 
  },
  flag: { 
    fontSize: 20 
  },
  code: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#1E293B" 
  },
  divider: { 
    width: 1, 
    height: 28, 
    backgroundColor: "#E2E8F0", 
    marginHorizontal: 14 
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: "#1E293B", 
    fontWeight: "500" 
  },
  button: { 
    backgroundColor: "#22C55E", 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 20 
  },
  buttonDisabled: { 
    backgroundColor: "#CBD5E1" 
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#FFFFFF" 
  },
  termsText: { 
    fontSize: 13, 
    color: "#94A3B8", 
    textAlign: "center", 
    lineHeight: 20 
  },
  termsLink: { 
    color: "#22C55E", 
    fontWeight: "600" 
  },
});