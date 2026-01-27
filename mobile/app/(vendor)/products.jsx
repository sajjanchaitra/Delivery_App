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
  RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export default function VendorProducts() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [storeType, setStoreType] = useState("general"); // general, medical, restaurant

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

  const getCategoriesByType = () => {
    switch (storeType) {
      case "medical":
        return [
          "all",
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
          "all",
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
          "all",
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

  const categories = getCategoriesByType();

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/vendor/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
      } else {
        console.log("Error fetching products:", data.error);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        (p.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const toggleProductStock = async (productId) => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      const response = await fetch(
        `${API_URL}/api/vendor/products/${productId}/stock`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setProducts(
          products.map((p) =>
            p._id === productId ? { ...p, inStock: data.inStock } : p
          )
        );
      } else {
        Alert.alert("Error", data.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error toggling stock:", error);
      Alert.alert("Error", "Failed to update product stock");
    }
  };

  const deleteProduct = async (productId) => {
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
              const token = await AsyncStorage.getItem("authToken");

              const response = await fetch(
                `${API_URL}/api/vendor/products/${productId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (data.success) {
                setProducts(products.filter((p) => p._id !== productId));
                Alert.alert("Success", "Product deleted successfully");
              } else {
                Alert.alert("Error", data.error || "Failed to delete product");
              }
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Failed to delete product");
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const getProductEmoji = (p) => {
    if (storeType === "restaurant") return "🍽️";
    if (storeType === "medical") return "💊";
    return "🛒";
  };

  const renderExtraBadges = (product) => {
  const meta = product.meta || {};

  // RESTO badges
  if (storeType === "restaurant") {
    // FIX: Check both meta.isVeg AND foodType field as fallback
    const isVeg = meta.isVeg !== undefined 
      ? meta.isVeg 
      : (product.foodType === "veg");
    
    return (
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            isVeg ? styles.badgeVeg : styles.badgeNonVeg,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isVeg ? styles.badgeTextVeg : styles.badgeTextNonVeg,
            ]}
          >
            {isVeg ? "VEG" : "NON-VEG"}
          </Text>
        </View>

        {meta.prepTime ? (
          <View style={styles.badgeGray}>
            <Text style={styles.badgeGrayText}>{meta.prepTime} min</Text>
          </View>
        ) : null}
      </View>
    );
  }

  // MEDICAL badges
  if (storeType === "medical") {
    return (
      <View style={styles.badgeRow}>
        {meta.prescriptionRequired ? (
          <View style={styles.badgeRed}>
            <Text style={styles.badgeRedText}>Rx</Text>
          </View>
        ) : (
          <View style={styles.badgeGreen}>
            <Text style={styles.badgeGreenText}>OTC</Text>
          </View>
        )}

        {meta.expiryDate ? (
          <View style={styles.badgeGray}>
            <Text style={styles.badgeGrayText}>Exp {meta.expiryDate}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return null;
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient colors={[COLORS.primary, "#B91C1C"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {storeType === "restaurant"
              ? "My Menu"
              : storeType === "medical"
              ? "My Medicines"
              : "My Products"}
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/(vendor)/add-product")}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
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
      </LinearGradient>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category === "all"
                ? "All"
                : category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "Item" : "Items"}
        </Text>
      </View>

      {/* Products List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No items found</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => router.push("/(vendor)/add-product")}
            >
              <Text style={styles.addFirstButtonText}>Add Your First Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View key={product._id} style={styles.productCard}>
              <View style={styles.productLeft}>
                <View style={styles.productImage}>
                  {product.images && product.images.length > 0 ? (
                    <Image
                      source={{ uri: product.images[0] }}
                      style={styles.productImageImg}
                    />
                  ) : (
                    <Text style={styles.productEmoji}>{getProductEmoji(product)}</Text>
                  )}
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>

                  <Text style={styles.productCategory}>
                    {product.category || "Uncategorized"}
                  </Text>

                  {/* Extra badges */}
                  {renderExtraBadges(product)}

                  <View style={styles.productMeta}>
                    <View style={styles.priceContainer}>
                      {product.discountPrice ? (
                        <>
                          <Text style={styles.productPrice}>
                            ₹{product.discountPrice}
                          </Text>
                          <Text style={styles.productOriginalPrice}>
                            ₹{product.price}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.productPrice}>₹{product.price}</Text>
                      )}
                    </View>

                    <Text style={styles.productStock}>
                      {product.inStock
                        ? `${product.stockQuantity} ${product.unit}`
                        : "Out of stock"}
                    </Text>

                    {/* Medical MRP show */}
                    {storeType === "medical" && product.meta?.mrp ? (
                      <Text style={styles.productMrp}>
                        MRP ₹{product.meta.mrp}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.productActions}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    product.inStock
                      ? styles.statusButtonActive
                      : styles.statusButtonInactive,
                  ]}
                  onPress={() => toggleProductStock(product._id)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      product.inStock
                        ? styles.statusButtonTextActive
                        : styles.statusButtonTextInactive,
                    ]}
                  >
                    {product.inStock ? "In Stock" : "Out"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      Alert.alert("Edit", "Edit feature coming soon!")
                    }
                  >
                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteProduct(product._id)}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },

  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  categoriesScroll: { maxHeight: 60 },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontSize: 14, fontWeight: "600", color: COLORS.textLight },
  categoryTextActive: { color: "#FFF" },

  countContainer: { paddingHorizontal: 20, paddingVertical: 12 },
  countText: { fontSize: 14, fontWeight: "600", color: COLORS.textLight },

  scrollView: { flex: 1, paddingHorizontal: 20 },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF" },

  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productLeft: { flexDirection: "row", flex: 1, marginRight: 12 },

  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productImageImg: { width: "100%", height: "100%" },
  productEmoji: { fontSize: 28 },

  productInfo: { marginLeft: 12, flex: 1, justifyContent: "center" },
  productName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  productCategory: { fontSize: 12, color: "#94A3B8", marginTop: 4 },

  productMeta: { marginTop: 8 },

  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  productPrice: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  productOriginalPrice: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  productStock: { fontSize: 12, color: COLORS.textLight },
  productMrp: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  productActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  statusButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusButtonActive: { backgroundColor: "#DCFCE7" },
  statusButtonInactive: { backgroundColor: COLORS.softPink },
  statusButtonText: { fontSize: 11, fontWeight: "600" },
  statusButtonTextActive: { color: "#16A34A" },
  statusButtonTextInactive: { color: COLORS.danger },

  actionButtons: { flexDirection: "row", gap: 8 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },

  // Badges
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeVeg: { backgroundColor: "#DCFCE7" },
  badgeNonVeg: { backgroundColor: COLORS.softPink },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextVeg: { color: "#16A34A" },
  badgeTextNonVeg: { color: COLORS.danger },

  badgeGray: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  badgeGrayText: { fontSize: 11, fontWeight: "600", color: "#475569" },

  badgeGreen: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
  },
  badgeGreenText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },

  badgeRed: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.softPink,
  },
  badgeRedText: { fontSize: 11, fontWeight: "700", color: COLORS.danger },
});