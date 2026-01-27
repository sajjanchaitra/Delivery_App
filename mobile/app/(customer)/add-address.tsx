import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

type AddressType = "home" | "work" | "other";

export default function AddAddress() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // you are passing: params: { addressId: addr._id }
  const addressId = (params.addressId as string) || "";
  const isEdit = !!addressId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    type: "home" as AddressType, // backend -> name
    fullName: "",
    phone: "",
    houseNo: "",
    area: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const getToken = async () => {
    // must match your other screens
    const token = await AsyncStorage.getItem("authToken");
    return token;
  };

  // Load address when editing
  const loadAddressForEdit = async () => {
    try {
      setLoading(true);

      const token = await getToken();
      if (!token) {
        Alert.alert("Login Required", "Please login again.");
        router.replace("/(auth)/login" as any);
        return;
      }

      const res = await fetch(`${API_URL}/api/address`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!data.success) {
        Alert.alert("Error", data.message || "Failed to load address");
        return;
      }

      const addr = (data.addresses || []).find((a: any) => a._id === addressId);

      if (!addr) {
        Alert.alert("Error", "Address not found");
        router.back();
        return;
      }

      setFormData({
        type: (addr.name as AddressType) || "home",
        fullName: addr.fullName || "",
        phone: addr.phone || "",
        houseNo: addr.houseNo || "",
        area: addr.area || "",
        landmark: addr.landmark || "",
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pincode || "",
        isDefault: !!addr.isDefault,
      });
    } catch (err) {
      console.log("❌ loadAddressForEdit error:", err);
      Alert.alert("Error", "Failed to load address");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) loadAddressForEdit();
  }, [isEdit]);

  const validate = () => {
    if (!formData.fullName.trim()) return "Please enter full name";
    if (!formData.phone.trim()) return "Please enter phone number";
    if (formData.phone.trim().length < 10) return "Please enter valid phone number";
    if (!formData.houseNo.trim()) return "Please enter house/flat/building";
    if (!formData.area.trim()) return "Please enter area/locality";
    if (!formData.city.trim()) return "Please enter city";
    if (!formData.state.trim()) return "Please enter state";
    if (!formData.pincode.trim()) return "Please enter pincode";
    if (formData.pincode.trim().length !== 6) return "Please enter valid 6-digit pincode";
    return "";
  };

  const handleSave = async () => {
    const msg = validate();
    if (msg) {
      Alert.alert("Error", msg);
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();
      if (!token) {
        Alert.alert("Login Required", "Please login again.");
        return;
      }

      const payload = {
        name: formData.type, // home/work/other
        fullName: formData.fullName,
        phone: String(formData.phone),
        houseNo: formData.houseNo,
        area: formData.area,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state,
        pincode: String(formData.pincode),
        isDefault: formData.isDefault,
      };

      const url = isEdit
        ? `${API_URL}/api/address/${addressId}`
        : `${API_URL}/api/address`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text(); // safer than res.json()
      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch (e) {
        data = {};
      }

      if (!res.ok) {
        Alert.alert("Error", data.message || `Request failed (${res.status})`);
        return;
      }

      if (data.success) {
        Alert.alert("Success", isEdit ? "Address updated!" : "Address added!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to save address");
      }
    } catch (err) {
      console.log("❌ handleSave error:", err);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading address...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{isEdit ? "Edit Address" : "Add Address"}</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Type</Text>

            <View style={styles.typeContainer}>
              {(["home", "work", "other"] as AddressType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, formData.type === type && styles.typeOptionActive]}
                  onPress={() => setFormData((p) => ({ ...p, type }))}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={type === "home" ? "home" : type === "work" ? "briefcase" : "location"}
                    size={18}
                    color={formData.type === type ? "#DC2626" : "#94A3B8"}
                  />
                  <Text style={[styles.typeText, formData.type === type && styles.typeTextActive]}>
                    {type === "home" ? "Home" : type === "work" ? "Work" : "Other"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(t) => setFormData((p) => ({ ...p, fullName: t }))}
              placeholder="Enter full name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(t) => setFormData((p) => ({ ...p, phone: t }))}
              placeholder="Enter phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>House / Flat *</Text>
            <TextInput
              style={styles.input}
              value={formData.houseNo}
              onChangeText={(t) => setFormData((p) => ({ ...p, houseNo: t }))}
              placeholder="House no, building name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area / Locality *</Text>
            <TextInput
              style={styles.input}
              value={formData.area}
              onChangeText={(t) => setFormData((p) => ({ ...p, area: t }))}
              placeholder="Area, colony, road"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Landmark</Text>
            <TextInput
              style={styles.input}
              value={formData.landmark}
              onChangeText={(t) => setFormData((p) => ({ ...p, landmark: t }))}
              placeholder="Near park, opposite mall"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(t) => setFormData((p) => ({ ...p, city: t }))}
                placeholder="City"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                value={formData.pincode}
                onChangeText={(t) => setFormData((p) => ({ ...p, pincode: t }))}
                placeholder="Pincode"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(t) => setFormData((p) => ({ ...p, state: t }))}
              placeholder="State"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Default */}
          <TouchableOpacity
            style={styles.defaultContainer}
            onPress={() => setFormData((p) => ({ ...p, isDefault: !p.isDefault }))}
            activeOpacity={0.85}
          >
            <Ionicons
              name={formData.isDefault ? "checkbox" : "square-outline"}
              size={22}
              color={formData.isDefault ? "#DC2626" : "#94A3B8"}
            />
            <Text style={styles.defaultText}>Set as default address</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEdit ? "Update Address" : "Save Address"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },

  scrollView: { flex: 1 },
  form: { padding: 20 },

  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },

  typeContainer: { flexDirection: "row", gap: 12 },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  typeOptionActive: { borderColor: "#DC2626", backgroundColor: "#FEE2E2" },
  typeText: { fontSize: 14, color: "#64748B" },
  typeTextActive: { color: "#DC2626", fontWeight: "700" },

  row: { flexDirection: "row" },

  defaultContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  defaultText: { fontSize: 15, color: "#1E293B" },

  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  saveButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  saveButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});