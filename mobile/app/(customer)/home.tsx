// app/(customer)/home.tsx
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
  Platform,
  FlatList,
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

const FIXED_CATEGORIES = [
  { id: "restaurant", name: "Restaurant", icon: "🍽️", storeType: "restaurant" },
  { id: "medical", name: "Medical", icon: "💊", storeType: "medical" },
  { id: "vegetables", name: "Vegetables", icon: "🥬", category: "vegetables" },
  { id: "fruits", name: "Fruits", icon: "🍎", category: "fruits" },
  { id: "grocery", name: "Grocery", icon: "🛒", category: "grocery" },
  { id: "dairy", name: "Dairy", icon: "🥛", category: "dairy" },
  { id: "meat", name: "Meat", icon: "🥩", category: "meat" },
  { id: "bakery", name: "Bakery", icon: "🍞", category: "bakery" },
];

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath)
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [locationText, setLocationText] = useState("Fetching location...");
  const [userName, setUserName] = useState<string | null>(null);

  const [cartCount, setCartCount] = useState(0);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastAnim = useRef(new Animated.Value(140)).current;

  // Banner slider refs
  const bannerListRef = useRef<FlatList<Banner>>(null);
  const banners: Banner[] = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200",
      title: "Fresh Groceries",
      subtitle: "Best deals near you",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=1200",
      title: "Fast Delivery",
      subtitle: "Doorstep in minutes",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200",
      title: "Top Stores",
      subtitle: "Trusted local shops",
    },
  ];

  // EXACT banner width (fixed)
  const BANNER_WIDTH = width - 40;
  const BANNER_HEIGHT = 140;

  useEffect(() => {
    initializeScreen();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCartCount();
    }, [])
  );

  // Auto slider (FlatList - no shift ever)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % banners.length;
        bannerListRef.current?.scrollToOffset({
          offset: next * BANNER_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const initializeScreen = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchLocation(),
        fetchAllData(),
        fetchCartCount(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setUserName(null);
        return;
      }

      const response = await fetch(`${API_URL}/api/customer/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        const user = data.customer || data.user || data.profile;
        if (user?.name && String(user.name).trim().length > 0) {
          setUserName(String(user.name).trim());
        } else setUserName(null);
      } else setUserName(null);
    } catch {
      setUserName(null);
    }
  };

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Location access denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address?.[0]) {
        const { city, district, street, name } = address[0];
        const primary = street || name || district || city || "Unknown";
        const secondary = city || district || "";
        setLocationText(
          primary === secondary || !secondary ? primary : `${primary}, ${secondary}`
        );
      }
    } catch {
      setLocationText("Unable to get location");
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
      } else setCartCount(0);
    } catch {
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

      const [storesData, productsData] = await Promise.all([
        storesRes.json(),
        productsRes.json(),
      ]);

      if (storesData.success) setStores(storesData.stores || []);
      if (productsData.success) setProducts(productsData.products || []);
    } catch {
      Alert.alert("Error", "Failed to load data");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    await fetchCartCount();
    setRefreshing(false);
  };

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    toastAnim.setValue(140);

    Animated.sequence([
      Animated.spring(toastAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 140,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setShowToast(false));
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
        showToastMessage("Added to cart", "success");
      } else {
        showToastMessage(data.message || "Unable to add item", "error");
      }
    } catch {
      showToastMessage("Something went wrong", "error");
    }
  };

  const handleCategoryClick = (category: typeof FIXED_CATEGORIES[0]) => {
    router.push({
      pathname: "/(customer)/categories",
      params: {
        categoryName: category.name,
        storeType: category.storeType || "",
        category: category.category || "",
      },
    } as any);
  };

  const onBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / BANNER_WIDTH);
    setCurrentSlide(index);
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

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity activeOpacity={0.7} onPress={fetchLocation} style={styles.locationButton}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Deliver to</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {locationText}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/(customer)/profile" as any)}>
            <Ionicons name="person-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/(customer)/search" as any)}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <Text style={styles.searchPlaceholder}>Search products, stores...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* SPECIAL OFFERS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={{ position: "relative" }}>
            <FlatList
              ref={bannerListRef}
              data={banners}
              keyExtractor={(item) => String(item.id)}
              horizontal
              pagingEnabled
              snapToInterval={BANNER_WIDTH}
              snapToAlignment="start"
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onScroll={onBannerScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              getItemLayout={(_, index) => ({
                length: BANNER_WIDTH,
                offset: BANNER_WIDTH * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.95} style={[styles.bannerCard, { height: BANNER_HEIGHT }]}>
                  <Image source={{ uri: item.image }} style={styles.bannerImg} />
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <Text style={styles.bannerSub}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <View style={styles.dots}>
              {banners.map((_, index) => (
                <View key={index} style={[styles.dot, currentSlide === index && styles.dotActive]} />
              ))}
            </View>
          </View>
        </View>

        {/* CATEGORIES (HORIZONTAL LIKE REFERENCE) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {FIXED_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryMiniCard}
                onPress={() => handleCategoryClick(category)}
                activeOpacity={0.85}
              >
                <View style={styles.categoryMiniIconWrap}>
                  <Text style={styles.categoryMiniIcon}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryMiniText} numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* STORES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shops Near You</Text>
            {stores.length > 0 && (
              <TouchableOpacity onPress={() => router.push("/(customer)/stores" as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {stores.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="storefront-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No stores available</Text>
            </View>
          ) : (
            <View style={styles.storeGrid}>
              {stores.slice(0, 4).map((store) => (
                <TouchableOpacity
                  key={store._id}
                  style={styles.storeCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/(customer)/store-details",
                      params: { storeId: store._id },
                    } as any)
                  }
                >
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
                    <Text style={styles.storeName} numberOfLines={1}>
                      {store.name}
                    </Text>

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

        {/* FEATURED PRODUCTS */}
        {products.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(customer)/categories",
                    params: { categoryName: "All" },
                  } as any)
                }
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
              {products.map((product) => {
                const finalPrice = product.discountPrice || product.salePrice || product.price;

                const hasDiscount =
                  (product.discountPrice && product.discountPrice < product.price) ||
                  (product.salePrice && product.salePrice < product.price);

                const discountPercent = hasDiscount
                  ? Math.round(((product.price - finalPrice) / product.price) * 100)
                  : 0;

                return (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.productCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push({
                        pathname: "/(customer)/product-details",
                        params: { productId: product._id },
                      } as any)
                    }
                  >
                    <View style={styles.productImgWrap}>
                      <Image source={{ uri: getImageUrl(product.images?.[0]) }} style={styles.productImg} />
                      {discountPercent > 0 && (
                        <View style={styles.offBadge}>
                          <Text style={styles.offText}>{discountPercent}% OFF</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>

                      {product.store?.name && (
                        <Text style={styles.productStore} numberOfLines={1}>
                          {product.store.name}
                        </Text>
                      )}

                      <View style={styles.productBottom}>
                        <View>
                          <Text style={styles.productPrice}>₹{finalPrice}</Text>
                          {hasDiscount && <Text style={styles.productMrp}>₹{product.price}</Text>}
                        </View>

                        <TouchableOpacity
                          style={[styles.addBtn, product.inStock === false && styles.addBtnDisabled]}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (product.inStock !== false) addToCart(product);
                            else showToastMessage("Out of stock", "error");
                          }}
                          disabled={product.inStock === false}
                          activeOpacity={0.9}
                        >
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

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={COLORS.primary} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(customer)/orders" as any)}>
          <Ionicons name="receipt-outline" size={24} color={COLORS.textLight} />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(customer)/cart" as any)}>
          <View style={{ position: "relative" }}>
            <Ionicons name="cart-outline" size={24} color={COLORS.textLight} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? "99+" : String(cartCount)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(customer)/profile" as any)}>
          <Ionicons name="person-outline" size={24} color={COLORS.textLight} />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Toast */}
      {showToast && (
        <Animated.View
          style={[
            styles.bottomToast,
            toastType === "success" ? styles.bottomToastSuccess : styles.bottomToastError,
            { transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Ionicons name={toastType === "success" ? "checkmark-circle" : "alert-circle"} size={20} color="#fff" />
          <Text style={styles.bottomToastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.bg },

  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textLight },

  header: {
    backgroundColor: COLORS.card,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  locationButton: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, marginRight: 12 },
  locationTextContainer: { flex: 1 },
  locationLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  locationText: { fontSize: 13, fontWeight: "700", color: COLORS.text },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.softPink,
    justifyContent: "center",
    alignItems: "center",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softBlue,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: COLORS.textLight, fontWeight: "600" },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 20 },

  section: { paddingHorizontal: 20, marginTop: 18 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  seeAll: { fontSize: 14, fontWeight: "800", color: COLORS.secondary },

  bannerCard: {
    width: width - 40,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.card,
  },
  bannerImg: { width: "100%", height: "100%", resizeMode: "cover" },
  bannerOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 18, backgroundColor: "rgba(0,0,0,0.35)" },
  bannerTitle: { fontSize: 18, fontWeight: "900", color: "#fff", marginBottom: 4 },
  bannerSub: { fontSize: 13, color: "rgba(255,255,255,0.95)", fontWeight: "600" },

  dots: { position: "absolute", bottom: 12, right: 22, flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 20, backgroundColor: "#fff" },

  categoriesRow: { paddingTop: 12, paddingBottom: 4, paddingRight: 10 },
  categoryMiniCard: {
    width: 92,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryMiniIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.softPink,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryMiniIcon: { fontSize: 26 },
  categoryMiniText: { fontSize: 12, fontWeight: "800", color: COLORS.text },

  emptyBox: { backgroundColor: COLORS.card, borderRadius: 12, paddingVertical: 32, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  emptyText: { color: COLORS.textLight, marginTop: 12, fontWeight: "600", fontSize: 14 },

  storeGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  storeCard: { width: SHOP_CARD_WIDTH, backgroundColor: COLORS.card, borderRadius: 14, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  storeImg: { width: "100%", height: 120, resizeMode: "cover" },
  storeBadges: { position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", justifyContent: "space-between" },
  deliveryBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  deliveryText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  statusBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  closedBadge: { backgroundColor: "#64748B" },
  statusText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  storeInfo: { padding: 12 },
  storeName: { fontSize: 14, fontWeight: "900", color: COLORS.text },
  storeMeta: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  storeRating: { marginLeft: 4, fontSize: 12, fontWeight: "800", color: COLORS.text },
  metaDot: { marginHorizontal: 6, color: COLORS.border },
  storeProducts: { fontSize: 12, color: COLORS.textLight, fontWeight: "700" },

  productCard: { width: PRODUCT_CARD_WIDTH, marginLeft: 20, backgroundColor: COLORS.card, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  productImgWrap: { width: "100%", height: 120 },
  productImg: { width: "100%", height: "100%", resizeMode: "cover" },
  offBadge: { position: "absolute", top: 10, left: 10, backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  offText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  productInfo: { padding: 12 },
  productName: { fontSize: 13, fontWeight: "900", color: COLORS.text, minHeight: 34 },
  productStore: { marginTop: 4, fontSize: 11, color: COLORS.textLight, fontWeight: "700" },
  productBottom: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productPrice: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
  productMrp: { marginTop: 2, fontSize: 11, color: COLORS.textLight, textDecorationLine: "line-through", fontWeight: "700" },

  addBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  addBtnDisabled: { backgroundColor: "#CBD5E1" },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    paddingBottom: 26,
  },
  navItem: { alignItems: "center", gap: 4 },
  navLabel: { fontSize: 12, fontWeight: "800", color: COLORS.textLight },
  navLabelActive: { color: COLORS.primary },

  cartBadge: { position: "absolute", top: -7, right: -10, backgroundColor: COLORS.secondary, borderRadius: 999, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  bottomToast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 92 : 78,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomToastSuccess: { backgroundColor: COLORS.primary },
  bottomToastError: { backgroundColor: COLORS.danger },
  bottomToastText: { flex: 1, fontSize: 14, fontWeight: "900", color: "#fff" },
});