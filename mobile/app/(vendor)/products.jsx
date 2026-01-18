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
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { productAPI } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const categories = [
  { id: "all", label: "All" },
  { id: "vegetables", label: "Vegetables" },
  { id: "fruits", label: "Fruits" },
  { id: "dairy", label: "Dairy" },
  { id: "bakery", label: "Bakery" },
];

export default function Products() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      // Check if user is authenticated
      const token = await AsyncStorage.getItem("authToken");
      const userRole = await AsyncStorage.getItem("userRole");
      
      console.log("🔐 Auth Check:");
      console.log("  - Token exists:", !!token);
      console.log("  - Token (first 20 chars):", token?.substring(0, 20));
      console.log("  - User role:", userRole);
      
      if (!token) {
        Alert.alert(
          "Not Authenticated",
          "Please login first",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
        return;
      }

      if (userRole !== "vendor") {
        Alert.alert(
          "Access Denied",
          "This section is only for vendors",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      fetchProducts();
    } catch (error) {
      console.error("💥 Auth check error:", error);
      Alert.alert("Error", "Authentication check failed");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching products...");
      console.log("⏰ Time:", new Date().toISOString());
      
      const response = await productAPI.getMyProducts();
      
      console.log("📦 API Response:");
      console.log("  - Success:", response.success);
      console.log("  - Has data:", !!response.data);
      console.log("  - Response:", JSON.stringify(response, null, 2));
      
      if (response.success) {
        const productsList = response.data.products || [];
        console.log("✅ Products received:", productsList.length);
        
        if (productsList.length > 0) {
          console.log("📝 First product:", JSON.stringify(productsList[0], null, 2));
        }
        
        setProducts(productsList);
      } else {
        console.error("❌ API Error:", response.error);
        Alert.alert(
          "Error Loading Products", 
          response.error || "Failed to fetch products"
        );
      }
    } catch (error) {
      console.error("💥 Fetch Exception:");
      console.error("  - Name:", error.name);
      console.error("  - Message:", error.message);
      console.error("  - Stack:", error.stack);
      
      Alert.alert(
        "Connection Error", 
        `Failed to load products.\n\nError: ${error.message}\n\nPlease check your internet connection.`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    setRefreshing(true);
    fetchProducts();
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleStock = async (productId) => {
    try {
      console.log("🔄 Toggling stock for product:", productId);
      const response = await productAPI.toggleStock(productId);
      
      console.log("📦 Toggle Response:", JSON.stringify(response, null, 2));
      
      if (response.success) {
        setProducts(
          products.map((p) =>
            p._id === productId ? { ...p, inStock: !p.inStock } : p
          )
        );
        console.log("✅ Stock toggled successfully");
      } else {
        console.error("❌ Toggle failed:", response.error);
        Alert.alert("Error", response.error || "Failed to update stock");
      }
    } catch (error) {
      console.error("💥 Toggle stock error:", error);
      Alert.alert("Error", "Failed to update stock status");
    }
  };

  const deleteProduct = (productId) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🗑️ Deleting product:", productId);
              const response = await productAPI.deleteProduct(productId);
              
              console.log("📦 Delete Response:", JSON.stringify(response, null, 2));
              
              if (response.success) {
                setProducts(products.filter((p) => p._id !== productId));
                console.log("✅ Product deleted successfully");
                Alert.alert("Success", "Product deleted successfully");
              } else {
                console.error("❌ Delete failed:", response.error);
                Alert.alert("Error", response.error || "Failed to delete product");
              }
            } catch (error) {
              console.error("💥 Delete product error:", error);
              Alert.alert("Error", "Failed to delete product");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(vendor)/add-product")}
        >
          <Ionicons name="add" size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.id && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={20} 
            color={refreshing ? "#94A3B8" : "#64748B"} 
          />
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? "Try a different search term" 
                : products.length === 0 
                ? "Add your first product" 
                : "No products in this category"}
            </Text>
            {products.length === 0 && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/(vendor)/add-product")}
              >
                <Text style={styles.emptyButtonText}>Add Product</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View key={product._id} style={styles.productCard}>
              <Image 
                source={{ uri: product.image || 'https://via.placeholder.com/80' }} 
                style={styles.productImage} 
              />
              
              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={[styles.stockBadge, !product.inStock && styles.stockBadgeOut]}>
                    <Text style={[styles.stockText, !product.inStock && styles.stockTextOut]}>
                      {product.inStock ? "In Stock" : "Out"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.productQuantity}>
                  {product.quantity} {product.unit}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    ₹{product.discountPrice || product.price}
                  </Text>
                  {product.discountPrice && (
                    <Text style={styles.originalPrice}>₹{product.price}</Text>
                  )}
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.stockBtn]}
                    onPress={() => toggleStock(product._id)}
                  >
                    <Ionicons
                      name={product.inStock ? "pause" : "play"}
                      size={16}
                      color={product.inStock ? "#F59E0B" : "#22C55E"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => router.push(`/(vendor)/edit-product?id=${product._id}`)}
                  >
                    <Ionicons name="pencil" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => deleteProduct(product._id)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => router.push("/(vendor)/add-product")}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

// Styles remain the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    marginLeft: 10,
  },
  categoriesScroll: {
    marginTop: 16,
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 20,
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
  countContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: "#22C55E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  stockBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeOut: {
    backgroundColor: "#FEE2E2",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  stockTextOut: {
    color: "#DC2626",
  },
  productQuantity: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  originalPrice: {
    fontSize: 13,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  stockBtn: {
    backgroundColor: "#FEF3C7",
  },
  editBtn: {
    backgroundColor: "#DBEAFE",
  },
  deleteBtn: {
    backgroundColor: "#FEE2E2",
  },
  floatingBtn: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
