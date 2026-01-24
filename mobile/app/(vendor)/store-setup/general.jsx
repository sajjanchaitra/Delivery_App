// app/(vendor)/store-setup/general.jsx
// General Store Setup (Grocery, Vegetables, Daily Essentials) with Excel Bulk Upload

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

const storeCategories = [
  { id: "grocery", label: "Grocery", icon: "cart", color: "#22C55E" },
  { id: "vegetables", label: "Vegetables", icon: "leaf", color: "#84CC16" },
  { id: "fruits", label: "Fruits", icon: "nutrition", color: "#F59E0B" },
  { id: "dairy", label: "Dairy & Milk", icon: "water", color: "#3B82F6" },
  { id: "bakery", label: "Bakery", icon: "cafe", color: "#A855F7" },
  { id: "meat", label: "Meat & Fish", icon: "fish", color: "#EF4444" },
  { id: "snacks", label: "Snacks", icon: "pizza", color: "#EC4899" },
  { id: "beverages", label: "Beverages", icon: "beer", color: "#06B6D4" },
  { id: "personal_care", label: "Personal Care", icon: "body", color: "#8B5CF6" },
  { id: "household", label: "Household", icon: "home", color: "#64748B" },
];

export default function GeneralStoreSetup() {
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
    // Store Categories
    categories: [],
    // Documents
    gstNumber: "",
    fssaiLicense: "",
    shopLicense: "",
    // Delivery Settings
    deliveryRadius: "5",
    minOrder: "100",
    deliveryFee: "30",
    freeDeliveryAbove: "500",
    // Settings
    homeDelivery: true,
    selfPickup: true,
    codEnabled: true,
    onlinePayment: true,
  });

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (categoryId) => {
    setFormData((prev) => {
      const categories = prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories };
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
        name: file.name || "products.xlsx",
      });
      formDataUpload.append("storeType", "general");

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
          `${data.uploadedCount || 0} products uploaded!\n${data.skippedCount || 0} items skipped.`,
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

  const downloadTemplate = async () => {
    Alert.alert(
      "Download Template",
      "Choose a template based on your store type:",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Grocery Template", onPress: () => Alert.alert("Info", "Download: " + API_URL + "/api/vendor/templates/grocery") },
        { text: "Vegetables Template", onPress: () => Alert.alert("Info", "Download: " + API_URL + "/api/vendor/templates/vegetables") },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter store name");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length !== 10) {
      Alert.alert("Error", "Please enter valid phone number");
      return;
    }
    if (formData.categories.length === 0) {
      Alert.alert("Error", "Please select at least one category");
      return;
    }
    if (!formData.street.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      Alert.alert("Error", "Please fill complete address");
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
          name: "store-image.jpg",
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
        description: formData.description.trim() || "Your neighborhood store for daily needs",
        storeType: "general",
        category: formData.categories[0] || "grocery",
        categories: formData.categories,
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

        deliverySettings: {
          deliveryRadius: parseInt(formData.deliveryRadius) || 5,
          minimumOrder: parseInt(formData.minOrder) || 100,
          deliveryFee: parseInt(formData.deliveryFee) || 30,
          freeDeliveryAbove: parseInt(formData.freeDeliveryAbove) || 500,
          estimatedDeliveryTime: "30-45 mins",
        },

        documents: {
          gstNumber: formData.gstNumber.trim(),
          fssaiLicense: formData.fssaiLicense.trim(),
          shopLicense: formData.shopLicense.trim(),
        },

        paymentSettings: {
          codEnabled: formData.codEnabled,
          onlinePayment: formData.onlinePayment,
        },

        settings: {
          homeDelivery: formData.homeDelivery,
          selfPickup: formData.selfPickup,
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
          "Store Created! 🎉",
          "Would you like to add products now?",
          [
            { text: "Later", onPress: () => router.replace("/(vendor)/home") },
            { text: "Add Products", onPress: () => setShowExcelModal(true) },
          ]
        );
      } else {
        Alert.alert("Error", data.error || "Failed to create store");
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
        <Text style={styles.sectionTitle}>{"Store Image"}</Text>
        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
          {storeImage ? (
            <Image source={{ uri: storeImage }} style={styles.uploadedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="storefront" size={40} color="#22C55E" />
              <Text style={styles.imagePlaceholderText}>{"Add Store Photo"}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Basic Information"}</Text>

        <Text style={styles.label}>{"Store Name *"}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Fresh Mart, Sharma Kirana"
          value={formData.name}
          onChangeText={(text) => updateForm("name", text)}
        />

        <Text style={styles.label}>{"Description"}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell customers about your store..."
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
              placeholder="10-digit"
              value={formData.phone}
              onChangeText={(text) => updateForm("phone", text.replace(/\D/g, ""))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{"Email"}</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              value={formData.email}
              onChangeText={(text) => updateForm("email", text)}
              keyboardType="email-address"
            />
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Store Categories *"}</Text>
        <Text style={styles.sectionSubtitle}>{"Select all products you sell"}</Text>
        <View style={styles.categoryGrid}>
          {storeCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                formData.categories.includes(cat.id) && { borderColor: cat.color, backgroundColor: `${cat.color}15` },
              ]}
              onPress={() => toggleCategory(cat.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}20` }]}>
                <Ionicons name={cat.icon} size={20} color={cat.color} />
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  formData.categories.includes(cat.id) && { color: cat.color, fontWeight: "600" },
                ]}
              >
                {cat.label}
              </Text>
              {formData.categories.includes(cat.id) && (
                <Ionicons name="checkmark-circle" size={18} color={cat.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Store Address"}</Text>

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
            <Text style={styles.label}>{"State"}</Text>
            <TextInput
              style={styles.input}
              placeholder="State"
              value={formData.state}
              onChangeText={(text) => updateForm("state", text)}
            />
          </View>
        </View>

        <Text style={styles.label}>{"Pincode *"}</Text>
        <TextInput
          style={styles.input}
          placeholder="6-digit pincode"
          value={formData.pincode}
          onChangeText={(text) => updateForm("pincode", text.replace(/\D/g, ""))}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Delivery Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Delivery Settings"}</Text>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{"Delivery Radius"}</Text>
            <View style={styles.inputWithSuffix}>
              <TextInput
                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                placeholder="5"
                value={formData.deliveryRadius}
                onChangeText={(text) => updateForm("deliveryRadius", text.replace(/\D/g, ""))}
                keyboardType="number-pad"
              />
              <View style={styles.inputSuffix}>
                <Text style={styles.suffixText}>{"km"}</Text>
              </View>
            </View>
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{"Min. Order Value"}</Text>
            <View style={styles.inputWithSuffix}>
              <View style={styles.inputPrefix}>
                <Text style={styles.suffixText}>{"₹"}</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1, borderRadius: 0 }]}
                placeholder="100"
                value={formData.minOrder}
                onChangeText={(text) => updateForm("minOrder", text.replace(/\D/g, ""))}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{"Delivery Fee"}</Text>
            <View style={styles.inputWithSuffix}>
              <View style={styles.inputPrefix}>
                <Text style={styles.suffixText}>{"₹"}</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1, borderRadius: 0 }]}
                placeholder="30"
                value={formData.deliveryFee}
                onChangeText={(text) => updateForm("deliveryFee", text.replace(/\D/g, ""))}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{"Free Delivery Above"}</Text>
            <View style={styles.inputWithSuffix}>
              <View style={styles.inputPrefix}>
                <Text style={styles.suffixText}>{"₹"}</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1, borderRadius: 0 }]}
                placeholder="500"
                value={formData.freeDeliveryAbove}
                onChangeText={(text) => updateForm("freeDeliveryAbove", text.replace(/\D/g, ""))}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Documents (Optional)"}</Text>

        <Text style={styles.label}>{"GST Number"}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 22XXXXX1234X1Z5"
          value={formData.gstNumber}
          onChangeText={(text) => updateForm("gstNumber", text)}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>{"FSSAI License (For Food Items)"}</Text>
        <TextInput
          style={styles.input}
          placeholder="14-digit FSSAI number"
          value={formData.fssaiLicense}
          onChangeText={(text) => updateForm("fssaiLicense", text)}
        />

        <Text style={styles.label}>{"Shop License Number"}</Text>
        <TextInput
          style={styles.input}
          placeholder="Shop & Establishment License"
          value={formData.shopLicense}
          onChangeText={(text) => updateForm("shopLicense", text)}
        />
      </View>

      {/* Services & Payment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Services & Payment"}</Text>

        {[
          { key: "homeDelivery", label: "Home Delivery", icon: "bicycle" },
          { key: "selfPickup", label: "Self Pickup", icon: "bag-handle" },
          { key: "codEnabled", label: "Cash on Delivery", icon: "cash" },
          { key: "onlinePayment", label: "Online Payment", icon: "card" },
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
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{"General Store"}</Text>
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
            colors={loading ? ["#94A3B8", "#94A3B8"] : ["#22C55E", "#16A34A"]}
            style={styles.nextButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>{step < 2 ? "Next" : "Create Store"}</Text>
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
              <Text style={styles.modalTitle}>{"Add Products"}</Text>
              <TouchableOpacity onPress={() => setShowExcelModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.templateButton} onPress={downloadTemplate}>
                <Ionicons name="download-outline" size={24} color="#3B82F6" />
                <Text style={styles.templateButtonText}>{"Download Excel Template"}</Text>
                <Text style={styles.templateSubtext}>{"Choose based on your products"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, uploadingExcel && styles.uploadButtonDisabled]}
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
                    <Text style={styles.uploadButtonText}>{"Upload Products Excel"}</Text>
                    <Text style={styles.uploadSubtext}>{".xlsx, .xls, .csv supported"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.templateInfo}>
              <Text style={styles.templateInfoTitle}>{"Product Excel Format:"}</Text>
              <Text style={styles.templateInfoText}>{"• Product Name (required)"}</Text>
              <Text style={styles.templateInfoText}>{"• Category, Brand"}</Text>
              <Text style={styles.templateInfoText}>{"• MRP, Selling Price"}</Text>
              <Text style={styles.templateInfoText}>{"• Unit (kg, g, L, ml, pcs)"}</Text>
              <Text style={styles.templateInfoText}>{"• Quantity, Stock"}</Text>
              <Text style={styles.templateInfoText}>{"• Description, Image URL"}</Text>
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
  inputPrefix: { backgroundColor: "#F1F5F9", borderWidth: 1, borderRightWidth: 0, borderColor: "#E2E8F0", borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 12, justifyContent: "center" },
  inputSuffix: { backgroundColor: "#F1F5F9", borderWidth: 1, borderLeftWidth: 0, borderColor: "#E2E8F0", borderTopRightRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 12, justifyContent: "center" },
  suffixText: { fontSize: 13, color: "#64748B", fontWeight: "500" },

  imageUpload: { height: 160, borderRadius: 16, overflow: "hidden", backgroundColor: "#FFF", borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 14, color: "#64748B", marginTop: 8 },
  uploadedImage: { width: "100%", height: "100%", resizeMode: "cover" },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#E2E8F0", gap: 8, minWidth: "45%" },
  categoryIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  categoryLabel: { flex: 1, fontSize: 13, color: "#64748B" },

  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleLabel: { fontSize: 15, color: "#1E293B", fontWeight: "500" },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: "#E2E8F0", justifyContent: "center", padding: 2 },
  toggleActive: { backgroundColor: "#22C55E" },
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
  templateSubtext: { fontSize: 12, color: "#64748B", marginTop: 4 },

  uploadButton: { backgroundColor: "#22C55E", borderRadius: 16, padding: 20, alignItems: "center" },
  uploadButtonDisabled: { backgroundColor: "#94A3B8" },
  uploadButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF", marginTop: 8 },
  uploadSubtext: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  uploadingContainer: { flexDirection: "row", alignItems: "center", gap: 10 },

  templateInfo: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 16, marginBottom: 20 },
  templateInfoTitle: { fontSize: 13, fontWeight: "600", color: "#1E293B", marginBottom: 8 },
  templateInfoText: { fontSize: 12, color: "#64748B", marginBottom: 4 },

  skipButton: { alignItems: "center", padding: 16 },
  skipButtonText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
});