import { Stack } from "expo-router";

export default function VendorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="store-setup" />
      <Stack.Screen name="add-product" />
      <Stack.Screen name="products" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}