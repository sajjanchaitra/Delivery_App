import { View, TextInput, Button, Alert } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../firebase";

export default function Otp() {
  const { vid } = useLocalSearchParams();
  const router = useRouter();
  const [code, setCode] = useState("");

  const verifyOtp = async () => {
    try {
      const credential = PhoneAuthProvider.credential(vid as string, code);
      const result = await signInWithCredential(auth, credential);
      const token = await result.user.getIdToken();

      console.log("Firebase Token:", token);

      Alert.alert("Success", "OTP verified successfully");
      router.replace("/home");
    } catch (err) {
      Alert.alert("Error", "Invalid OTP");
    }
  };

  return (
    <View>
      <TextInput placeholder="Enter OTP" onChangeText={setCode} />
      <Button title="Verify OTP" onPress={verifyOtp} />
    </View>
  );
}
