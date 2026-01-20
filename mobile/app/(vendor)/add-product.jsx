// app/(vendor)/add-product.tsx
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
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const API_URL = "http://13.203.206.134:5000"; // Update with your backend URL

export default function AddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

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
  });

  const categories = [
    "Vegetables",
    "Fruits",
    "Dairy",
    "Bakery",
    "Beverages",
    "Snacks",
    "Meat",
    "Seafood",
  ];

  const units = ["kg", "g", "ml", "l", "piece", "dozen", "pack", "box"];

  const pickImage = async () => {
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

    if (!result.canceled) {
      setFormData({ ...formData, images: [result.assets[0].uri] });
    }
  };

  const uploadImage = async (imageUri) => {
    setImageLoading(true);
    try {
      console.log('📤 Starting upload for:', imageUri);
      
      const formDataImg = new FormData();
      
      // Handle iOS and Android differently
      let uri = imageUri;
      if (Platform.OS === 'ios') {
        // Remove file:// prefix for iOS if present
        uri = imageUri.replace('file://', '');
      }
      
      // Get filename and file type
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formDataImg.append("image", {
        uri: uri,
        type: type,
        name: filename || `product-${Date.now()}.jpg`,
      });

      console.log('📤 Uploading to:', `${API_URL}/api/upload`);
      
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formDataImg,
        headers: {
          'Accept': 'application/json',
          // Don't set Content-Type for FormData - let it be set automatically
        },
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Upload response:', data);
      
      if (data.success) {
        return data.imageUrl;
      }
      
      throw new Error(data.error || 'Upload failed');
      
    } catch (error) {
      console.error("❌ Image upload error:", error);
      
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          'Cannot connect to server. Please check your internet connection.'
        );
      } else {
        Alert.alert('Upload Error', error.message);
      }
      
      return null;
    } finally {
      setImageLoading(false);
    }
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
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      Alert.alert("Validation Error", "Please enter quantity");
      return false;
    }
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      Alert.alert("Validation Error", "Please enter stock quantity");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");

      // Upload image if exists
      let uploadedImages = [];
      if (formData.images.length > 0) {
        console.log('🖼️ Uploading image...');
        const imageUrl = await uploadImage(formData.images[0]);
        if (imageUrl) {
          uploadedImages.push(imageUrl);
          console.log('✅ Image uploaded:', imageUrl);
        } else {
          Alert.alert(
            'Image Upload Failed',
            'Do you want to continue without an image?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setLoading(false),
              },
              {
                text: 'Continue',
                onPress: () => submitProduct(token, uploadedImages),
              },
            ]
          );
          return;
        }
      }

      await submitProduct(token, uploadedImages);
    } catch (error) {
      console.error("❌ Add product error:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
      setLoading(false);
    }
  };

  const submitProduct = async (token, uploadedImages) => {
    try {
      // Prepare product data matching your backend model
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
        stockQuantity: parseInt(formData.stockQuantity),
        inStock: true,
        images: uploadedImages,
        isActive: true,
      };

      console.log('📦 Submitting product:', productData);

      // Use vendor route - POST /api/vendor/products
      const response = await fetch(`${API_URL}/api/vendor/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();
      console.log('📥 Product response:', data);

      if (data.success) {
        Alert.alert("Success", "Product added successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to add product");
      }
    } catch (error) {
      console.error("❌ Submit product error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Add Product</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>Product Image</Text>
          <TouchableOpacity 
            style={styles.imageUpload} 
            onPress={pickImage}
            disabled={imageLoading}
          >
            {imageLoading ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.imagePlaceholderText}>Uploading...</Text>
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
                  Tap to upload image
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Rest of your form fields remain the same */}
        {/* Product Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Fresh Tomatoes"
            placeholderTextColor="#94A3B8"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter product description..."
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
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    formData.category === category &&
                      styles.categoryChipActive,
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

        {/* Price & Discount Price */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price (₹) *</Text>
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
            <Text style={styles.label}>Discount Price (₹)</Text>
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
            <Text style={styles.label}>Quantity *</Text>
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
            <Text style={styles.label}>Unit *</Text>
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

        {/* Stock Quantity */}
        <View style={styles.section}>
          <Text style={styles.label}>Stock Quantity *</Text>
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
            Available quantity in your inventory
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Submit Button */}
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
                : ["#22C55E", "#16A34A"]
            }
            style={styles.submitGradient}
          >
            {loading || imageLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={styles.submitText}>Add Product</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  // ... (keep all your existing styles)
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
  imageUpload: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  categoryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  categoryTextActive: {
    color: "#FFF",
  },
  row: {
    flexDirection: "row",
  },
  unitGrid: {
    flexDirection: "row",
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  unitChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  unitText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  unitTextActive: {
    color: "#FFF",
  },
  helperText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 6,
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