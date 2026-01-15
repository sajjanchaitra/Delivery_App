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
import { productAPI } from "../../services/api";

const categories = [
  { id: "vegetables", label: "Vegetables" },
  { id: "fruits", label: "Fruits" },
  { id: "dairy", label: "Dairy" },
  { id: "grocery", label: "Grocery" },
  { id: "bakery", label: "Bakery" },
  { id: "beverages", label: "Beverages" },
  { id: "snacks", label: "Snacks" },
  { id: "other", label: "Other" },
];

const units = ["kg", "g", "L", "ml", "pcs", "dozen", "pack"];

export default function AddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    discountPrice: "",
    quantity: "1",
    unit: "kg",
    inStock: true,
  });

  const pickImage = async () => {
    if (images.length >= 4) {
      Alert.alert("Limit Reached", "You can only add up to 4 images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateProduct = (key, value) => {
    setProduct({ ...product, [key]: value });
  };

  const handleSave = async () => {
    // Validation
    if (!product.name.trim()) {
      Alert.alert("Error", "Please enter product name");
      return;
    }
    if (!product.category) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (!product.price) {
      Alert.alert("Error", "Please enter price");
      return;
    }

    setLoading(true);

    try {
      // Prepare product data
      const productData = {
        name: product.name.trim(),
        description: product.description.trim(),
        category: product.category,
        price: parseFloat(product.price),
        discountPrice: product.discountPrice ? parseFloat(product.discountPrice) : null,
        quantity: product.quantity,
        unit: product.unit,
        inStock: product.inStock,
        images: images, // In production, upload to cloud storage first
      };

      console.log("📦 Creating product:", productData);

      const response = await productAPI.createProduct(productData);

      if (response.success) {
        Alert.alert("Success! ✅", "Product added successfully!", [
          { text: "Add Another", onPress: resetForm },
          { text: "View Products", onPress: () => router.push("/(vendor)/products") },
        ]);
      } else {
        Alert.alert("Error", response.error || "Failed to add product");
      }
    } catch (error) {
      console.error("Add product error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProduct({
      name: "",
      description: "",
      category: "",
      price: "",
      discountPrice: "",
      quantity: "1",
      unit: "kg",
      inStock: true,
    });
    setImages([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <Text style={styles.sectionSubtitle}>Add up to 4 images</Text>

          <View style={styles.imagesContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.productImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 4 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Ionicons name="camera" size={28} color="#94A3B8" />
                <Text style={styles.addImageText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              placeholderTextColor="#94A3B8"
              value={product.name}
              onChangeText={(text) => updateProduct("name", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter product description"
              placeholderTextColor="#94A3B8"
              value={product.description}
              onChangeText={(text) => updateProduct("description", text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      product.category === cat.id && styles.categoryChipActive,
                    ]}
                    onPress={() => updateProduct("category", cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        product.category === cat.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                value={product.price}
                onChangeText={(text) => updateProduct("price", text)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Discount Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                value={product.discountPrice}
                onChangeText={(text) => updateProduct("discountPrice", text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#94A3B8"
                value={product.quantity}
                onChangeText={(text) => updateProduct("quantity", text)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.unitContainer}>
                  {units.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitChip,
                        product.unit === unit && styles.unitChipActive,
                      ]}
                      onPress={() => updateProduct("unit", unit)}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          product.unit === unit && styles.unitChipTextActive,
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
        </View>

        {/* Stock Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <TouchableOpacity
            style={styles.stockToggle}
            onPress={() => updateProduct("inStock", !product.inStock)}
          >
            <View>
              <Text style={styles.stockLabel}>In Stock</Text>
              <Text style={styles.stockSubtitle}>
                {product.inStock ? "Product is available" : "Product is out of stock"}
              </Text>
            </View>
            <View style={[styles.toggle, product.inStock && styles.toggleActive]}>
              <View style={[styles.toggleKnob, product.inStock && styles.toggleKnobActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.saveButtonText}>Save Product</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  removeImageBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
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
    height: 100,
    paddingTop: 14,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  categoryChipTextActive: {
    color: "#FFF",
  },
  row: {
    flexDirection: "row",
  },
  unitContainer: {
    flexDirection: "row",
    gap: 8,
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  unitChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  unitChipTextActive: {
    color: "#FFF",
  },
  stockToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stockLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  stockSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    padding: 2,
  },
  toggleActive: {
    backgroundColor: "#22C55E",
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
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
  saveButtonDisabled: {
    backgroundColor: "#86EFAC",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});