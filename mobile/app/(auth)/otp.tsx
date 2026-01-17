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
  ScrollView,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const OTP_LENGTH = 6;

// ⚠️ TEST MODE - Set to false for production
const TEST_MODE = true;
const TEST_OTP = "123456";

export default function Otp() {
  const params = useLocalSearchParams();
  const phone = (params.phone as string) || "";
  const router = useRouter();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedRole, setSelectedRole] = useState("customer");

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste (multiple digits)
    if (value.length > 1) {
      const digits = value.split("").slice(0, OTP_LENGTH);
      digits.forEach((digit, i) => {
        if (i < OTP_LENGTH) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Navigate based on role
  const navigateToHome = (role: string) => {
    console.log("Navigating to:", role);
    
    // Use setTimeout to ensure navigation happens
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

  const verifyOtp = () => {
    const otpCode = otp.join("");
    
    console.log("Entered OTP:", otpCode);
    console.log("Expected OTP:", TEST_OTP);
    console.log("Selected Role:", selectedRole);

    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert("Error", "Please enter complete 6-digit OTP");
      return;
    }

    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      if (TEST_MODE) {
        if (otpCode === TEST_OTP) {
          setLoading(false);
          Alert.alert(
            "Success! ✅",
            `Login successful as ${selectedRole}!`,
            [
              {
                text: "Continue",
                onPress: () => navigateToHome(selectedRole),
              },
            ]
          );
        } else {
          setLoading(false);
          Alert.alert(
            "Wrong OTP",
            `Please enter: ${TEST_OTP}`,
            [{ text: "OK" }]
          );
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      }
    }, 1000);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    Alert.alert("OTP Sent", "A new OTP has been sent to your phone");
  };

  const isOtpComplete = otp.every((digit) => digit !== "");
  const maskedPhone = phone ? `******${phone.slice(-4)}` : "******1234";

  const roles = [
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
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.phoneText}>+91 {maskedPhone}</Text>
          </Text>
        </View>

        {/* Test Mode Indicator */}
        {TEST_MODE && (
          <View style={styles.testModeContainer}>
            <Ionicons name="information-circle" size={16} color="#F59E0B" />
            <Text style={styles.testModeText}>
              Test Mode: Use OTP "{TEST_OTP}"
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
              onKeyPress={(e) => handleKeyPress(e.nativeEvent.key, index)}
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
                style={[
                  styles.roleButton,
                  selectedRole === role.id && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={role.icon as any}
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

        {/* Resend Section */}
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

        {/* Verify Button */}
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

        {/* Debug Info */}
        {TEST_MODE && (
          <Text style={styles.debugText}>
            Entered: {otp.join("")} | Complete: {isOtpComplete ? "Yes" : "No"}
          </Text>
        )}
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
  testModeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  testModeText: {
    fontSize: 13,
    color: "#D97706",
    fontWeight: "500",
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
  debugText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
  },
});