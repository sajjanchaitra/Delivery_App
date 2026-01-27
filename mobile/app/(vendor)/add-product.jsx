// app/(vendor)/add-product.jsx
// Add Product Screen - Single & Bulk Upload Options

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
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

export default function AddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // general, medical, restaurant
  const [storeType, setStoreType] = useState("general");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    discountPrice: "",
    quantity: "1",
    unit: "piece",
    stockQuantity: "100",
    images: [],

    // RESTO fields
    isVeg: true,
    prepTime: "",
    serves: "",

    // MEDICAL fields
    mrp: "",
    brand: "",
    saltName: "",
    batchNo: "",
    expiryDate: "", // YYYY-MM
    prescriptionRequired: false,
  });

  // Load store type
  useEffect(() => {
    loadStoreType();
  }, []);

  const loadStoreType = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/vendor/store`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.store) {
        setStoreType(data.store.storeType || "general");
      }
    } catch (error) {
      console.log("Error loading store type:", error);
    }
  };

  // Categories based on store type
  const getCategoriesByType = () => {
    switch (storeType) {
      case "medical":
        return [
          "Medicines",
          "Healthcare",
          "Personal Care",
          "Baby Care",
          "Ayurvedic",
          "Vitamins",
          "First Aid",
          "Medical Devices",
        ];
      case "restaurant":
        return [
          "Starters",
          "Main Course",
          "Rice & Biryani",
          "Breads",
          "Chinese",
          "Desserts",
          "Beverages",
          "Combos",
        ];
      default:
        return [
          "Vegetables",
          "Fruits",
          "Dairy",
          "Bakery",
          "Beverages",
          "Snacks",
          "Meat",
          "Seafood",
          "Grocery",
          "Household",
        ];
    }
  };

  const getUnitsByType = () => {
    switch (storeType) {
      case "medical":
        return ["strip", "tablet", "bottle", "tube", "pack", "box", "vial", "ml"];
      case "restaurant":
        return ["plate", "piece", "serving", "portion", "combo", "half", "full"];
      default:
        return ["kg", "g", "ml", "l", "piece", "dozen", "pack", "box"];
    }
  };

  const categories = getCategoriesByType();
  const units = getUnitsByType();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please grant camera roll permissions to upload images"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFormData({ ...formData, images: [result.assets[0].uri] });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (imageUri) => {
    setImageLoading(true);
    try {
      const formDataImg = new FormData();
      const filename = imageUri.split("/").pop() || `product-${Date.now()}.jpg`;
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

      if (data.success && data.imageUrl) {
        return data.imageUrl;
      }

      throw new Error(data.error || "Upload failed");
    } catch (error) {
      console.error("Image upload error:", error);
      return null;
    } finally {
      setImageLoading(false);
    }
  };

  // ==================== BULK UPLOAD ====================
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
        type:
          file.mimeType ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        name: file.name || "products.xlsx",
      });

      formDataUpload.append("storeType", storeType);

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
        Alert.alert(
          "Success! 🎉",
          `${String(data.uploadedCount || 0)} products uploaded successfully!\n${String(
            data.skippedCount || 0
          )} items skipped.`,
          [
            {
              text: "OK",
              onPress: () => {
                setShowBulkModal(false);
                router.back();
              },
            },
          ]
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
    const templateType =
      storeType === "restaurant"
        ? "restaurant"
        : storeType === "medical"
        ? "medical"
        : "grocery";

    Alert.alert("Download Template", `Download ${templateType} template for bulk upload`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Download",
        onPress: () => {
          Alert.alert(
            "Template URL",
            `${API_URL}/api/vendor/templates/${templateType}\n\nOpen this URL in your browser to download the Excel template.`
          );
        },
      },
    ]);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Please enter product name");
      return false;
    }
    if (!formData.category) {
      Alert.alert("Validation Error", "Please select a category");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid price");
      return false;
    }

    // Restaurant specific validation
    if (
      storeType === "restaurant" &&
      formData.prepTime &&
      isNaN(parseInt(formData.prepTime))
    ) {
      Alert.alert("Validation Error", "Prep time must be a number");
      return false;
    }

    // Medical validation (optional)
    if (
      storeType === "medical" &&
      formData.mrp &&
      formData.price &&
      parseFloat(formData.mrp) < parseFloat(formData.price)
    ) {
      Alert.alert(
        "Validation Error",
        "MRP should be greater than or equal to selling price"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");

      let uploadedImages = [];
      if (formData.images.length > 0) {
        const imageUrl = await uploadImage(formData.images[0]);
        if (imageUrl) uploadedImages.push(imageUrl);
      }

      const meta =
        storeType === "restaurant"
          ? {
              isVeg: !!formData.isVeg,
              prepTime: formData.prepTime ? parseInt(formData.prepTime) : null,
              serves: formData.serves ? parseInt(formData.serves) : null,
            }
          : storeType === "medical"
          ? {
              mrp: formData.mrp ? parseFloat(formData.mrp) : null,
              brand: formData.brand?.trim() || "",
              saltName: formData.saltName?.trim() || "",
              batchNo: formData.batchNo?.trim() || "",
              expiryDate: formData.expiryDate?.trim() || "",
              prescriptionRequired: !!formData.prescriptionRequired,
            }
          : {};

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice
          ? parseFloat(formData.discountPrice)
          : null,
        quantity: formData.quantity,
        unit: formData.unit,
        stock: parseInt(formData.stockQuantity),
        stockQuantity: parseInt(formData.stockQuantity),
        inStock: true,
        images: uploadedImages,
        isActive: true,

        // IMPORTANT
        storeType,
        meta,

        productType: storeType === "restaurant" ? "food" : storeType,
      };

      const response = await fetch(`${API_URL}/api/vendor/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", "Product added successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to add product");
      }
    } catch (error) {
      console.error("Add product error:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStoreTypeLabel = () => {
    switch (storeType) {
      case "medical":
        return "Medicine";
      case "restaurant":
        return "Menu Item";
      default:
        return "Product";
    }
  };

  const getTemplateInfo = () => {
    switch (storeType) {
      case "medical":
        return [
          "Medicine Name (required)",
          "Generic Name / Salt",
          "MRP, Selling Price",
          "Manufacturer, Batch No",
          "Expiry Date, Stock",
          "Prescription Required (Yes/No)",
        ];
      case "restaurant":
        return [
          "Item Name (required)",
          "Category, Price",
          "Veg/Non-Veg",
          "Prep Time, Serves",
          "Description",
          "Available (Yes/No)",
        ];
      default:
        return [
          "Product Name (required)",
          "Category, Brand",
          "MRP, Selling Price",
          "Unit, Quantity",
          "Stock, Barcode",
          "Description",
        ];
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient colors={[COLORS.primary, "#B91C1C"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{`Add ${getStoreTypeLabel()}`}</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {/* Add Type Selection */}
      <View style={styles.addTypeContainer}>
        <TouchableOpacity
          style={[styles.addTypeButton, styles.addTypeSingle]}
          onPress={() => {}}
          activeOpacity={1}
        >
          <View style={styles.addTypeIcon}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.addTypeInfo}>
            <Text style={styles.addTypeTitle}>{"Single Item"}</Text>
            <Text style={styles.addTypeSubtitle}>
              {"Add one product manually"}
            </Text>
          </View>
          <View style={styles.addTypeCheck}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addTypeButton, styles.addTypeBulk]}
          onPress={() => setShowBulkModal(true)}
        >
          <View style={[styles.addTypeIcon, { backgroundColor: COLORS.softBlue }]}>
            <Ionicons name="cloud-upload" size={24} color="#3B82F6" />
          </View>
          <View style={styles.addTypeInfo}>
            <Text style={styles.addTypeTitle}>{"Bulk Upload"}</Text>
            <Text style={styles.addTypeSubtitle}>{"Upload via Excel file"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.section}>
          <Text style={styles.label}>{`${getStoreTypeLabel()} Image (Optional)`}</Text>
          <TouchableOpacity
            style={styles.imageUpload}
            onPress={pickImage}
            disabled={imageLoading}
          >
            {imageLoading ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.imagePlaceholderText}>{"Uploading..."}</Text>
              </View>
            ) : formData.images.length > 0 ? (
              <Image
                source={{ uri: formData.images[0] }}
                style={styles.uploadedImage}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color="#94A3B8" />
                <Text style={styles.imagePlaceholderText}>
                  {"Tap to upload image"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {formData.images.length > 0 && (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setFormData({ ...formData, images: [] })}
            >
              <Text style={styles.removeImageText}>{"Remove Image"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Product Name */}
        <View style={styles.section}>
          <Text style={styles.label}>{`${getStoreTypeLabel()} Name *`}</Text>
          <TextInput
            style={styles.input}
            placeholder={
              storeType === "medical"
                ? "e.g., Paracetamol 500mg"
                : storeType === "restaurant"
                ? "e.g., Butter Chicken"
                : "e.g., Fresh Tomatoes"
            }
            placeholderTextColor="#94A3B8"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>{"Description"}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter description..."
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

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>{"Category *"}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    formData.category === category && styles.categoryChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category })}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      formData.category === category &&
                        styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Price */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>{"Price (₹) *"}</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>{"Discount Price (₹)"}</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              value={formData.discountPrice}
              onChangeText={(text) =>
                setFormData({ ...formData, discountPrice: text })
              }
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Quantity & Unit */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>{"Quantity *"}</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#94A3B8"
              value={formData.quantity}
              onChangeText={(text) =>
                setFormData({ ...formData, quantity: text })
              }
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>{"Unit *"}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.unitGrid}>
                {units.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitChip,
                      formData.unit === unit && styles.unitChipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, unit })}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        formData.unit === unit && styles.unitTextActive,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* ==================== RESTAURANT EXTRA FIELDS ==================== */}
        {storeType === "restaurant" && (
          <View style={styles.section}>
            <Text style={styles.label}>{"Food Details"}</Text>

            {/* Veg / Non-Veg */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.unitChip,
                  formData.isVeg === true && styles.unitChipActive,
                ]}
                onPress={() => setFormData({ ...formData, isVeg: true })}
              >
                <Text
                  style={[
                    styles.unitText,
                    formData.isVeg === true && styles.unitTextActive,
                  ]}
                >
                  Veg
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.unitChip,
                  formData.isVeg === false && styles.unitChipActive,
                ]}
                onPress={() => setFormData({ ...formData, isVeg: false })}
              >
                <Text
                  style={[
                    styles.unitText,
                    formData.isVeg === false && styles.unitTextActive,
                  ]}
                >
                  Non-Veg
                </Text>
              </TouchableOpacity>
            </View>

            {/* Prep Time */}
            <Text style={[styles.label, { marginTop: 12 }]}>
              {"Preparation Time (mins)"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 15"
              placeholderTextColor="#94A3B8"
              value={formData.prepTime}
              onChangeText={(text) =>
                setFormData({ ...formData, prepTime: text })
              }
              keyboardType="number-pad"
            />

            {/* Serves */}
            <Text style={[styles.label, { marginTop: 12 }]}>
              {"Serves (optional)"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1"
              placeholderTextColor="#94A3B8"
              value={formData.serves}
              onChangeText={(text) =>
                setFormData({ ...formData, serves: text })
              }
              keyboardType="number-pad"
            />
          </View>
        )}

        {/* ==================== MEDICAL EXTRA FIELDS ==================== */}
        {storeType === "medical" && (
          <View style={styles.section}>
            <Text style={styles.label}>{"Medicine Details"}</Text>

            <Text style={[styles.label, { marginTop: 12 }]}>{"MRP (₹)"}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 30"
              placeholderTextColor="#94A3B8"
              value={formData.mrp}
              onChangeText={(text) => setFormData({ ...formData, mrp: text })}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>
              {"Brand / Company"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Cipla"
              placeholderTextColor="#94A3B8"
              value={formData.brand}
              onChangeText={(text) => setFormData({ ...formData, brand: text })}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>
              {"Salt / Generic Name"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Paracetamol"
              placeholderTextColor="#94A3B8"
              value={formData.saltName}
              onChangeText={(text) =>
                setFormData({ ...formData, saltName: text })
              }
            />

            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{"Batch No (optional)"}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., B122"
                  placeholderTextColor="#94A3B8"
                  value={formData.batchNo}
                  onChangeText={(text) =>
                    setFormData({ ...formData, batchNo: text })
                  }
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{"Expiry (YYYY-MM)"}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2027-05"
                  placeholderTextColor="#94A3B8"
                  value={formData.expiryDate}
                  onChangeText={(text) =>
                    setFormData({ ...formData, expiryDate: text })
                  }
                />
              </View>
            </View>

            {/* Prescription Required */}
            <Text style={[styles.label, { marginTop: 12 }]}>
              {"Prescription Required?"}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.unitChip,
                  formData.prescriptionRequired === false &&
                    styles.unitChipActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, prescriptionRequired: false })
                }
              >
                <Text
                  style={[
                    styles.unitText,
                    formData.prescriptionRequired === false &&
                      styles.unitTextActive,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.unitChip,
                  formData.prescriptionRequired === true &&
                    styles.unitChipActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, prescriptionRequired: true })
                }
              >
                <Text
                  style={[
                    styles.unitText,
                    formData.prescriptionRequired === true &&
                      styles.unitTextActive,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stock */}
        <View style={styles.section}>
          <Text style={styles.label}>{"Stock Quantity *"}</Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            placeholderTextColor="#94A3B8"
            value={formData.stockQuantity}
            onChangeText={(text) =>
              setFormData({ ...formData, stockQuantity: text })
            }
            keyboardType="number-pad"
          />
          <Text style={styles.helperText}>
            {"Available quantity in your inventory"}
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || imageLoading}
        >
          <LinearGradient
            colors={
              loading || imageLoading
                ? ["#94A3B8", "#94A3B8"]
                : [COLORS.primary, "#B91C1C"]
            }
            style={styles.submitGradient}
          >
            {loading || imageLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={styles.submitText}>{`Add ${getStoreTypeLabel()}`}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bulk Upload Modal */}
      <Modal visible={showBulkModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{"Bulk Upload"}</Text>
              <TouchableOpacity onPress={() => setShowBulkModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {/* Store Type Badge */}
            <View style={styles.storeTypeBadge}>
              <Ionicons
                name={
                  storeType === "medical"
                    ? "medical"
                    : storeType === "restaurant"
                    ? "restaurant"
                    : "storefront"
                }
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.storeTypeBadgeText}>
                {storeType === "medical"
                  ? "Medical Store"
                  : storeType === "restaurant"
                  ? "Restaurant"
                  : "General Store"}
              </Text>
            </View>

            <View style={styles.uploadOptions}>
              {/* Download Template */}
              <TouchableOpacity
                style={styles.templateButton}
                onPress={downloadTemplate}
              >
                <Ionicons name="download-outline" size={24} color="#3B82F6" />
                <Text style={styles.templateButtonText}>
                  {"Download Excel Template"}
                </Text>
                <Text style={styles.templateSubtext}>
                  {"Use our format for bulk upload"}
                </Text>
              </TouchableOpacity>

              {/* Upload Excel */}
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  uploadingExcel && styles.uploadButtonDisabled,
                ]}
                onPress={pickExcelFile}
                disabled={uploadingExcel}
              >
                {uploadingExcel ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.uploadButtonText}>
                      {`Uploading... ${String(uploadProgress)}%`}
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${uploadProgress}%` },
                        ]}
                      />
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={24} color="#FFF" />
                    <Text style={styles.uploadButtonText}>
                      {"Upload Excel File"}
                    </Text>
                    <Text style={styles.uploadSubtext}>
                      {".xlsx, .xls, .csv supported"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Template Info */}
            <View style={styles.templateInfo}>
              <Text style={styles.templateInfoTitle}>{"Excel Format:"}</Text>
              {getTemplateInfo().map((info, index) => (
                <Text key={index} style={styles.templateInfoText}>{`• ${info}`}</Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setShowBulkModal(false)}
            >
              <Text style={styles.skipButtonText}>{"Cancel"}</Text>
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },

  // Add Type Selection
  addTypeContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  addTypeSingle: { backgroundColor: COLORS.softPink, borderColor: COLORS.primary },
  addTypeBulk: { backgroundColor: COLORS.card, borderColor: COLORS.border },
  addTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.softPink,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  addTypeInfo: { flex: 1 },
  addTypeTitle: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  addTypeSubtitle: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  addTypeCheck: { marginLeft: 4 },

  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  section: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { height: 100, paddingTop: 14 },

  imageUpload: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 14, color: "#94A3B8", marginTop: 8 },
  uploadedImage: { width: "100%", height: "100%" },
  removeImageButton: { alignSelf: "center", marginTop: 8, padding: 8 },
  removeImageText: { fontSize: 14, color: COLORS.danger, fontWeight: "600" },

  categoryGrid: { flexDirection: "row", gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontSize: 14, fontWeight: "600", color: COLORS.textLight },
  categoryTextActive: { color: "#FFF" },

  row: { flexDirection: "row" },

  unitGrid: { flexDirection: "row", gap: 6 },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  unitText: { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  unitTextActive: { color: "#FFF" },

  helperText: { fontSize: 12, color: "#94A3B8", marginTop: 6 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },

  storeTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.softPink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  storeTypeBadgeText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },

  uploadOptions: { gap: 16, marginBottom: 24 },
  templateButton: {
    backgroundColor: COLORS.softBlue,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  templateButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
    marginTop: 8,
  },
  templateSubtext: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },

  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  uploadButtonDisabled: { backgroundColor: COLORS.primary },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  uploadingContainer: { alignItems: "center", width: "100%" },

  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    marginTop: 12,
  },
  progressFill: { height: "100%", backgroundColor: "#FFF", borderRadius: 2 },

  templateInfo: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  templateInfoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  templateInfoText: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },

  skipButton: { alignItems: "center", padding: 16 },
  skipButtonText: { fontSize: 14, color: COLORS.textLight, fontWeight: "500" },
});