import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { productAPI, storeAPI } from "../../services/api";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;

const categories = [
  { id: "all", label: "All", icon: "grid" },
  { id: "vegetables", label: "Vegetables", icon: "leaf" },
  { id: "fruits", label: "Fruits", icon: "nutrition" },
  { id: "dairy", label: "Dairy", icon: "water" },
  { id: "grocery", label: "Grocery", icon: "cart" },
  { id: "bakery", label: "Bakery", icon: "cafe" },
];

export default function CustomerHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const filters = {};
      if (selectedCategory !== "all") filters.category = selectedCategory;
      if (searchQuery) filters.search = searchQuery;

      const productRes = await productAPI.getAllProducts(filters);
      if (productRes.success) {
        setProducts(productRes.data.products || []);
      }

      const storeRes = await storeAPI.getAllStores();
      if (storeRes.success) {
        setStores(storeRes.data.stores || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const ProductCard = ({ item }) => (
    <TouchableOpacity style={styles.productCard}>
      <Image
        source={{ uri: item.images?.[0] || "https://via.placeholder.com/150" }}
        style={styles.productImage}
      />
      {item.discountPrice && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>
            {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
          </Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productQuantity}>{item.quantity} {item.unit}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.discountPrice || item.price}</Text>
          {item.discountPrice && (
            <Text style={styles.originalPrice}>₹{item.price}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={20} color="#FFF" />
            <View style={styles.locationText}>
              <Text style={styles.deliverTo}>Deliver to</Text>
              <TouchableOpacity style={styles.addressRow}>
                <Text style={styles.address}>Home - Bangalore</Text>
                <Ionicons name="chevron-down" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => { setLoading(true); fetchData(); }}
            returnKeyType="search"
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22C55E"]} />
        }
      >
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => { setSelectedCategory(cat.id); setLoading(true); }}
            >
              <View style={[styles.categoryIcon, selectedCategory === cat.id && styles.categoryIconActive]}>
                <Ionicons name={cat.icon} size={22} color={selectedCategory === cat.id ? "#FFF" : "#22C55E"} />
              </View>
              <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stores */}
        {stores.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Stores</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {stores.map((store) => (
                <TouchableOpacity key={store._id} style={styles.storeCard}>
                  <View style={styles.storeImagePlaceholder}>
                    <Ionicons name="storefront" size={28} color="#22C55E" />
                  </View>
                  <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                  <View style={styles.storeRating}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.storeRatingText}>{store.rating || "4.5"}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            <Text style={styles.productCount}>{products.length} items</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={64} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Products added by vendors will appear here</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#22C55E" />
          <Text style={[styles.navLabel, { color: "#22C55E" }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="cart-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  locationContainer: { flexDirection: "row", alignItems: "center" },
  locationText: { marginLeft: 8 },
  deliverTo: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  cartButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 14, height: 48 },
  searchInput: { flex: 1, fontSize: 15, color: "#1E293B", marginLeft: 10 },
  scrollView: { flex: 1 },
  categoriesContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  categoryItem: { alignItems: "center" },
  categoryIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  categoryIconActive: { backgroundColor: "#22C55E" },
  categoryLabel: { fontSize: 12, fontWeight: "500", color: "#64748B" },
  categoryLabelActive: { color: "#22C55E", fontWeight: "600" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  productCount: { fontSize: 14, color: "#64748B" },
  storeCard: { width: 100, marginRight: 12, alignItems: "center" },
  storeImagePlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  storeName: { fontSize: 13, fontWeight: "600", color: "#1E293B", textAlign: "center" },
  storeRating: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  storeRatingText: { fontSize: 12, color: "#64748B" },
  loadingContainer: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748B" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#64748B", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#94A3B8", marginTop: 4, textAlign: "center" },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  productCard: { width: CARD_WIDTH, backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  productImage: { width: "100%", height: CARD_WIDTH, backgroundColor: "#F1F5F9" },
  discountBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "#EF4444", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { fontSize: 10, fontWeight: "700", color: "#FFF" },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  productQuantity: { fontSize: 12, color: "#64748B", marginBottom: 8 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  productPrice: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  originalPrice: { fontSize: 13, color: "#94A3B8", textDecorationLine: "line-through" },
  addButton: { position: "absolute", bottom: 12, right: 12, width: 32, height: 32, borderRadius: 10, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#FFF", paddingTop: 12, paddingBottom: 28, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: "#F1F5F9", justifyContent: "space-around" },
  navItem: { alignItems: "center", gap: 4 },
  navLabel: { fontSize: 11, fontWeight: "500", color: "#94A3B8" },
});