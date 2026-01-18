// app/(customer)/_layout.tsx
import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="product-details" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="order-details" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="support" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="checkout" />
    </Stack>
  );
}