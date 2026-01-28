// mobile/app/(auth)/otp.tsx
// ✅ FINAL – Firebase OTP with reCAPTCHA (Expo + APK ready)

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
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { auth, firebaseConfig } from "../../firebase";
import api from "../../services/api";
import notificationService from "../../services/notification.service";

const OTP_LENGTH = 6;

export default function OTP() {
  const router = useRouter();
  const { phone = "" } = useLocalSearchParams<{ phone: string }>();

  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const confirmationRef = useRef<any>(null);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [verificationId, setVerificationId] = useState("");
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const [selectedRole, setSelectedRole] = useState<"customer" | "vendor" | "delivery">("customer");

  // ⏱ resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // 🔥 SEND OTP ON SCREEN LOAD
  useEffect(() => {
    sendOTP();
  }, []);

  const sendOTP = async () => {
    try {
      setLoading(true);

      const fullPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        fullPhone,
        recaptchaVerifier.current!
      );

      setVerificationId(confirmationRef.current.verificationId);
      setResendTimer(30);
    } catch (err: any) {
      console.error("❌ OTP SEND ERROR:", err);
      Alert.alert("Error", err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      Alert.alert("Error", "Enter 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCred = await signInWithCredential(auth, credential);
      const idToken = await userCred.user.getIdToken();

      // 🔐 Backend login
      const response = await api.firebaseLogin(idToken, phone, selectedRole);

     if (!response.data?.success) {
  throw new Error(response.data?.error || "Login failed");
}

const { token, user } = response.data.data;

      await AsyncStorage.multiSet([
        ["authToken", token],
        ["user", JSON.stringify(user)],
        ["userRole", user.role],
        ["isLoggedIn", "true"],
      ]);

      await notificationService.initialize();

      Alert.alert(
        "Welcome 🎉",
        `Logged in as ${user.role}`,
        [
          {
            text: "Continue",
            onPress: () => {
              if (user.role === "vendor") router.replace("/(vendor)/home" as any);
              else if (user.role === "delivery") router.replace("/(delivery)/home" as any);
              else router.replace("/(customer)/home" as any);
            },
          },
        ]
      );
    } catch (err: any) {
      console.error("❌ OTP VERIFY ERROR:", err);
      Alert.alert("Error", err.message || "Invalid OTP");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (v: string, i: number) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* 🔐 REQUIRED FOR FIREBASE OTP */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          OTP sent to +91 ******{phone.slice(-4)}
        </Text>

        <View style={styles.otpRow}>
          {otp.map((d, i) => (
            <TextInput
              key={i}
             ref={(r) => {
  inputRefs.current[i] = r;
}}

              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={d}
              onChangeText={(v) => handleChange(v, i)}
            />
          ))}
        </View>

        <View style={styles.roleRow}>
          {["customer", "vendor", "delivery"].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setSelectedRole(r as any)}
              style={[
                styles.roleBtn,
                selectedRole === r && styles.roleBtnActive,
              ]}
            >
              <Text>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={verifyOTP} disabled={loading}>
          <LinearGradient
            colors={["#1E3A8A", "#2563EB"]}
            style={styles.btn}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Verify & Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={resendTimer > 0}
          onPress={sendOTP}
        >
          <Text style={styles.resend}>
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
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { color: "#6B7280", marginBottom: 24 },
  otpRow: { flexDirection: "row", justifyContent: "space-between" },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
  },
  roleRow: { flexDirection: "row", marginVertical: 20, gap: 10 },
  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  roleBtnActive: { backgroundColor: "#DBEAFE" },
  btn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  resend: { textAlign: "center", marginTop: 16, color: "#DC2626" },
});
