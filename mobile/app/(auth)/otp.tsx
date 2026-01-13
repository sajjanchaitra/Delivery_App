import { View, TextInput, Button, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

export default function Otp() {
  const { confirm } = useLocalSearchParams<any>();
  const [code, setCode] = useState("");
  const router = useRouter();

  const verifyOtp = async () => {
    try {
      const result = await confirm(code);
      const token = await result.user.getIdToken();

      console.log("🔥 FIREBASE ID TOKEN:", token);

      // For now we stop here – no backend yet
      alert("OTP Verified. Token printed in terminal.");
    } catch (err) {
      alert("Invalid OTP");
    }
  };

  return (
    <View>
      <Text>Enter OTP</Text>
      <TextInput
        placeholder="6-digit OTP"
        keyboardType="numeric"
        onChangeText={setCode}
      />
      <Button title="Verify OTP" onPress={verifyOtp} />
    </View>
  );
}
