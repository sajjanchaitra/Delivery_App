// app/(customer)/categories.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
  Animated,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = (width - 52) / 2;
const API_URL = "http://13.203.206.134:5000";

const COLORS = {
  primary: "#DC2626",
  danger: "#EF4444",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
  border: "#E2E8F0",
};

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath}`;
};

const FIXED_CATEGORIES = [
  { id: 'all', name: 'All', storeType: null, category: null },
  { id: 'restaurant', name: 'Restaurant', storeType: 'restaurant', category: null },
  { id: 'medical', name: 'Medical', storeType: 'medical', category: null },
  { id: 'vegetables', name: 'Vegetables', storeType: 'general', category: 'vegetables' },
  { id: 'fruits', name: 'Fruits', storeType: 'general', category: 'fruits' },
  { id: 'grocery', name: 'Grocery', storeType: 'general', category: 'grocery' },
  { id: 'dairy', name: 'Dairy', storeType: 'general', category: 'dairy' },
  { id: 'meat', name: 'Meat', storeType: 'general', category: 'meat' },
  { id: 'bakery', name: 'Bakery', storeType: 'general', category: 'bakery' },
];

interface Product {
  _id: string;
  name: string;
  images?: string[];
  price: number;
  discountPrice?: number | null;
  salePrice?: number | null;
  quantity?: number | string;
  unit?: string;
  inStock?: boolean;
  category?: string;
  storeType?: string;
  store?: { 
    _id: string; 
    name: string;
  };
}

type SortOption = "newest" | "price-low" | "price-high" | "popular";

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const initialCategoryName = params.categoryName as string | undefined;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryName || "All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortModal, setShowSortModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => { 
    fetchProducts();
    fetchCartCount();
  }, []);

  useEffect(() => { 
    filterAndSortProducts(); 
  }, [selectedCategory, sortBy, allProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch(`${API_URL}/api/customer/products?limit=100`, { headers });
      const data = await response.json();
      
      if (data.success && data.products) {
        setAllProducts(data.products);
      }
    } catch (error) { 
      console.error("Error fetching products:", error); 
      Alert.alert("Error", "Failed to load products"); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const fetchCartCount = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setCartCount(0);
        return;
      }

      const response = await fetch(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success && data.cart?.items) {
        setCartCount(
          data.cart.items.reduce(
            (acc: number, item: { quantity?: number }) =>
              acc + (item.quantity || 1),
            0
          )
        );
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
      setCartCount(0);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...allProducts];

    if (selectedCategory !== "All") {
      const categoryConfig = FIXED_CATEGORIES.find(c => c.name === selectedCategory);
      
      if (categoryConfig) {
        filtered = allProducts.filter(product => {
          // For Restaurant or Medical - filter by product's storeType field
          if (categoryConfig.storeType && categoryConfig.storeType !== 'general') {
            return product.storeType === categoryConfig.storeType;
          }
          
          // For general store categories (Vegetables, Fruits, Grocery, etc.)
          // Product must be from a general store AND match the category
          if (categoryConfig.storeType === 'general' && categoryConfig.category) {
            const isGeneralStore = !product.storeType || product.storeType === 'general';
            const matchesCategory = product.category?.toLowerCase() === categoryConfig.category.toLowerCase();
            return isGeneralStore && matchesCategory;
          }
          
          return false;
        });
      }
    }

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = a.discountPrice || a.salePrice || a.price;
          const priceB = b.discountPrice || b.salePrice || b.price;
          return priceA - priceB;
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = a.discountPrice || a.salePrice || a.price;
          const priceB = b.discountPrice || b.salePrice || b.price;
          return priceB - priceA;
        });
        break;
      case "popular":
      case "newest":
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const onRefresh = () => { 
    setRefreshing(true); 
    fetchProducts(); 
  };

  const addToCart = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) { 
        Alert.alert("Login Required", "Please login to add items to cart", [
          { text: "Cancel", style: "cancel" }, 
          { text: "Login", onPress: () => router.push("/(auth)/login" as any) }
        ]); 
        return; 
      }
      const response = await fetch(`${API_URL}/api/cart/add`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ productId: product._id, quantity: 1 }) 
      });
      const data = await response.json();
      if (data.success) {
        setCartCount((prev) => prev + 1);
        Alert.alert("Success", `${product.name} added to cart!`);
      } else {
        Alert.alert("Error", data.message || "Failed to add to cart");
      }
    } catch (error) { 
      Alert.alert("Error", "Failed to add to cart"); 
    }
  };

  const getSortLabel = (sort: SortOption): string => {
    switch (sort) { 
      case "newest": return "Newest"; 
      case "price-low": return "Price: Low to High"; 
      case "price-high": return "Price: High to Low"; 
      case "popular": return "Most Popular"; 
      default: return "Newest"; 
    }
  };

  const renderProductCard = ({ item: product }: { item: Product }) => {
    const finalPrice = product.discountPrice || product.salePrice || product.price;
    const hasDiscount = (product.discountPrice && product.discountPrice < product.price) || 
                        (product.salePrice && product.salePrice < product.price);
    const discountPercent = hasDiscount ? Math.round(((product.price - finalPrice) / product.price) * 100) : 0;

    return (
      <TouchableOpacity 
        style={styles.productCard} 
        activeOpacity={0.8} 
        onPress={() => router.push({ 
          pathname: "/(customer)/product-details", 
          params: { productId: product._id } 
        } as any)}
      >
        <View style={styles.productImageContainer}>
          <Image source={{ uri: getImageUrl(product.images?.[0]) }} style={styles.productImage} />
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
          {product.inStock === false && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          {product.store?.name && (
            <Text style={styles.storeName} numberOfLines={1}>{product.store.name}</Text>
          )}
          {product.unit && (
            <Text style={styles.productUnit}>{product.quantity} {product.unit}</Text>
          )}
          <View style={styles.productFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>₹{finalPrice}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>₹{product.price}</Text>
              )}
            </View>
            {product.inStock !== false && (
              <TouchableOpacity 
                style={styles.addButton} 
                activeOpacity={0.7} 
                onPress={(e) => { e.stopPropagation(); addToCart(product); }}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedCategory === "All" ? "All Products" : selectedCategory}</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => router.push("/(customer)/cart" as any)}>
          <View style={{ position: "relative" }}>
            <Ionicons name="cart-outline" size={24} color={COLORS.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? "99+" : String(cartCount)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {FIXED_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryChip, selectedCategory === category.name && styles.categoryChipActive]}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === category.name && styles.categoryChipTextActive]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterBar}>
        <Text style={styles.resultsText}>{filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
          <Ionicons name="swap-vertical" size={18} color={COLORS.textLight} />
          <Text style={styles.sortButtonText}>{getSortLabel(sortBy)}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptyText}>
            {selectedCategory === "All" ? "No products available at the moment" : `No products in ${selectedCategory} category`}
          </Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => setSelectedCategory("All")}>
            <Text style={styles.browseButtonText}>Browse All Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        />
      )}

      {showSortModal && (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
          <View style={styles.sortModal}>
            <Text style={styles.sortModalTitle}>Sort By</Text>
            {(["newest", "price-low", "price-high", "popular"] as SortOption[]).map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.sortOption} 
                onPress={() => { setSortBy(option); setShowSortModal(false); }}
              >
                <Text style={[styles.sortOptionText, sortBy === option && styles.sortOptionTextActive]}>
                  {getSortLabel(option)}
                </Text>
                {sortBy === option && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
      
      {/* Toast Notification */}
      {showToast && (
        <Animated.View
          style={[
            styles.toast,
            toastType === "success" ? styles.toastSuccess : styles.toastError,
            { transform: [{ translateY: toastAnim }] },
          ]}
        >
          <View style={styles.toastContent}>
            <View style={styles.toastIconContainer}>
              <Ionicons
                name={toastType === "success" ? "checkmark-circle" : "alert-circle"}
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, flex: 1, textAlign: "center" },
  cartButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  categorySection: { backgroundColor: COLORS.card, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  categoriesContainer: { paddingHorizontal: 16, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.bg, marginRight: 8 },
  categoryChipActive: { backgroundColor: COLORS.primary },
  categoryChipText: { fontSize: 14, fontWeight: "600", color: COLORS.textLight },
  categoryChipTextActive: { color: "#FFFFFF", fontWeight: "700" },
  filterBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultsText: { fontSize: 14, color: COLORS.textLight, fontWeight: "600" },
  sortButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortButtonText: { fontSize: 14, color: COLORS.textLight, fontWeight: "500" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textLight },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textLight, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: "center", marginTop: 8 },
  browseButton: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  productsList: { padding: 16 },
  productRow: { justifyContent: "space-between" },
  productCard: { width: PRODUCT_CARD_WIDTH, marginBottom: 16, backgroundColor: COLORS.card, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  productImageContainer: { width: "100%", height: 140, position: "relative" },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  discountBadge: { position: "absolute", top: 8, left: 8, backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  outOfStockOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.7)", paddingVertical: 6, alignItems: "center" },
  outOfStockText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 4, minHeight: 36 },
  storeName: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  productUnit: { fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  productPrice: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  originalPrice: { fontSize: 12, color: COLORS.textLight, textDecorationLine: "line-through" },
  addButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sortModal: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  sortModalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  sortOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sortOptionText: { fontSize: 16, color: COLORS.textLight },
  sortOptionTextActive: { color: COLORS.primary, fontWeight: "600" },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  toast: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: COLORS.primary,
  },
  toastError: {
    backgroundColor: "#EF4444",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  toastIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  toastText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});