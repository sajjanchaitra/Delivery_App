// app/(customer)/search.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Alert,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = (width - 52) / 2;
const API_URL = "http://13.203.206.134:5000";

interface Store {
  _id: string;
  name: string;
  image?: string;
  address?: string;
  rating?: { average?: number };
  productCount?: number;
  isOpen?: boolean;
}

interface Product {
  _id: string;
  name: string;
  images?: string[];
  price: number;
  discountPrice?: number;
  salePrice?: number;
  inStock?: boolean;
  store?: { _id: string; name: string };
}

export default function SearchScreen() {
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "stores">("products");

  useEffect(() => {
    loadRecentSearches();
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem("recentSearches");
      if (searches) setRecentSearches(JSON.parse(searches));
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      let searches = recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase());
      searches.unshift(query);
      searches = searches.slice(0, 10);
      setRecentSearches(searches);
      await AsyncStorage.setItem("recentSearches", JSON.stringify(searches));
    } catch (error) {
      console.error("Error saving search:", error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem("recentSearches");
    } catch (error) {
      console.error("Error clearing searches:", error);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    saveRecentSearch(query.trim());
    Keyboard.dismiss();

    try {
      const token = await AsyncStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [productsRes, storesRes] = await Promise.all([
        fetch(`${API_URL}/api/customer/products?search=${encodeURIComponent(query)}&limit=50`, { headers }),
        fetch(`${API_URL}/api/customer/stores?search=${encodeURIComponent(query)}&limit=20`, { headers }),
      ]);

      const [productsData, storesData] = await Promise.all([
        productsRes.json(),
        storesRes.json(),
      ]);

      if (productsData.success) setProducts(productsData.products || []);
      if (storesData.success) setStores(storesData.stores || []);

      if (productsData.products?.length > 0) {
        setActiveTab("products");
      } else if (storesData.stores?.length > 0) {
        setActiveTab("stores");
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.length > 2) {
      searchTimeout.current = setTimeout(() => performSearch(text), 500);
    } else if (text.length === 0) {
      setProducts([]);
      setStores([]);
    }
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

  const hasResults = products.length > 0 || stores.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search products, stores..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => performSearch(searchQuery)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); setProducts([]); setStores([]); }}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!loading && !hasResults && searchQuery.length === 0 && recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentItem}
                onPress={() => { setSearchQuery(search); performSearch(search); }}
              >
                <Ionicons name="time-outline" size={20} color="#64748B" />
                <Text style={styles.recentText}>{search}</Text>
                <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && hasResults && (
          <>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "products" && styles.tabActive]}
                onPress={() => setActiveTab("products")}
              >
                <Text style={[styles.tabText, activeTab === "products" && styles.tabTextActive]}>
                  Products ({products.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "stores" && styles.tabActive]}
                onPress={() => setActiveTab("stores")}
              >
                <Text style={[styles.tabText, activeTab === "stores" && styles.tabTextActive]}>
                  Stores ({stores.length})
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === "products" && (
              <View style={styles.productsGrid}>
                {products.map((product) => {
                  const price = product.discountPrice || product.salePrice || product.price;
                  const hasDiscount = product.discountPrice || product.salePrice;
                  const discountPercent = hasDiscount ? Math.round(((product.price - price) / product.price) * 100) : 0;

                  return (
                    <TouchableOpacity
                      key={product._id}
                      style={styles.productCard}
                      onPress={() => router.push({ pathname: "/(customer)/product-details", params: { productId: product._id } } as any)}
                    >
                      <View style={styles.productImageContainer}>
                        <Image source={{ uri: product.images?.[0] || "https://via.placeholder.com/150" }} style={styles.productImage} />
                        {discountPercent > 0 && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                        {product.store && <Text style={styles.storeName} numberOfLines={1}>{product.store.name}</Text>}
                        <View style={styles.productFooter}>
                          <Text style={styles.productPrice}>₹{price}</Text>
                          {product.inStock !== false && (
                            <TouchableOpacity style={styles.addButton} onPress={(e) => { e.stopPropagation(); addToCart(product); }}>
                              <Ionicons name="add" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {activeTab === "stores" && (
              <View style={styles.storesList}>
                {stores.map((store) => (
                  <TouchableOpacity
                    key={store._id}
                    style={styles.storeCard}
                    onPress={() => router.push({ pathname: "/(customer)/store-details", params: { storeId: store._id } } as any)}
                  >
                    <Image source={{ uri: store.image || "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300" }} style={styles.storeImage} />
                    <View style={styles.storeCardInfo}>
                      <Text style={styles.storeCardName}>{store.name}</Text>
                      {store.address && <Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>}
                      <View style={styles.storeMeta}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.storeRating}>{store.rating?.average?.toFixed(1) || "4.5"}</Text>
                        <Text style={styles.storeDot}>•</Text>
                        <Text style={styles.storeProductCount}>{store.productCount || 0} products</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {!loading && !hasResults && searchQuery.length > 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>Try searching with different keywords</Text>
          </View>
        )}

        {!loading && !hasResults && searchQuery.length === 0 && recentSearches.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Search for products</Text>
            <Text style={styles.emptyText}>Find products, stores and more</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center", marginRight: 8 },
  searchContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, fontSize: 15, color: "#1E293B", marginLeft: 10 },
  scrollView: { flex: 1 },
  loadingContainer: { alignItems: "center", paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748B" },
  section: { padding: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  clearText: { fontSize: 14, color: "#DC2626", fontWeight: "500" },
  recentItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  recentText: { flex: 1, fontSize: 14, color: "#1E293B", marginLeft: 12 },
  tabsContainer: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, borderBottomWidth: 2, borderBottomColor: "#F1F5F9" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#DC2626", marginBottom: -2 },
  tabText: { fontSize: 14, fontWeight: "500", color: "#94A3B8" },
  tabTextActive: { color: "#DC2626", fontWeight: "700" },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 16 },
  productCard: { width: PRODUCT_CARD_WIDTH, marginBottom: 16, backgroundColor: "#FFFFFF", borderRadius: 12, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  productImageContainer: { width: "100%", height: 130, position: "relative" },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  discountBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "#EF4444", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: "600", color: "#1E293B", marginBottom: 4, minHeight: 32 },
  storeName: { fontSize: 11, color: "#64748B", marginBottom: 8 },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productPrice: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
  addButton: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#DC2626", justifyContent: "center", alignItems: "center" },
  storesList: { paddingHorizontal: 16 },
  storeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginBottom: 12 },
  storeImage: { width: 60, height: 60, borderRadius: 8, resizeMode: "cover" },
  storeCardInfo: { flex: 1, marginLeft: 12 },
  storeCardName: { fontSize: 15, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  storeAddress: { fontSize: 12, color: "#64748B", marginBottom: 4 },
  storeMeta: { flexDirection: "row", alignItems: "center" },
  storeRating: { fontSize: 12, fontWeight: "600", color: "#1E293B", marginLeft: 2 },
  storeDot: { fontSize: 12, color: "#CBD5E1", marginHorizontal: 6 },
  storeProductCount: { fontSize: 12, color: "#64748B" },
  emptyState: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748B", marginTop: 16 },
  emptyText: { fontSize: 14, color: "#94A3B8", marginTop: 8 },
});