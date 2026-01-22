// app/(vendor)/store-setup.tsx
// FIXED VERSION - Uses centralized API service (JavaScript compatible)

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../services/api"; // Import the centralized API service

export default function StoreSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    category: "grocery",
  });


  const handleLogout = async () => {
  Alert.alert("Logout", "Are you sure you want to logout?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Logout",
      style: "destructive",
      onPress: async () => {
        await api.clearToken();
        router.replace("/(auth)/login");
      },
    },
  ]);
};


  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter store name");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length !== 10) {
      Alert.alert("Error", "Please enter valid 10-digit phone number");
      return;
    }
    if (!formData.street.trim()) {
      Alert.alert("Error", "Please enter street address");
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert("Error", "Please enter city");
      return;
    }
    if (!formData.state.trim()) {
      Alert.alert("Error", "Please enter state");
      return;
    }
    if (!formData.pincode.trim() || formData.pincode.length !== 6) {
      Alert.alert("Error", "Please enter valid 6-digit pincode");
      return;
    }

    setLoading(true);
    try {
      console.log("📤 Creating store with data:", formData);

      // Correct data structure matching backend Store model
      const storeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || "A great store",
        category: formData.category,
        phone: formData.phone.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          landmark: "",
        },
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
        businessHours: {
          monday: { open: "09:00", close: "21:00", isOpen: true },
          tuesday: { open: "09:00", close: "21:00", isOpen: true },
          wednesday: { open: "09:00", close: "21:00", isOpen: true },
          thursday: { open: "09:00", close: "21:00", isOpen: true },
          friday: { open: "09:00", close: "21:00", isOpen: true },
          saturday: { open: "09:00", close: "21:00", isOpen: true },
          sunday: { open: "09:00", close: "21:00", isOpen: false },
        },
        isOpen: true,
        isActive: true,
      };

      // Use the centralized API service
      const response = await api.createStore(storeData);

      console.log("✅ Store creation response:", response);

      if (response.success) {
        Alert.alert(
          "Success! 🎉",
          "Your store has been created successfully!",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(vendor)/home"),
            },
          ]
        );
      } else {
        console.error("❌ Store creation failed:", response.error);
        Alert.alert("Error", response.error || "Failed to create store");
      }
    } catch (error) {
      console.error("❌ Store creation error:", error);
      Alert.alert(
        "Error",
        error.message || "Network error. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
  <TouchableOpacity
    style={styles.backButton}
    onPress={() => router.back()}
  >
    <Ionicons name="arrow-back" size={24} color="#FFF" />
  </TouchableOpacity>

  <Text style={styles.headerTitle}>Setup Your Store</Text>

  {/* Logout Button */}
  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
    <Ionicons name="log-out-outline" size={22} color="#FFF" />
  </TouchableOpacity>
</View>

      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#22C55E" />
          <Text style={styles.infoText}>
            Fill in all required fields to create your store
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Store Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Fresh Mart"
            placeholderTextColor="#94A3B8"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell customers about your store..."
            placeholderTextColor="#94A3B8"
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            placeholderTextColor="#94A3B8"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Street Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Shop 123, Main Road"
            placeholderTextColor="#94A3B8"
            value={formData.street}
            onChangeText={(text) => setFormData({ ...formData, street: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mumbai"
              placeholderTextColor="#94A3B8"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Maharashtra"
              placeholderTextColor="#94A3B8"
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Pincode *</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit pincode"
            placeholderTextColor="#94A3B8"
            value={formData.pincode}
            onChangeText={(text) => setFormData({ ...formData, pincode: text })}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ["#94A3B8", "#94A3B8"] : ["#22C55E", "#16A34A"]}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="storefront" size={22} color="#FFF" />
                <Text style={styles.submitText}>Create Store</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoutButton: {
  width: 44,
  height: 44,
  borderRadius: 12,
  backgroundColor: "rgba(255,255,255,0.2)",
  justifyContent: "center",
  alignItems: "center",
},

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#166534",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  row: {
    flexDirection: "row",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  submitButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});