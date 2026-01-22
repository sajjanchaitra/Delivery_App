// app/(customer)/store-details.tsx
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
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = (width - 52) / 2;
const API_URL = "http://13.203.206.134:5000";

interface StoreAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
}

interface Store {
  _id: string;
  name: string;
  image?: string;
  logo?: string;
  address?: string | StoreAddress | null;
  phone?: string;
  description?: string;
  isOpen?: boolean;
  rating?: {
    average?: number;
    count?: number;
  };
  totalProducts?: number;
  inStockProducts?: number;
  deliveryTime?: string;
  minOrder?: number;
  deliveryFee?: number;
}

interface Product {
  _id: string;
  name: string;
  images?: string[];
  price: number;
  discountPrice?: number;
  salePrice?: number;
  quantity?: number;
  unit?: string;
  inStock?: boolean;
  category?: string;
}

type SortOption = "newest" | "price-low" | "price-high" | "popular";

// Helper function to format address
const formatAddress = (address: string | StoreAddress | null | undefined): string => {
  if (!address) return "";
  if (typeof address === "string") return address;
  
  const parts = [
    address.street,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);
  
  return parts.join(", ");
};

export default function StoreDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.storeId as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortModal, setShowSortModal] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    if (storeId) {
      fetchStoreDetails();
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      setPage(1);
      setProducts([]);
      setHasMore(true);
      fetchStoreProducts(1, true);
    }
  }, [selectedCategory, sortBy]);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/customer/stores/${storeId}`, { headers });
      const data = await response.json();

      if (data.success && data.store) {
        setStore(data.store);
        if (data.topProducts) setTopProducts(data.topProducts);
      } else {
        Alert.alert("Error", data.error || "Store not found");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching store:", error);
      Alert.alert("Error", "Failed to load store");
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProducts = async (pageNum: number = 1, reset: boolean = false) => {
    if (!storeId) return;
    try {
      if (pageNum > 1) setLoadingMore(true);

      const token = await AsyncStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
        sort: sortBy === "newest" ? "createdAt" : sortBy,
      });
      if (selectedCategory !== "All") queryParams.append("category", selectedCategory);

      const response = await fetch(
        `${API_URL}/api/customer/stores/${storeId}/products?${queryParams}`,
        { headers }
      );
      const data = await response.json();

      if (data.success && data.products) {
        if (reset || pageNum === 1) {
          setProducts(data.products);
          const uniqueCats = ["All", ...new Set(
            data.products.map((p: Product) => p.category).filter(Boolean)
          )] as string[];
          setCategories(uniqueCats);
        } else {
          setProducts(prev => [...prev, ...data.products]);
        }
        setTotalProducts(data.pagination?.total || data.products.length);
        setHasMore(data.pagination ? pageNum < data.pagination.pages : data.products.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStoreDetails();
    await fetchStoreProducts(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) fetchStoreProducts(page + 1);
  };

  const addToCart = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Login Required", "Please login to add items to cart", [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/(auth)/login" as any) },
        ]);
        return;
      }

      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", `${product.name} added to cart!`);
      } else {
        Alert.alert("Error", data.message || "Failed to add to cart");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add to cart");
    }
  };

  const getSortLabel = (sort: SortOption) => {
    const labels = {
      newest: "Newest",
      "price-low": "Price: Low to High",
      "price-high": "Price: High to Low",
      popular: "Most Popular",
    };
    return labels[sort];
  };

  const renderProductCard = ({ item: product }: { item: Product }) => {
    const finalPrice = product.discountPrice || product.salePrice || product.price;
    const hasDiscount = product.discountPrice || product.salePrice;
    const discountPercent = hasDiscount
      ? Math.round(((product.price - finalPrice) / product.price) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.8}
        onPress={() => router.push({
          pathname: "/(customer)/product-details",
          params: { productId: product._id },
        } as any)}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: product.images?.[0] || "https://via.placeholder.com/150" }}
            style={styles.productImage}
          />
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
          {product.unit && (
            <Text style={styles.productUnit}>{product.quantity} {product.unit}</Text>
          )}
          <View style={styles.productFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>₹{finalPrice}</Text>
              {hasDiscount && <Text style={styles.originalPrice}>₹{product.price}</Text>}
            </View>
            {product.inStock !== false && (
              <TouchableOpacity
                style={styles.addButton}
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

  const renderHeader = () => {
    const addressText = store ? formatAddress(store.address) : "";
    
    return (
      <>
        {store && (
          <View style={styles.storeCard}>
            <Image
              source={{ uri: store.image || store.logo || "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400" }}
              style={styles.storeImage}
            />
            <View style={styles.storeInfoContainer}>
              <View style={styles.storeHeader}>
                <Text style={styles.storeName}>{store.name}</Text>
                {store.isOpen !== false && (
                  <View style={styles.openBadge}>
                    <View style={styles.openDot} />
                    <Text style={styles.openText}>Open</Text>
                  </View>
                )}
              </View>
              {addressText ? (
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={styles.storeAddress} numberOfLines={2}>
                    {addressText}
                  </Text>
                </View>
              ) : null}
              <View style={styles.storeMetaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.metaText}>{store.rating?.average?.toFixed(1) || "4.5"}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#64748B" />
                  <Text style={styles.metaText}>{store.deliveryTime || "20-30 min"}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="cube-outline" size={16} color="#64748B" />
                  <Text style={styles.metaText}>{store.inStockProducts || store.totalProducts || 0} items</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {topProducts.length > 0 && (
          <View style={styles.topProductsSection}>
            <Text style={styles.sectionTitle}>Best Sellers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topProductsContainer}>
              {topProducts.map((product) => (
                <TouchableOpacity
                  key={product._id}
                  style={styles.topProductCard}
                  onPress={() => router.push({
                    pathname: "/(customer)/product-details",
                    params: { productId: product._id },
                  } as any)}
                >
                  <Image
                    source={{ uri: product.images?.[0] || "https://via.placeholder.com/100" }}
                    style={styles.topProductImage}
                  />
                  <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.topProductPrice}>₹{product.discountPrice || product.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterBar}>
          <Text style={styles.resultsText}>{totalProducts} Products</Text>
          <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
            <Ionicons name="swap-vertical" size={18} color="#64748B" />
            <Text style={styles.sortButtonText}>{getSortLabel(sortBy)}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  if (loading && !store) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading store...</Text>
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.simpleHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Store</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Store Not Found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitleWhite} numberOfLines={1}>{store.name}</Text>
          <TouchableOpacity style={styles.cartButton} onPress={() => router.push("/(customer)/cart" as any)}>
            <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={() => loadingMore ? (
          <View style={styles.loadingMore}><ActivityIndicator size="small" color="#22C55E" /></View>
        ) : <View style={{ height: 100 }} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyProducts}>
            <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        ) : null}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22C55E"]} />}
      />

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
                {sortBy === option && <Ionicons name="checkmark" size={20} color="#22C55E" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  headerGradient: { paddingTop: 50, paddingBottom: 16 },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  simpleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: "#FFFFFF" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", flex: 1, textAlign: "center" },
  headerTitleWhite: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", flex: 1, textAlign: "center", marginHorizontal: 8 },
  cartButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  storeCard: { backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  storeImage: { width: "100%", height: 160, resizeMode: "cover" },
  storeInfoContainer: { padding: 16 },
  storeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  storeName: { fontSize: 20, fontWeight: "700", color: "#1E293B", flex: 1 },
  openBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  openText: { fontSize: 12, fontWeight: "600", color: "#22C55E" },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 12 },
  storeAddress: { fontSize: 14, color: "#64748B", flex: 1 },
  storeMetaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, fontWeight: "500", color: "#1E293B" },
  metaDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", marginHorizontal: 10 },
  topProductsSection: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginBottom: 12 },
  topProductsContainer: { gap: 12 },
  topProductCard: { width: 100, alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 10, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  topProductImage: { width: 70, height: 70, borderRadius: 8, resizeMode: "cover", marginBottom: 8 },
  topProductName: { fontSize: 12, fontWeight: "500", color: "#1E293B", textAlign: "center" },
  topProductPrice: { fontSize: 13, fontWeight: "700", color: "#22C55E", marginTop: 4 },
  categorySection: { marginTop: 20, paddingVertical: 12 },
  categoriesContainer: { paddingHorizontal: 16, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", marginRight: 8 },
  categoryChipActive: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  categoryChipText: { fontSize: 14, fontWeight: "500", color: "#64748B" },
  categoryChipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  filterBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  resultsText: { fontSize: 14, color: "#64748B" },
  sortButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortButtonText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  productsList: { paddingHorizontal: 16, paddingBottom: 100 },
  productRow: { justifyContent: "space-between" },
  productCard: { width: PRODUCT_CARD_WIDTH, marginBottom: 16, backgroundColor: "#FFFFFF", borderRadius: 12, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  productImageContainer: { width: "100%", height: 140, position: "relative" },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  discountBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "#EF4444", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  outOfStockOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.7)", paddingVertical: 6, alignItems: "center" },
  outOfStockText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 4, minHeight: 36 },
  productUnit: { fontSize: 12, color: "#94A3B8", marginBottom: 8 },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  productPrice: { fontSize: 16, fontWeight: "700", color: "#22C55E" },
  originalPrice: { fontSize: 12, color: "#94A3B8", textDecorationLine: "line-through" },
  addButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  loadingMore: { paddingVertical: 20, alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyProducts: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748B", marginTop: 16 },
  emptyText: { fontSize: 14, color: "#94A3B8", textAlign: "center", marginTop: 8 },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sortModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  sortModalTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  sortOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  sortOptionText: { fontSize: 16, color: "#64748B" },
  sortOptionTextActive: { color: "#22C55E", fontWeight: "600" },
});