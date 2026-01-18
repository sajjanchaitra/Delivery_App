// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
          }}
        >
          {/* Index is the entry point - it decides where to go */}
          <Stack.Screen name="index" />
          
          {/* Onboarding */}
          <Stack.Screen name="onboarding" />
          
          {/* Auth screens */}
          <Stack.Screen 
            name="(auth)" 
            options={{ animation: "slide_from_right" }}
          />
          
          {/* Main app screens */}
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(vendor)" />
          <Stack.Screen name="(delivery)" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}