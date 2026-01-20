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
  Switch,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000"; // Update with your backend URL


export default function StoreSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasStore, setHasStore] = useState(false);

  const [storeData, setStoreData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    // Address fields
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    // Delivery settings
    deliveryRadius: "5",
    minimumOrder: "100",
    deliveryFee: "30",
    freeDeliveryAbove: "500",
    estimatedDeliveryTime: "30-45 mins",
  });

  const [businessHours, setBusinessHours] = useState({
    monday: { open: "09:00", close: "21:00", isOpen: true },
    tuesday: { open: "09:00", close: "21:00", isOpen: true },
    wednesday: { open: "09:00", close: "21:00", isOpen: true },
    thursday: { open: "09:00", close: "21:00", isOpen: true },
    friday: { open: "09:00", close: "21:00", isOpen: true },
    saturday: { open: "09:00", close: "21:00", isOpen: true },
    sunday: { open: "09:00", close: "21:00", isOpen: false },
  });

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      // Use vendor route - GET /api/vendor/store
      const response = await fetch(`${API_URL}/api/vendor/store`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.hasStore && data.store) {
        setHasStore(true);
        const store = data.store;

        setStoreData({
          name: store.name || "",
          description: store.description || "",
          phone: store.phone || "",
          email: store.email || "",
          street: store.address?.street || "",
          landmark: store.address?.landmark || "",
          city: store.address?.city || "",
          state: store.address?.state || "",
          pincode: store.address?.pincode || "",
          deliveryRadius:
            store.deliverySettings?.deliveryRadius?.toString() || "5",
          minimumOrder:
            store.deliverySettings?.minimumOrder?.toString() || "100",
          deliveryFee: store.deliverySettings?.deliveryFee?.toString() || "30",
          freeDeliveryAbove:
            store.deliverySettings?.freeDeliveryAbove?.toString() || "500",
          estimatedDeliveryTime:
            store.deliverySettings?.estimatedDeliveryTime || "30-45 mins",
        });

        if (store.businessHours) {
          setBusinessHours(store.businessHours);
        }
      } else {
        setHasStore(false);
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!storeData.name.trim()) {
      Alert.alert("Validation Error", "Please enter store name");
      return false;
    }
    if (!storeData.phone.trim()) {
      Alert.alert("Validation Error", "Please enter phone number");
      return false;
    }
    if (!storeData.street.trim()) {
      Alert.alert("Validation Error", "Please enter street address");
      return false;
    }
    if (!storeData.city.trim()) {
      Alert.alert("Validation Error", "Please enter city");
      return false;
    }
    if (!storeData.pincode.trim()) {
      Alert.alert("Validation Error", "Please enter pincode");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("authToken");

      // Prepare payload matching your Store model
      const payload = {
        name: storeData.name,
        description: storeData.description,
        phone: storeData.phone,
        email: storeData.email,
        address: {
          street: storeData.street,
          landmark: storeData.landmark,
          city: storeData.city,
          state: storeData.state,
          pincode: storeData.pincode,
        },
        deliverySettings: {
          deliveryRadius: parseFloat(storeData.deliveryRadius),
          minimumOrder: parseFloat(storeData.minimumOrder),
          deliveryFee: parseFloat(storeData.deliveryFee),
          freeDeliveryAbove: parseFloat(storeData.freeDeliveryAbove),
          estimatedDeliveryTime: storeData.estimatedDeliveryTime,
        },
        businessHours,
      };

      // Use vendor route - POST or PUT based on hasStore
      const url = `${API_URL}/api/vendor/store`;
      const method = hasStore ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          "Success",
          hasStore
            ? "Store details updated successfully!"
            : "Store created successfully!"
        );
        if (!hasStore) {
          setHasStore(true);
          // Save store ID if needed
          if (data.store && data.store._id) {
            await AsyncStorage.setItem("storeId", data.store._id);
          }
        }
      } else {
        Alert.alert("Error", data.error || "Failed to save store details");
      }
    } catch (error) {
      console.error("Save store error:", error);
      Alert.alert("Error", "Failed to save store details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      {/* Header */}
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {hasStore ? "Store Settings" : "Create Store"}
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter store name"
              placeholderTextColor="#94A3B8"
              value={storeData.name}
              onChangeText={(text) =>
                setStoreData({ ...storeData, name: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your store..."
              placeholderTextColor="#94A3B8"
              value={storeData.description}
              onChangeText={(text) =>
                setStoreData({ ...storeData, description: text })
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor="#94A3B8"
                value={storeData.phone}
                onChangeText={(text) =>
                  setStoreData({ ...storeData, phone: text })
                }
                keyboardType="phone-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#94A3B8"
                value={storeData.email}
                onChangeText={(text) =>
                  setStoreData({ ...storeData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Street address"
              placeholderTextColor="#94A3B8"
              value={storeData.street}
              onChangeText={(text) =>
                setStoreData({ ...storeData, street: text })
              }
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Landmark</Text>
            <TextInput
              style={styles.input}
              placeholder="Nearby landmark"
              placeholderTextColor="#94A3B8"
              value={storeData.landmark}
              onChangeText={(text) =>
                setStoreData({ ...storeData, landmark: text })
              }
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#94A3B8"
                value={storeData.city}
                onChangeText={(text) =>
                  setStoreData({ ...storeData, city: text })
                }
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor="#94A3B8"
                value={storeData.state}
                onChangeText={(text) =>
                  setStoreData({ ...storeData, state: text })
                }
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={styles.input}
              placeholder="Pincode"
              placeholderTextColor="#94A3B8"
              value={storeData.pincode}
              onChangeText={(text) =>
                setStoreData({ ...storeData, pincode: text })
              }
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>

        {/* Delivery Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Settings</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Delivery Radius (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                placeholderTextColor="#94A3B8"
                value={storeData.deliveryRadius}
                onChangeText={(text) =>
                  setStoreData({ ...storeData, deliveryRadius: text })
                }
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Delivery Fee (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor="#94A3B8"
                value={storeData.deliveryFee}
                onChangeText={(text) =>
                  setStoreData({ ...storeData, deliveryFee: text })
                }
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Min Order (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor="#94A3B8"
                value={storeData.minimumOrder}
                onChangeText={(text) =>
                  setStoreData({ ...storeData, minimumOrder: text })
                }
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Free Delivery Above (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="500"
                placeholderTextColor="#94A3B8"
                value={storeData.freeDeliveryAbove}
                onChangeText={(text) =>
                  setStoreData({ ...storeData, freeDeliveryAbove: text })
                }
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Delivery Time</Text>
            <TextInput
              style={styles.input}
              placeholder="30-45 mins"
              placeholderTextColor="#94A3B8"
              value={storeData.estimatedDeliveryTime}
              onChangeText={(text) =>
                setStoreData({ ...storeData, estimatedDeliveryTime: text })
              }
            />
          </View>
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Hours</Text>
          {Object.keys(businessHours).map((day) => (
            <View key={day} style={styles.dayRow}>
              <View style={styles.dayLeft}>
                <Text style={styles.dayName}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
                <Switch
                  value={businessHours[day].isOpen}
                  onValueChange={(value) =>
                    setBusinessHours({
                      ...businessHours,
                      [day]: { ...businessHours[day], isOpen: value },
                    })
                  }
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={businessHours[day].isOpen ? "#22C55E" : "#FFF"}
                />
              </View>
              {businessHours[day].isOpen && (
                <View style={styles.dayRight}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="09:00"
                    placeholderTextColor="#94A3B8"
                    value={businessHours[day].open}
                    onChangeText={(text) =>
                      setBusinessHours({
                        ...businessHours,
                        [day]: { ...businessHours[day], open: text },
                      })
                    }
                  />
                  <Text style={styles.timeSeparator}>to</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="21:00"
                    placeholderTextColor="#94A3B8"
                    value={businessHours[day].close}
                    onChangeText={(text) =>
                      setBusinessHours({
                        ...businessHours,
                        [day]: { ...businessHours[day], close: text },
                      })
                    }
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={saving ? ["#94A3B8", "#94A3B8"] : ["#22C55E", "#16A34A"]}
            style={styles.saveGradient}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={styles.saveText}>
                  {hasStore ? "Save Changes" : "Create Store"}
                </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
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
    height: 80,
    paddingTop: 14,
  },
  row: {
    flexDirection: "row",
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dayName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    width: 100,
  },
  dayRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1E293B",
    width: 70,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 13,
    color: "#94A3B8",
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
  saveButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});