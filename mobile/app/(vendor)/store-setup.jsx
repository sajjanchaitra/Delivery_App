import React, { useState } from "react";
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
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const API_URL = "http://13.203.206.134:5000";

export default function StoreSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [storeImage, setStoreImage] = useState(null);

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

  const categories = [
    { id: "grocery", label: "Grocery", icon: "cart" },
    { id: "vegetables", label: "Vegetables", icon: "leaf" },
    { id: "fruits", label: "Fruits", icon: "nutrition" },
    { id: "dairy", label: "Dairy", icon: "water" },
    { id: "bakery", label: "Bakery", icon: "cafe" },
    { id: "meat", label: "Meat", icon: "restaurant" },
    { id: "pharmacy", label: "Pharmacy", icon: "medkit" },
    { id: "restaurant", label: "Restaurant", icon: "fast-food" },
  ];

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("user");
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please grant gallery permission to upload images"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setStoreImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please grant camera permission to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setStoreImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImageOptions = () => {
    Alert.alert("Add Store Image", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const uploadImage = async (imageUri) => {
    try {
      setImageLoading(true);
      console.log("📤 Uploading store image...");

      const formDataImg = new FormData();
      const filename = imageUri.split("/").pop() || `store-${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formDataImg.append("image", {
        uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
        type,
        name: filename,
      });

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formDataImg,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();
      console.log("✅ Upload response:", data);

      if (data.success && data.imageUrl) {
        return data.imageUrl;
      }

      throw new Error(data.error || "Upload failed");
    } catch (error) {
      console.error("❌ Image upload error:", error);
      return null;
    } finally {
      setImageLoading(false);
    }
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
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Login Required", "Please login again");
        router.replace("/(auth)/login");
        return;
      }

      // Upload image if selected
      let uploadedImageUrl = "";
      if (storeImage) {
        console.log("🖼️ Uploading store image...");
        const imageUrl = await uploadImage(storeImage);
        if (imageUrl) uploadedImageUrl = imageUrl;
      }

      const storeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || "A great store",
        category: formData.category,
        phone: formData.phone.trim(),

        image: uploadedImageUrl,
        logo: uploadedImageUrl,
        coverImage: uploadedImageUrl,

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

      console.log("📤 Creating store with data:", storeData);

      const response = await fetch(`${API_URL}/api/vendor/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(storeData),
      });

      const data = await response.json();
      console.log("✅ Store creation response:", data);

      if (data.success) {
        Alert.alert("Success! 🎉", "Your store has been created successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/(vendor)/home"),
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to create store");
      }
    } catch (error) {
      console.error("❌ Store creation error:", error);
      Alert.alert("Error", error.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Setup Your Store</Text>

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

        {/* Store Image Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>Store Image</Text>

          <TouchableOpacity
            style={styles.imageUpload}
            onPress={showImageOptions}
            disabled={imageLoading}
          >
            {imageLoading ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.imagePlaceholderText}>Uploading...</Text>
              </View>
            ) : storeImage ? (
              <Image source={{ uri: storeImage }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.cameraIconContainer}>
                  <Ionicons name="camera" size={32} color="#22C55E" />
                </View>
                <Text style={styles.imagePlaceholderText}>Tap to add store image</Text>
                <Text style={styles.imagePlaceholderSubtext}>
                  This will be shown to customers
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {storeImage && (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setStoreImage(null)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          )}
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
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Store Category *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  formData.category === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setFormData({ ...formData, category: cat.id })}
              >
                <Ionicons
                  name={cat.icon}
                  size={18}
                  color={formData.category === cat.id ? "#FFF" : "#64748B"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    formData.category === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
          style={[
            styles.submitButton,
            (loading || imageLoading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || imageLoading}
        >
          <LinearGradient
            colors={
              loading || imageLoading
                ? ["#94A3B8", "#94A3B8"]
                : ["#22C55E", "#16A34A"]
            }
            style={styles.submitGradient}
          >
            {loading || imageLoading ? (
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
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

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

  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },

  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 13, color: "#166534" },

  section: { marginBottom: 20 },

  label: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 8 },

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

  textArea: { height: 100, paddingTop: 14 },

  row: { flexDirection: "row" },

  // Image Upload
  imageUpload: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  cameraIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  imagePlaceholderText: { fontSize: 15, fontWeight: "600", color: "#1E293B", marginTop: 4 },
  imagePlaceholderSubtext: { fontSize: 13, color: "#94A3B8", marginTop: 4 },

  uploadedImage: { width: "100%", height: "100%", resizeMode: "cover" },

  removeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 8,
    gap: 6,
  },
  removeImageText: { fontSize: 14, color: "#EF4444", fontWeight: "600" },

  // Category
  categoryContainer: { gap: 10, paddingVertical: 4 },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  categoryChipActive: { backgroundColor: "#22C55E", borderColor: "#22C55E" },

  categoryText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  categoryTextActive: { color: "#FFF" },

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

  submitButton: { borderRadius: 14, overflow: "hidden" },
  submitButtonDisabled: { opacity: 0.7 },

  submitGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },

  submitText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
