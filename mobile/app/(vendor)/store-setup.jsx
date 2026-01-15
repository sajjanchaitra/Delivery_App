import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const storeCategories = [
  { id: "grocery", label: "Grocery", icon: "cart" },
  { id: "restaurant", label: "Restaurant", icon: "fast-food" },
  { id: "pharmacy", label: "Pharmacy", icon: "medical" },
  { id: "vegetables", label: "Vegetables", icon: "leaf" },
  { id: "dairy", label: "Dairy", icon: "water" },
  { id: "bakery", label: "Bakery", icon: "cafe" },
];

export default function StoreSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [storeImage, setStoreImage] = useState(null);

  const [store, setStore] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    email: "",
    openTime: "09:00 AM",
    closeTime: "09:00 PM",
    minOrder: "",
    deliveryFee: "",
    deliveryRadius: "",
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setStoreImage(result.assets[0].uri);
    }
  };

  const updateStore = (key, value) => {
    setStore({ ...store, [key]: value });
  };

  const handleSave = async () => {
    if (!store.name.trim()) {
      Alert.alert("Error", "Please enter store name");
      return;
    }
    if (!store.category) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (!store.address.trim()) {
      Alert.alert("Error", "Please enter store address");
      return;
    }
    if (!store.phone.trim()) {
      Alert.alert("Error", "Please enter phone number");
      return;
    }

    setLoading(true);

    // TODO: API call to save store
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Store details saved successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Setup</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Store Image */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {storeImage ? (
              <Image source={{ uri: storeImage }} style={styles.storeImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="storefront" size={40} color="#94A3B8" />
                <Text style={styles.imagePlaceholderText}>Add Store Logo</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter store name"
              placeholderTextColor="#94A3B8"
              value={store.name}
              onChangeText={(text) => updateStore("name", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell customers about your store..."
              placeholderTextColor="#94A3B8"
              value={store.description}
              onChangeText={(text) => updateStore("description", text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {storeCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    store.category === cat.id && styles.categoryCardActive,
                  ]}
                  onPress={() => updateStore("category", cat.id)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={24}
                    color={store.category === cat.id ? "#FFF" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      store.category === cat.id && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter complete store address"
              placeholderTextColor="#94A3B8"
              value={store.address}
              onChangeText={(text) => updateStore("address", text)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#94A3B8"
              value={store.phone}
              onChangeText={(text) => updateStore("phone", text)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor="#94A3B8"
              value={store.email}
              onChangeText={(text) => updateStore("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Hours</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Opening Time</Text>
              <TouchableOpacity style={styles.timeInput}>
                <Ionicons name="time-outline" size={20} color="#64748B" />
                <Text style={styles.timeText}>{store.openTime}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Closing Time</Text>
              <TouchableOpacity style={styles.timeInput}>
                <Ionicons name="time-outline" size={20} color="#64748B" />
                <Text style={styles.timeText}>{store.closeTime}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Delivery Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Settings</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Min Order (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor="#94A3B8"
                value={store.minOrder}
                onChangeText={(text) => updateStore("minOrder", text)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Delivery Fee (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor="#94A3B8"
                value={store.deliveryFee}
                onChangeText={(text) => updateStore("deliveryFee", text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Radius (km)</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor="#94A3B8"
              value={store.deliveryRadius}
              onChangeText={(text) => updateStore("deliveryRadius", text)}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.saveButtonText}>Save Store Details</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  imagePicker: {
    position: "relative",
  },
  storeImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 8,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#F8FAFC",
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
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1E293B",
  },
  textArea: {
    height: 80,
    paddingTop: 14,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "31%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryCardActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 8,
  },
  categoryLabelActive: {
    color: "#FFF",
  },
  row: {
    flexDirection: "row",
  },
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  timeText: {
    fontSize: 15,
    color: "#1E293B",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});