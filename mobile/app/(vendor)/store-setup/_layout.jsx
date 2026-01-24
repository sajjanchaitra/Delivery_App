// app/(vendor)/store-setup/_layout.jsx
import { Stack } from "expo-router";

export default function StoreSetupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="medical" />
      <Stack.Screen name="restaurant" />
      <Stack.Screen name="general" />
    </Stack>
  );
}