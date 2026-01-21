// app/(vendor)/store-setup.tsx
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

export default function StoreSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter store name");
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert("Error", "Please enter phone number");
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert("Error", "Please enter address");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");

      const storeData = {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          coordinates: [0, 0], // Default coordinates
        },
        isOpen: true,
        isActive: true,
      };

      const response = await fetch(`${API_URL}/api/vendor/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(storeData),
      });

      const data = await response.json();
      console.log("Store creation response:", data);

      if (data.success) {
        Alert.alert("Success", "Store created successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/(vendor)/home"),
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to create store");
      }
    } catch (error) {
      console.error("Store creation error:", error);
      Alert.alert("Error", "Failed to create store");
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
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Street address"
            placeholderTextColor="#94A3B8"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#94A3B8"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="State"
              placeholderTextColor="#94A3B8"
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Pincode</Text>
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