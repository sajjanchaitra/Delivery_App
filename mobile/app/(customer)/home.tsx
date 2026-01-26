// app/(customer)/home.tsx - Part 1: See next artifact for styles
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
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");
const API_URL = "http://13.203.206.134:5000";
const SHOP_CARD_WIDTH = (width - 52) / 2;
const PRODUCT_CARD_WIDTH = 170;

const COLORS = {
  primary: "#1E5EFF",
  danger: "#EF4444",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
  border: "#E2E8F0",
};

const FIXED_CATEGORIES = [
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️', storeType: 'restaurant' },
  { id: 'medical', name: 'Medical', icon: '💊', storeType: 'medical' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥬', category: 'vegetables' },
  { id: 'fruits', name: 'Fruits', icon: '🍎', category: 'fruits' },
  { id: 'grocery', name: 'Grocery', icon: '🛒', category: 'grocery' },
  { id: 'dairy', name: 'Dairy', icon: '🥛', category: 'dairy' },
  { id: 'meat', name: 'Meat', icon: '🥩', category: 'meat' },
  { id: 'bakery', name: 'Bakery', icon: '🍞', category: 'bakery' },
];

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath}`;
};

interface Store {
  _id: string;
  name: string;
  image?: string;
  logo?: string;
  deliveryTime?: string;
  isOpen?: boolean;
  rating?: { average?: number; count?: number };
  productCount?: number;
}

interface Product {
  _id: string;
  name: string;
  images?: string[];
  price: number;
  discountPrice?: number | null;
  salePrice?: number;
  inStock?: boolean;
  store?: { _id: string; name: string };
}

interface Banner {
  id: number;
  image: string;
  title: string;
  subtitle: string;
}

export default function CustomerHome() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const bannerScrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [locationText, setLocationText] = useState("Fetching location...");
  const [userName, setUserName] = useState("Guest");
  const [cartCount, setCartCount] = useState(0);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const banners: Banner[] = [
    { id: 1, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200", title: "Fresh Groceries", subtitle: "Best deals near you" },
    { id: 2, image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=1200", title: "Fast Delivery", subtitle: "Doorstep in minutes" },
    { id: 3, image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200", title: "Top Stores", subtitle: "Trusted local shops" },
  ];

  useEffect(() => { initializeScreen(); }, []);
  useFocusEffect(useCallback(() => { fetchCartCount(); }, []));
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % banners.length;
        bannerScrollRef.current?.scrollTo({ x: nextSlide * (width - 40), animated: true });
        return nextSlide;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const initializeScreen = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUserProfile(), fetchLocation(), fetchAllData(), fetchCartCount()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const response = await fetch(`${API_URL}/api/customer/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) {
        const user = data.customer || data.user || data.profile;
        if (user?.name) setUserName(user.name);
      }
    } catch (error) {
      setUserName("Guest");
    }
  };

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocationText("Location access denied"); return; }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const address = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (address?.[0]) {
        const { city, district, street, name } = address[0];
        const primary = street || name || district || city || "Unknown";
        const secondary = city || district || "";
        setLocationText(primary === secondary || !secondary ? primary : `${primary}, ${secondary}`);
      }
    } catch (error) {
      setLocationText("Unable to get location");
    }
  };

  const fetchCartCount = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const response = await fetch(`${API_URL}/api/cart`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success && data.cart?.items) {
        setCartCount(data.cart.items.reduce((acc: number, item: { quantity?: number }) => acc + (item.quantity || 1), 0));
      }
    } catch (error) {
      setCartCount(0);
    }
  };

  const fetchAllData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const [storesRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/api/customer/stores?limit=6`, { headers }),
        fetch(`${API_URL}/api/customer/products?limit=10`, { headers }),
      ]);
      const [storesData, productsData] = await Promise.all([storesRes.json(), productsRes.json()]);
      if (storesData.success) setStores(storesData.stores || []);
      if (productsData.success) setProducts(productsData.products || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load data");
    }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchAllData(); await fetchCartCount(); setRefreshing(false); };

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    Animated.sequence([
      Animated.spring(toastAnim, {
        toValue: 60,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.delay(2500),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
    });
  };

  const addToCart = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Login Required", "Please login to add items", [
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
        setCartCount((prev) => prev + 1);
        showToastMessage("✓ Added to cart");
      } else {
        showToastMessage(data.message || "Unable to add item", "error");
      }
    } catch (error) {
      showToastMessage("Something went wrong", "error");
    }
  };

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentSlide(Math.round(event.nativeEvent.contentOffset.x / (width - 40)));
  };

  const handleCategoryClick = (category: typeof FIXED_CATEGORIES[0]) => {
    router.push({
      pathname: "/(customer)/categories",
      params: { categoryName: category.name, storeType: category.storeType || '', category: category.category || '' },
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity activeOpacity={0.7} onPress={fetchLocation} style={styles.locationButton}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Deliver to</Text>
              <Text style={styles.locationText} numberOfLines={1}>{locationText}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/(customer)/profile" as any)}>
            <Ionicons name="person-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>Hello, <Text style={styles.userName}>{userName}</Text> 👋</Text>
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/(customer)/search" as any)}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <Text style={styles.searchPlaceholder}>Search products, stores...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
        
        <View style={styles.bannerWrap}>
          <ScrollView ref={bannerScrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleBannerScroll} scrollEventThrottle={16}>
            {banners.map((banner) => (
              <TouchableOpacity key={banner.id} style={styles.bannerCard}>
                <Image source={{ uri: banner.image }} style={styles.bannerImg} />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSub}>{banner.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {banners.map((_, index) => (<View key={index} style={[styles.dot, currentSlide === index && styles.dotActive]} />))}
          </View>
        </View>

        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Shop by Category</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {FIXED_CATEGORIES.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard} onPress={() => handleCategoryClick(category)}>
                <View style={styles.categoryIconContainer}><Text style={styles.categoryIcon}>{category.icon}</Text></View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shops Near You</Text>
            {stores.length > 0 && (<TouchableOpacity onPress={() => router.push("/(customer)/stores" as any)}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>)}
          </View>
          {stores.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="storefront-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No stores available</Text>
            </View>
          ) : (
            <View style={styles.storeGrid}>
              {stores.slice(0, 4).map((store) => (
                <TouchableOpacity key={store._id} style={styles.storeCard} onPress={() => router.push({ pathname: "/(customer)/store-details", params: { storeId: store._id } } as any)}>
                  <Image source={{ uri: getImageUrl(store.image || store.logo) }} style={styles.storeImg} />
                  <View style={styles.storeBadges}>
                    <View style={styles.deliveryBadge}>
                      <Ionicons name="bicycle" size={10} color={COLORS.card} />
                      <Text style={styles.deliveryText}>{store.deliveryTime || "30 min"}</Text>
                    </View>
                    <View style={[styles.statusBadge, store.isOpen === false && styles.closedBadge]}>
                      <Text style={styles.statusText}>{store.isOpen === false ? "CLOSED" : "OPEN"}</Text>
                    </View>
                  </View>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                    <View style={styles.storeMeta}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.storeRating}>{store.rating?.average?.toFixed(1) || "4.5"}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.storeProducts}>{store.productCount || 0} items</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {products.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: "/(customer)/categories", params: { categoryName: "All" } } as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
              {products.map((product) => {
                const finalPrice = product.discountPrice || product.salePrice || product.price;
                const hasDiscount = (product.discountPrice && product.discountPrice < product.price) || (product.salePrice && product.salePrice < product.price);
                const discountPercent = hasDiscount ? Math.round(((product.price - finalPrice) / product.price) * 100) : 0;
                return (
                  <TouchableOpacity key={product._id} style={styles.productCard} onPress={() => router.push({ pathname: "/(customer)/product-details", params: { productId: product._id } } as any)}>
                    <View style={styles.productImgWrap}>
                      <Image source={{ uri: getImageUrl(product.images?.[0]) }} style={styles.productImg} />
                      {discountPercent > 0 && (<View style={styles.offBadge}><Text style={styles.offText}>{discountPercent}% OFF</Text></View>)}
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                      {product.store?.name && (<Text style={styles.productStore} numberOfLines={1}>{product.store.name}</Text>)}
                      <View style={styles.productBottom}>
                        <View>
                          <Text style={styles.productPrice}>₹{finalPrice}</Text>
                          {hasDiscount && (<Text style={styles.productMrp}>₹{product.price}</Text>)}
                        </View>
                        <TouchableOpacity style={[styles.addBtn, product.inStock === false && styles.addBtnDisabled]} onPress={(e) => { e.stopPropagation(); if (product.inStock !== false) addToCart(product); }} disabled={product.inStock === false}>
                          <Ionicons name={product.inStock === false ? "close" : "add"} size={18} color={COLORS.card} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}><Ionicons name="home" size={24} color={COLORS.primary} /><Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(customer)/orders" as any)}><Ionicons name="receipt-outline" size={24} color={COLORS.textLight} /><Text style={styles.navLabel}>Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(customer)/cart" as any)}>
          <View style={{ position: "relative" }}>
            <Ionicons name="cart-outline" size={24} color={COLORS.textLight} />
            {cartCount > 0 && (<View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount > 99 ? "99+" : String(cartCount)}</Text></View>)}
          </View>
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(customer)/profile" as any)}><Ionicons name="person-outline" size={24} color={COLORS.textLight} /><Text style={styles.navLabel}>Profile</Text></TouchableOpacity>
      </View>

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
  page: { flex: 1, backgroundColor: COLORS.bg },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textLight },
  header: { backgroundColor: COLORS.card, paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  locationButton: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, marginRight: 12 },
  locationTextContainer: { flex: 1 },
  locationLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  locationText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  profileButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" },
  greeting: { fontSize: 20, fontWeight: "600", color: COLORS.text, marginBottom: 16 },
  userName: { fontWeight: "700", color: COLORS.primary },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bg, borderRadius: 12, paddingHorizontal: 16, height: 48, gap: 12 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: COLORS.textLight },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  seeAll: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  bannerWrap: { paddingHorizontal: 20 },
  bannerCard: { width: width - 40, height: 160, borderRadius: 16, overflow: "hidden", backgroundColor: COLORS.card, marginRight: 14 },
  bannerImg: { width: "100%", height: "100%", resizeMode: "cover" },
  bannerOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: "rgba(0,0,0,0.4)" },
  bannerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 4 },
  bannerSub: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  dots: { position: "absolute", bottom: 16, right: 32, flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 20, backgroundColor: "#fff" },
  categorySection: { paddingHorizontal: 20, marginTop: 24 },
  categoriesScroll: { paddingRight: 10 },
  categoryCard: { alignItems: "center", marginRight: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: COLORS.card, minWidth: 85, borderWidth: 1, borderColor: COLORS.border },
  categoryIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  categoryIcon: { fontSize: 28 },
  categoryName: { fontSize: 12, fontWeight: "600", color: COLORS.text, textAlign: "center" },
  emptyBox: { backgroundColor: COLORS.card, borderRadius: 12, paddingVertical: 32, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  emptyText: { color: COLORS.textLight, marginTop: 12, fontWeight: "500", fontSize: 14 },
  storeGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  storeCard: { width: SHOP_CARD_WIDTH, backgroundColor: COLORS.card, borderRadius: 12, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  storeImg: { width: "100%", height: 120, resizeMode: "cover" },
  storeBadges: { position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", justifyContent: "space-between" },
  deliveryBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  deliveryText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  statusBadge: { backgroundColor: "#22C55E", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  closedBadge: { backgroundColor: "#EF4444" },
  statusText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  storeInfo: { padding: 12 },
  storeName: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  storeMeta: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  storeRating: { marginLeft: 4, fontSize: 12, fontWeight: "600", color: COLORS.text },
  metaDot: { marginHorizontal: 6, color: COLORS.border },
  storeProducts: { fontSize: 12, color: COLORS.textLight, fontWeight: "500" },
  productCard: { width: PRODUCT_CARD_WIDTH, marginLeft: 20, backgroundColor: COLORS.card, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  productImgWrap: { width: "100%", height: 120 },
  productImg: { width: "100%", height: "100%", resizeMode: "cover" },
  offBadge: { position: "absolute", top: 10, left: 10, backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  offText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  productInfo: { padding: 12 },
  productName: { fontSize: 13, fontWeight: "700", color: COLORS.text, minHeight: 34 },
  productStore: { marginTop: 4, fontSize: 11, color: COLORS.textLight, fontWeight: "500" },
  productBottom: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productPrice: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  productMrp: { marginTop: 2, fontSize: 11, color: COLORS.textLight, textDecorationLine: "line-through", fontWeight: "500" },
  addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  addBtnDisabled: { backgroundColor: "#CBD5E1" },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: "row", justifyContent: "space-around", paddingTop: 12, paddingBottom: 26 },
  navItem: { alignItems: "center", gap: 4 },
  navLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textLight },
  navLabelActive: { color: COLORS.primary },
  cartBadge: { position: "absolute", top: -7, right: -10, backgroundColor: COLORS.danger, borderRadius: 999, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
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
    backgroundColor: "#22C55E",
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