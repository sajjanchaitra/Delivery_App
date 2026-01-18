// app/index.tsx
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthAndNavigate();
  }, []);

  const checkAuthAndNavigate = async () => {
    try {
      // Check if user has seen onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
      
      // Check if user is logged in
      const authToken = await AsyncStorage.getItem("authToken");
      const userRole = await AsyncStorage.getItem("userRole");

      console.log("🔍 Auth Check:");
      console.log("   Has seen onboarding:", hasSeenOnboarding);
      console.log("   Auth token:", authToken ? "Yes" : "No");
      console.log("   User role:", userRole);

      // Small delay for splash effect
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!hasSeenOnboarding) {
        // First time user - show onboarding
        console.log("➡️ Navigating to: Onboarding");
        router.replace("/onboarding");
      } else if (!authToken) {
        // Not logged in - show login
        console.log("➡️ Navigating to: Login");
        router.replace("/(auth)/login");
      } else {
        // Logged in - go to appropriate home based on role
        console.log("➡️ Navigating to:", userRole, "home");
        switch (userRole) {
          case "vendor":
            router.replace("/(vendor)/home");
            break;
          case "delivery":
            router.replace("/(delivery)/home");
            break;
          default:
            router.replace("/(customer)/home");
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.replace("/onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#22C55E" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});