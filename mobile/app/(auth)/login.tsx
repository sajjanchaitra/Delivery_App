import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Firebase imports - uncomment when ready for production
// import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
// import { PhoneAuthProvider } from "firebase/auth";
// import { auth, firebaseConfig } from "../../firebase";

const { width, height } = Dimensions.get("window");

// ⚠️ SET TO false FOR PRODUCTION
const TEST_MODE = true;

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  // Firebase Recaptcha ref - uncomment for production
  // const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    // TEST MODE - Skip Firebase and go directly to OTP screen
    if (TEST_MODE) {
      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone: phone,
          verificationId: "test-verification-id",
          testMode: "true",
        },
      });
      return;
    }

    // PRODUCTION MODE - Uncomment below when ready
    /*
    setLoading(true);
    try {
      const phoneNumber = `+91${phone}`;
      const phoneProvider = new PhoneAuthProvider(auth);

      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current!
      );

      setLoading(false);
      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone: phone,
          verificationId: verificationId,
          testMode: "false",
        },
      });
    } catch (error: any) {
      setLoading(false);
      console.error("Error sending OTP:", error);
      Alert.alert("Error", error.message || "Failed to send OTP. Please try again.");
    }
    */
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Firebase Recaptcha Modal - Uncomment for production */}
      {/* 
      {!TEST_MODE && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification={true}
        />
      )}
      */}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enter your mobile{"\n"}number</Text>
          <Text style={styles.subtitle}>
            We will send you a verification code
          </Text>
        </View>

        {/* Phone Input */}
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
              onChangeText={setPhone}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />

            {phone.length === 10 && (
              <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
            )}
          </View>
        </View>

        {/* Test Mode Indicator */}
        {TEST_MODE && (
          <View style={styles.testModeContainer}>
            <Ionicons name="information-circle" size={16} color="#F59E0B" />
            <Text style={styles.testModeText}>
              Test Mode: OTP verification will be skipped
            </Text>
          </View>
        )}

        {/* Send OTP Button */}
        <TouchableOpacity
          style={[styles.button, phone.length < 10 && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={phone.length < 10 || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        {/* Terms */}
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
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
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
  },
  inputFocused: {
    borderColor: "#22C55E",
    backgroundColor: "#FFFFFF",
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  code: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  testModeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 8,
  },
  testModeText: {
    fontSize: 13,
    color: "#D97706",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  termsText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
  termsLink: {
    color: "#22C55E",
    fontWeight: "600",
  },
});