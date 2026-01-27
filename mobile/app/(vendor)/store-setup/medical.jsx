// app/(vendor)/store-setup/medical.jsx
// Medical Store Setup Screen with Excel Bulk Upload

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
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const API_URL = "http://13.203.206.134:5000";

const COLORS = {
  primary: "#DC2626",
  secondary: "#F87171",
  danger: "#DC2626",
  success: "#22C55E",
  
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
  border: "#E2E8F0",
  
  softBlue: "#EFF6FF",
  softPink: "#FEE2E2",
};

export default function MedicalStoreSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Store Info, 2: Documents, 3: Products
  const [loading, setLoading] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [storeImage, setStoreImage] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedProducts, setUploadedProducts] = useState([]);

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
    // Medical Specific
    drugLicenseNumber: "",
    drugLicenseExpiry: "",
    gstNumber: "",
    pharmacistName: "",
    pharmacistLicense: "",
    // Settings
    acceptsPrescription: true,
    homeDelivery: true,
    is24Hours: false,
  });

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
      if (file) {
        uploadExcelFile(file);
      }
    } catch (error) {
      console.error("Error picking file:", error);
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
      formDataUpload.append("storeType", "medical");

      // Simulate progress
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
        setUploadedProducts(data.products || []);
        Alert.alert(
          "Success! 🎉",
          `${data.uploadedCount || 0} medicines uploaded successfully!\n${data.skippedCount || 0} items skipped.`,
          [{ text: "OK", onPress: () => setShowExcelModal(false) }]
        );
      } else {
        Alert.alert("Error", data.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload file. Please try again.");
    } finally {
      setUploadingExcel(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    Alert.alert(
      "Download Template",
      "Template will be downloaded. Use this format to add your medicines.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          onPress: () => {
            // In production, this would open a URL to download the template
            Alert.alert("Info", "Template download link: " + API_URL + "/api/vendor/templates/medical");
          },
        },
      ]
    );
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
    if (!formData.drugLicenseNumber.trim()) {
      Alert.alert("Error", "Drug license number is required for medical stores");
      return;
    }
    if (!formData.street.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      Alert.alert("Error", "Please fill complete address");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("authToken");

      // Upload image if selected
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
          headers: { Accept: "application/json" },
          body: imageFormData,
        });
        const imageData = await imageResponse.json();
        if (imageData.success) uploadedImageUrl = imageData.imageUrl;
      }

      const storeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || "Your trusted pharmacy",
        storeType: "medical",
        category: "pharmacy",
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

        // Medical specific fields
        medicalInfo: {
          drugLicenseNumber: formData.drugLicenseNumber.trim(),
          drugLicenseExpiry: formData.drugLicenseExpiry.trim(),
          pharmacistName: formData.pharmacistName.trim(),
          pharmacistLicense: formData.pharmacistLicense.trim(),
          acceptsPrescription: formData.acceptsPrescription,
          is24Hours: formData.is24Hours,
        },

        documents: {
          gstNumber: formData.gstNumber.trim(),
          drugLicense: formData.drugLicenseNumber.trim(),
        },

        settings: {
          homeDelivery: formData.homeDelivery,
          prescriptionRequired: true,
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
          "Your medical store has been created. Would you like to add products now?",
          [
            { text: "Later", onPress: () => router.replace("/(vendor)/home") },
            { text: "Add Products", onPress: () => setShowExcelModal(true) },
          ]
        );
      } else {
        Alert.alert("Error", data.error || "Failed to create store");
      }
    } catch (error) {
      console.error("Error:", error);
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
              <Ionicons name="medical" size={40} color={COLORS.primary} />
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
          placeholder="e.g., LifeCare Pharmacy"
          value={formData.name}
          onChangeText={(text) => updateForm("name", text)}
        />

        <Text style={styles.label}>{"Description"}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your pharmacy..."
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
      {/* License Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"License & Documents"}</Text>

        <View style={styles.warningBox}>
          <Ionicons name="shield-checkmark" size={20} color="#D97706" />
          <Text style={styles.warningText}>
            {"Drug license is mandatory for medical stores as per government regulations."}
          </Text>
        </View>

        <Text style={styles.label}>{"Drug License Number *"}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., DL-XXX-XXXX-XX"
          value={formData.drugLicenseNumber}
          onChangeText={(text) => updateForm("drugLicenseNumber", text)}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>{"Drug License Expiry"}</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          value={formData.drugLicenseExpiry}
          onChangeText={(text) => updateForm("drugLicenseExpiry", text)}
        />

        <Text style={styles.label}>{"GST Number"}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 22XXXXX1234X1Z5"
          value={formData.gstNumber}
          onChangeText={(text) => updateForm("gstNumber", text)}
          autoCapitalize="characters"
        />
      </View>

      {/* Pharmacist Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Pharmacist Details"}</Text>

        <Text style={styles.label}>{"Pharmacist Name"}</Text>
        <TextInput
          style={styles.input}
          placeholder="Full name of registered pharmacist"
          value={formData.pharmacistName}
          onChangeText={(text) => updateForm("pharmacistName", text)}
        />

        <Text style={styles.label}>{"Pharmacist License Number"}</Text>
        <TextInput
          style={styles.input}
          placeholder="Registration number"
          value={formData.pharmacistLicense}
          onChangeText={(text) => updateForm("pharmacistLicense", text)}
        />
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Store Settings"}</Text>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => updateForm("acceptsPrescription", !formData.acceptsPrescription)}
        >
          <View style={styles.toggleInfo}>
            <Ionicons name="document-text" size={22} color={COLORS.textLight} />
            <Text style={styles.toggleLabel}>{"Accept Prescriptions"}</Text>
          </View>
          <View style={[styles.toggle, formData.acceptsPrescription && styles.toggleActive]}>
            <View style={[styles.toggleCircle, formData.acceptsPrescription && styles.toggleCircleActive]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => updateForm("homeDelivery", !formData.homeDelivery)}
        >
          <View style={styles.toggleInfo}>
            <Ionicons name="bicycle" size={22} color={COLORS.textLight} />
            <Text style={styles.toggleLabel}>{"Home Delivery"}</Text>
          </View>
          <View style={[styles.toggle, formData.homeDelivery && styles.toggleActive]}>
            <View style={[styles.toggleCircle, formData.homeDelivery && styles.toggleCircleActive]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => updateForm("is24Hours", !formData.is24Hours)}
        >
          <View style={styles.toggleInfo}>
            <Ionicons name="time" size={22} color={COLORS.textLight} />
            <Text style={styles.toggleLabel}>{"24 Hours Open"}</Text>
          </View>
          <View style={[styles.toggle, formData.is24Hours && styles.toggleActive]}>
            <View style={[styles.toggleCircle, formData.is24Hours && styles.toggleCircleActive]} />
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient colors={[COLORS.primary, "#B91C1C"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{"Medical Store"}</Text>
            <Text style={styles.headerSubtitle}>{`Step ${step} of 2`}</Text>
          </View>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
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

      {/* Footer */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.prevButton} onPress={() => setStep(step - 1)}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textLight} />
            <Text style={styles.prevButtonText}>{"Back"}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, loading && styles.buttonDisabled]}
          onPress={() => (step < 2 ? setStep(step + 1) : handleSubmit())}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ["#94A3B8", "#94A3B8"] : [COLORS.primary, "#B91C1C"]}
            style={styles.nextButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step < 2 ? "Next" : "Create Store"}
                </Text>
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
              <Text style={styles.modalTitle}>{"Add Medicines"}</Text>
              <TouchableOpacity onPress={() => setShowExcelModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.uploadOptions}>
              {/* Download Template */}
              <TouchableOpacity style={styles.templateButton} onPress={downloadTemplate}>
                <Ionicons name="download-outline" size={24} color="#3B82F6" />
                <Text style={styles.templateButtonText}>{"Download Excel Template"}</Text>
                <Text style={styles.templateSubtext}>{"Use our format for bulk upload"}</Text>
              </TouchableOpacity>

              {/* Upload Excel */}
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
                    <Text style={styles.uploadButtonText}>{"Upload Excel File"}</Text>
                    <Text style={styles.uploadSubtext}>{".xlsx, .xls, .csv supported"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Template Info */}
            <View style={styles.templateInfo}>
              <Text style={styles.templateInfoTitle}>{"Excel Format:"}</Text>
              <Text style={styles.templateInfoText}>{"• Medicine Name (required)"}</Text>
              <Text style={styles.templateInfoText}>{"• Generic Name"}</Text>
              <Text style={styles.templateInfoText}>{"• MRP, Selling Price"}</Text>
              <Text style={styles.templateInfoText}>{"• Manufacturer, Batch No"}</Text>
              <Text style={styles.templateInfoText}>{"• Expiry Date, Stock Qty"}</Text>
              <Text style={styles.templateInfoText}>{"• Prescription Required (Yes/No)"}</Text>
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
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  helpButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  progressContainer: { marginTop: 16 },
  progressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 },
  progressFill: { height: "100%", backgroundColor: "#FFF", borderRadius: 2 },

  content: { flex: 1, padding: 20 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 16 },

  label: { fontSize: 13, fontWeight: "600", color: COLORS.textLight, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  textArea: { height: 80, textAlignVertical: "top" },

  row: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },

  imageUpload: { height: 160, borderRadius: 16, overflow: "hidden", backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.border, borderStyle: "dashed" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 14, color: COLORS.textLight, marginTop: 8 },
  uploadedImage: { width: "100%", height: "100%", resizeMode: "cover" },

  warningBox: { flexDirection: "row", backgroundColor: "#FEF3C7", borderRadius: 12, padding: 14, marginBottom: 16, gap: 10 },
  warningText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 18 },

  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleLabel: { fontSize: 15, color: COLORS.text, fontWeight: "500" },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.border, justifyContent: "center", padding: 2 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.card },
  toggleCircleActive: { alignSelf: "flex-end" },

  bottomSpacer: { height: 120 },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: COLORS.card, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: "#F1F5F9", gap: 12 },
  prevButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: "#F1F5F9", gap: 6 },
  prevButtonText: { fontSize: 15, fontWeight: "600", color: COLORS.textLight },
  nextButton: { flex: 1, borderRadius: 12, overflow: "hidden" },
  buttonDisabled: { opacity: 0.7 },
  nextButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  nextButtonText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },

  uploadOptions: { gap: 16, marginBottom: 24 },
  templateButton: { backgroundColor: COLORS.softBlue, borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#BFDBFE" },
  templateButtonText: { fontSize: 15, fontWeight: "600", color: "#3B82F6", marginTop: 8 },
  templateSubtext: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },

  uploadButton: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, alignItems: "center" },
  uploadButtonDisabled: { backgroundColor: "#94A3B8" },
  uploadButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF", marginTop: 8 },
  uploadSubtext: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  uploadingContainer: { flexDirection: "row", alignItems: "center", gap: 10 },

  templateInfo: { backgroundColor: COLORS.bg, borderRadius: 12, padding: 16, marginBottom: 20 },
  templateInfoTitle: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  templateInfoText: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },

  skipButton: { alignItems: "center", padding: 16 },
  skipButtonText: { fontSize: 14, color: COLORS.textLight, fontWeight: "500" },
});