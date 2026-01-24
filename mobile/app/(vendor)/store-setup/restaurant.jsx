// app/(vendor)/store-setup/restaurant.jsx
// Restaurant Setup Screen with Excel Bulk Upload

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
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const API_URL = "http://13.203.206.134:5000";

const cuisineTypes = [
  { id: "north_indian", label: "North Indian", icon: "🍛" },
  { id: "south_indian", label: "South Indian", icon: "🥘" },
  { id: "chinese", label: "Chinese", icon: "🥡" },
  { id: "italian", label: "Italian", icon: "🍕" },
  { id: "mughlai", label: "Mughlai", icon: "🍖" },
  { id: "street_food", label: "Street Food", icon: "🌮" },
  { id: "fast_food", label: "Fast Food", icon: "🍔" },
  { id: "desserts", label: "Desserts", icon: "🍰" },
  { id: "beverages", label: "Beverages", icon: "🥤" },
  { id: "biryani", label: "Biryani", icon: "🍚" },
];

export default function RestaurantSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [storeImage, setStoreImage] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    description: "",
    phone: "",
    email: "",
    // Address
    street: "",
    city: "",
    state: "",
    pincode: "",
    // Restaurant Specific
    cuisines: [],
    foodType: "both", // veg, nonveg, both
    avgPrepTime: "30",
    seatingCapacity: "",
    // Documents
    fssaiLicense: "",
    gstNumber: "",
    // Settings
    dineIn: false,
    takeaway: true,
    homeDelivery: true,
    tableBooking: false,
  });

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCuisine = (cuisineId) => {
    setFormData((prev) => {
      const cuisines = prev.cuisines.includes(cuisineId)
        ? prev.cuisines.filter((c) => c !== cuisineId)
        : [...prev.cuisines, cuisineId];
      return { ...prev, cuisines };
    });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setStoreImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickExcelFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets?.[0];
      if (file) uploadExcelFile(file);
    } catch (error) {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const uploadExcelFile = async (file) => {
    setUploadingExcel(true);
    setUploadProgress(0);

    try {
      const token = await AsyncStorage.getItem("authToken");
      const formDataUpload = new FormData();

      formDataUpload.append("file", {
        uri: file.uri,
        type: file.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        name: file.name || "menu.xlsx",
      });
      formDataUpload.append("storeType", "restaurant");

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${API_URL}/api/vendor/products/bulk-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formDataUpload,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          "Success! 🎉",
          `${data.uploadedCount || 0} menu items uploaded!\n${data.skippedCount || 0} items skipped.`,
          [{ text: "OK", onPress: () => setShowExcelModal(false) }]
        );
      } else {
        Alert.alert("Error", data.error || "Failed to upload file");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload file");
    } finally {
      setUploadingExcel(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter restaurant name");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length !== 10) {
      Alert.alert("Error", "Please enter valid phone number");
      return;
    }
    if (formData.cuisines.length === 0) {
      Alert.alert("Error", "Please select at least one cuisine type");
      return;
    }
    if (!formData.fssaiLicense.trim()) {
      Alert.alert("Error", "FSSAI license is required for restaurants");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("authToken");

      let uploadedImageUrl = "";
      if (storeImage) {
        const imageFormData = new FormData();
        imageFormData.append("image", {
          uri: storeImage,
          type: "image/jpeg",
          name: "restaurant-image.jpg",
        });

        const imageResponse = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: imageFormData,
        });
        const imageData = await imageResponse.json();
        if (imageData.success) uploadedImageUrl = imageData.imageUrl;
      }

      const storeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || "Delicious food delivered to you",
        storeType: "restaurant",
        category: "restaurant",
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        image: uploadedImageUrl,
        logo: uploadedImageUrl,

        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },

        // Restaurant specific fields
        restaurantInfo: {
          cuisines: formData.cuisines,
          foodType: formData.foodType,
          avgPrepTime: parseInt(formData.avgPrepTime) || 30,
          seatingCapacity: parseInt(formData.seatingCapacity) || 0,
          dineIn: formData.dineIn,
          takeaway: formData.takeaway,
          tableBooking: formData.tableBooking,
        },

        documents: {
          fssaiLicense: formData.fssaiLicense.trim(),
          gstNumber: formData.gstNumber.trim(),
        },

        settings: {
          homeDelivery: formData.homeDelivery,
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

      if (data.success) {
        Alert.alert(
          "Restaurant Created! 🎉",
          "Would you like to add menu items now?",
          [
            { text: "Later", onPress: () => router.replace("/(vendor)/home") },
            { text: "Add Menu", onPress: () => setShowExcelModal(true) },
          ]
        );
      } else {
        Alert.alert("Error", data.error || "Failed to create restaurant");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      {/* Store Image */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Restaurant Photo"}</Text>
        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
          {storeImage ? (
            <Image source={{ uri: storeImage }} style={styles.uploadedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="restaurant" size={40} color="#F59E0B" />
              <Text style={styles.imagePlaceholderText}>{"Add Restaurant Photo"}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Basic Information"}</Text>

        <Text style={styles.label}>{"Restaurant Name *"}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Spice Garden"
          value={formData.name}
          onChangeText={(text) => updateForm("name", text)}
        />

        <Text style={styles.label}>{"Description"}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What makes your food special..."
          value={formData.description}
          onChangeText={(text) => updateForm("description", text)}
          multiline
          numberOfLines={3}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{"Phone *"}</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit number"
              value={formData.phone}
              onChangeText={(text) => updateForm("phone", text.replace(/\D/g, ""))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{"Avg. Prep Time"}</Text>
            <View style={styles.inputWithSuffix}>
              <TextInput
                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                placeholder="30"
                value={formData.avgPrepTime}
                onChangeText={(text) => updateForm("avgPrepTime", text.replace(/\D/g, ""))}
                keyboardType="number-pad"
              />
              <View style={styles.inputSuffix}>
                <Text style={styles.suffixText}>{"mins"}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Cuisines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Cuisine Types *"}</Text>
        <Text style={styles.sectionSubtitle}>{"Select all that apply"}</Text>
        <View style={styles.cuisineGrid}>
          {cuisineTypes.map((cuisine) => (
            <TouchableOpacity
              key={cuisine.id}
              style={[
                styles.cuisineChip,
                formData.cuisines.includes(cuisine.id) && styles.cuisineChipActive,
              ]}
              onPress={() => toggleCuisine(cuisine.id)}
            >
              <Text style={styles.cuisineEmoji}>{cuisine.icon}</Text>
              <Text
                style={[
                  styles.cuisineLabel,
                  formData.cuisines.includes(cuisine.id) && styles.cuisineLabelActive,
                ]}
              >
                {cuisine.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Food Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Food Type"}</Text>
        <View style={styles.foodTypeContainer}>
          {[
            { id: "veg", label: "Pure Veg", icon: "leaf", color: "#22C55E" },
            { id: "nonveg", label: "Non-Veg", icon: "restaurant", color: "#EF4444" },
            { id: "both", label: "Both", icon: "fast-food", color: "#F59E0B" },
          ].map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.foodTypeChip,
                formData.foodType === type.id && { borderColor: type.color, backgroundColor: `${type.color}15` },
              ]}
              onPress={() => updateForm("foodType", type.id)}
            >
              <Ionicons
                name={type.icon}
                size={20}
                color={formData.foodType === type.id ? type.color : "#64748B"}
              />
              <Text
                style={[
                  styles.foodTypeLabel,
                  formData.foodType === type.id && { color: type.color },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Restaurant Address"}</Text>

        <Text style={styles.label}>{"Street Address *"}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Shop No., Building, Street..."
          value={formData.street}
          onChangeText={(text) => updateForm("street", text)}
          multiline
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{"City *"}</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              value={formData.city}
              onChangeText={(text) => updateForm("city", text)}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{"Pincode *"}</Text>
            <TextInput
              style={styles.input}
              placeholder="6 digits"
              value={formData.pincode}
              onChangeText={(text) => updateForm("pincode", text.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* License & Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"License & Documents"}</Text>

        <View style={styles.warningBox}>
          <Ionicons name="shield-checkmark" size={20} color="#D97706" />
          <Text style={styles.warningText}>
            {"FSSAI license is mandatory for all food businesses in India."}
          </Text>
        </View>

        <Text style={styles.label}>{"FSSAI License Number *"}</Text>
        <TextInput
          style={styles.input}
          placeholder="14-digit FSSAI number"
          value={formData.fssaiLicense}
          onChangeText={(text) => updateForm("fssaiLicense", text)}
          maxLength={14}
        />

        <Text style={styles.label}>{"GST Number (Optional)"}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 22XXXXX1234X1Z5"
          value={formData.gstNumber}
          onChangeText={(text) => updateForm("gstNumber", text)}
          autoCapitalize="characters"
        />
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Services Offered"}</Text>

        {[
          { key: "homeDelivery", label: "Home Delivery", icon: "bicycle" },
          { key: "takeaway", label: "Takeaway / Pickup", icon: "bag-handle" },
          { key: "dineIn", label: "Dine In", icon: "restaurant" },
          { key: "tableBooking", label: "Table Booking", icon: "calendar" },
        ].map((service) => (
          <TouchableOpacity
            key={service.key}
            style={styles.toggleRow}
            onPress={() => updateForm(service.key, !formData[service.key])}
          >
            <View style={styles.toggleInfo}>
              <Ionicons name={service.icon} size={22} color="#64748B" />
              <Text style={styles.toggleLabel}>{service.label}</Text>
            </View>
            <View style={[styles.toggle, formData[service.key] && styles.toggleActive]}>
              <View style={[styles.toggleCircle, formData[service.key] && styles.toggleCircleActive]} />
            </View>
          </TouchableOpacity>
        ))}

        {formData.dineIn && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>{"Seating Capacity"}</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of seats"
              value={formData.seatingCapacity}
              onChangeText={(text) => updateForm("seatingCapacity", text.replace(/\D/g, ""))}
              keyboardType="number-pad"
            />
          </View>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F59E0B" />

      <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{"Restaurant Setup"}</Text>
            <Text style={styles.headerSubtitle}>{`Step ${step} of 2`}</Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${step * 50}%` }]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 ? renderStep1() : renderStep2()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.prevButton} onPress={() => setStep(step - 1)}>
            <Ionicons name="arrow-back" size={20} color="#64748B" />
            <Text style={styles.prevButtonText}>{"Back"}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, loading && styles.buttonDisabled]}
          onPress={() => (step < 2 ? setStep(step + 1) : handleSubmit())}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ["#94A3B8", "#94A3B8"] : ["#F59E0B", "#D97706"]}
            style={styles.nextButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>{step < 2 ? "Next" : "Create Restaurant"}</Text>
                <Ionicons name={step < 2 ? "arrow-forward" : "checkmark"} size={20} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Excel Upload Modal */}
      <Modal visible={showExcelModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{"Add Menu Items"}</Text>
              <TouchableOpacity onPress={() => setShowExcelModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.templateButton}>
                <Ionicons name="download-outline" size={24} color="#3B82F6" />
                <Text style={styles.templateButtonText}>{"Download Menu Template"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: "#F59E0B" }, uploadingExcel && styles.uploadButtonDisabled]}
                onPress={pickExcelFile}
                disabled={uploadingExcel}
              >
                {uploadingExcel ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.uploadButtonText}>{`Uploading... ${uploadProgress}%`}</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={24} color="#FFF" />
                    <Text style={styles.uploadButtonText}>{"Upload Menu Excel"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.templateInfo}>
              <Text style={styles.templateInfoTitle}>{"Menu Excel Format:"}</Text>
              <Text style={styles.templateInfoText}>{"• Item Name, Category"}</Text>
              <Text style={styles.templateInfoText}>{"• Price, Description"}</Text>
              <Text style={styles.templateInfoText}>{"• Veg/Non-Veg, Prep Time"}</Text>
              <Text style={styles.templateInfoText}>{"• Available (Yes/No)"}</Text>
              <Text style={styles.templateInfoText}>{"• Spice Level, Serves"}</Text>
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                setShowExcelModal(false);
                router.replace("/(vendor)/home");
              }}
            >
              <Text style={styles.skipButtonText}>{"Skip for now"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  progressContainer: { marginTop: 16 },
  progressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 },
  progressFill: { height: "100%", backgroundColor: "#FFF", borderRadius: 2 },

  content: { flex: 1, padding: 20 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: "#64748B", marginBottom: 12 },

  label: { fontSize: 13, fontWeight: "600", color: "#64748B", marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1E293B", borderWidth: 1, borderColor: "#E2E8F0" },
  textArea: { height: 80, textAlignVertical: "top" },

  row: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },

  inputWithSuffix: { flexDirection: "row" },
  inputSuffix: { backgroundColor: "#F1F5F9", borderWidth: 1, borderLeftWidth: 0, borderColor: "#E2E8F0", borderTopRightRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 12, justifyContent: "center" },
  suffixText: { fontSize: 13, color: "#64748B", fontWeight: "500" },

  imageUpload: { height: 160, borderRadius: 16, overflow: "hidden", backgroundColor: "#FFF", borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 14, color: "#64748B", marginTop: 8 },
  uploadedImage: { width: "100%", height: "100%", resizeMode: "cover" },

  cuisineGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cuisineChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", gap: 6 },
  cuisineChipActive: { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" },
  cuisineEmoji: { fontSize: 18 },
  cuisineLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  cuisineLabelActive: { color: "#D97706" },

  foodTypeContainer: { flexDirection: "row", gap: 12 },
  foodTypeChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#E2E8F0", gap: 8 },
  foodTypeLabel: { fontSize: 13, fontWeight: "600", color: "#64748B" },

  warningBox: { flexDirection: "row", backgroundColor: "#FEF3C7", borderRadius: 12, padding: 14, marginBottom: 16, gap: 10 },
  warningText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 18 },

  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleLabel: { fontSize: 15, color: "#1E293B", fontWeight: "500" },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: "#E2E8F0", justifyContent: "center", padding: 2 },
  toggleActive: { backgroundColor: "#F59E0B" },
  toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#FFF" },
  toggleCircleActive: { alignSelf: "flex-end" },

  bottomSpacer: { height: 120 },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#FFF", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: "#F1F5F9", gap: 12 },
  prevButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: "#F1F5F9", gap: 6 },
  prevButtonText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  nextButton: { flex: 1, borderRadius: 12, overflow: "hidden" },
  buttonDisabled: { opacity: 0.7 },
  nextButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  nextButtonText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1E293B" },

  uploadOptions: { gap: 16, marginBottom: 24 },
  templateButton: { backgroundColor: "#EFF6FF", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#BFDBFE" },
  templateButtonText: { fontSize: 15, fontWeight: "600", color: "#3B82F6", marginTop: 8 },

  uploadButton: { borderRadius: 16, padding: 20, alignItems: "center" },
  uploadButtonDisabled: { backgroundColor: "#94A3B8" },
  uploadButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF", marginTop: 8 },
  uploadingContainer: { flexDirection: "row", alignItems: "center", gap: 10 },

  templateInfo: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 16, marginBottom: 20 },
  templateInfoTitle: { fontSize: 13, fontWeight: "600", color: "#1E293B", marginBottom: 8 },
  templateInfoText: { fontSize: 12, color: "#64748B", marginBottom: 4 },

  skipButton: { alignItems: "center", padding: 16 },
  skipButtonText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
});