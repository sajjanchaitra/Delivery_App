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
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");
const SHOP_CARD_WIDTH = (width - 52) / 2;
const API_URL = "http://13.203.206.134:5000";

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath}`;
};

interface Category {
  _id?: string;
  id: string;
  name: string;
  image?: string | null;
  itemCount?: number;
}

interface Store {
  _id: string;
  name: string;
  image?: string;
  logo?: string;
  deliveryTime?: string;
  isOpen?: boolean;
  rating?: { average?: number; count?: number };
  distance?: string;
  address?: string;
  productCount?: number;
}

interface Product {
  _id: string;
  name: string;
  images?: string[];
  price: number;
  discountPrice?: number | null;
  salePrice?: number;
  quantity?: string | number;
  unit?: string;
  inStock?: boolean;
  stock?: number;
  store?: { _id: string; name: string; isOpen?: boolean };
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const banners: Banner[] = [
    { id: 1, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800", title: "Fresh Groceries", subtitle: "30% OFF" },
    { id: 2, image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800", title: "Daily Essentials", subtitle: "Best Deals" },
    { id: 3, image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800", title: "Quick Delivery", subtitle: "Order Now" },
  ];

  useEffect(() => {
    initializeScreen();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCartCount();
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % banners.length;
        bannerScrollRef.current?.scrollTo({ x: nextSlide * (width - 40), animated: true });
        return nextSlide;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const initializeScreen = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUserProfile(), fetchLocation(), fetchAllData(), fetchCartCount()]);
    } catch (error) {
      console.error("Error initializing screen:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) { setUserName("Guest"); return; }
      const response = await fetch(`${API_URL}/api/customer/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) {
        const user = data.customer || data.user || data.profile;
        if (user && user.name) setUserName(user.name);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setUserName("Guest");
    }
  };

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocationText("Location access denied"); return; }
      setLocationText("Getting location...");
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const address = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (address && address[0]) {
        const { city, district, subregion, region, street, name } = address[0];
        const primaryLocation = street || name || district || subregion || city || "Unknown";
        const secondaryLocation = city || district || region || "";
        setLocationText(primaryLocation === secondaryLocation || !secondaryLocation ? primaryLocation : `${primaryLocation}, ${secondaryLocation}`);
        await AsyncStorage.setItem("userLocation", JSON.stringify({ latitude: location.coords.latitude, longitude: location.coords.longitude, address: address[0] }));
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setLocationText("Unable to get location");
    }
  };

  const fetchCartCount = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) { setCartCount(0); return; }
      const response = await fetch(`${API_URL}/api/cart`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success && data.cart && data.cart.items) {
        setCartCount(data.cart.items.reduce((acc: number, item: { quantity?: number }) => acc + (item.quantity || 1), 0));
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
      setCartCount(0);
    }
  };

  const fetchAllData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [categoriesRes, storesRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/api/customer/categories`, { headers }),
        fetch(`${API_URL}/api/customer/stores?limit=6`, { headers }),
        fetch(`${API_URL}/api/customer/products?limit=10`, { headers }),
      ]);

      const [categoriesData, storesData, productsData] = await Promise.all([categoriesRes.json(), storesRes.json(), productsRes.json()]);

      console.log("Categories response:", categoriesData);
      console.log("Stores response:", storesData);
      console.log("Products response:", productsData);

      if (categoriesData.success && categoriesData.categories) setCategories(categoriesData.categories);
      if (storesData.success && storesData.stores) setStores(storesData.stores);
      if (productsData.success && productsData.products) setProducts(productsData.products);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load data. Please check your connection.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    await fetchCartCount();
    setRefreshing(false);
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
        setCartCount((prev) => prev + 1);
        Alert.alert("Success", `${product.name} added to cart!`);
      } else {
        Alert.alert("Error", data.message || data.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add to cart. Please try again.");
    }
  };

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
    setCurrentSlide(slideIndex);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22C55E"]} tintColor="#22C55E" />}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.locationContainer} onPress={fetchLocation} activeOpacity={0.7}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={20} color="#22C55E" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Deliver to</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationAddress} numberOfLines={1}>{locationText}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.7} onPress={() => router.push("/(customer)/profile" as any)}>
            <Ionicons name="person-circle-outline" size={32} color="#22C55E" />
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <Text style={styles.welcomeText}>
          <Text>Hello, </Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text> 👋</Text>
        </Text>

        {/* Search */}
        <TouchableOpacity style={styles.searchContainer} activeOpacity={0.7} onPress={() => router.push("/(customer)/search" as any)}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <Text style={styles.searchPlaceholder}>Search products, stores...</Text>
          <View style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#1E293B" />
          </View>
        </TouchableOpacity>

        {/* Banner Slider */}
        <View style={styles.bannerContainer}>
          <ScrollView ref={bannerScrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleBannerScroll} scrollEventThrottle={16}>
            {banners.map((banner) => (
              <TouchableOpacity key={banner.id} style={styles.promoBanner} activeOpacity={0.9}>
                <Image source={{ uri: banner.image }} style={styles.bannerImage} />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  <TouchableOpacity style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>Order now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.promoDots}>
            {banners.map((_, index) => (
              <View key={index} style={[styles.dot, currentSlide === index && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No categories available</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
              {categories.map((category, index) => (
                <TouchableOpacity key={category.id || category._id || `cat-${index}`} style={styles.categoryItem} activeOpacity={0.7}
                  onPress={() => router.push({ pathname: "/(customer)/categories", params: { categoryId: category.id || category._id || category.name, categoryName: category.name } } as any)}>
                  <View style={styles.categoryImageContainer}>
                    <Image source={{ uri: getImageUrl(category.image) }} style={styles.categoryImage} />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.itemCount || 0} items</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Stores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shops Near You</Text>
            {stores.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(customer)/stores" as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
          {stores.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No stores available yet</Text>
            </View>
          ) : (
            <View style={styles.shopsGrid}>
              {stores.slice(0, 4).map((store) => (
                <TouchableOpacity key={store._id} style={styles.shopCard} activeOpacity={0.8}
                  onPress={() => router.push({ pathname: "/(customer)/store-details", params: { storeId: store._id } } as any)}>
                  <Image source={{ uri: getImageUrl(store.image || store.logo) }} style={styles.shopImage} />
                  <View style={styles.deliveryBadge}>
                    <Ionicons name="bicycle" size={12} color="#FFFFFF" />
                    <Text style={styles.deliveryText}>{store.deliveryTime || "20-30 min"}</Text>
                  </View>
                  {store.isOpen !== false && (
                    <View style={styles.openBadge}>
                      <Text style={styles.openText}>OPEN</Text>
                    </View>
                  )}
                  <View style={styles.shopInfo}>
                    <Text style={styles.shopName} numberOfLines={1}>{store.name}</Text>
                    <View style={styles.shopMeta}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.shopRating}>{store.rating?.average?.toFixed(1) || "4.5"}</Text>
                      <Text style={styles.shopDot}>•</Text>
                      <Text style={styles.shopDistance}>{store.productCount || 0} products</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Products */}
        {products.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(customer)/categories" as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsContainer}>
              {products.map((product) => {
                const finalPrice = product.discountPrice || product.salePrice || product.price;
                const hasDiscount = (product.discountPrice && product.discountPrice < product.price) || (product.salePrice && product.salePrice < product.price);
                const discountPercent = hasDiscount ? Math.round(((product.price - finalPrice) / product.price) * 100) : 0;

                return (
                  <TouchableOpacity key={product._id} style={styles.productCard} activeOpacity={0.8}
                    onPress={() => router.push({ pathname: "/(customer)/product-details", params: { productId: product._id } } as any)}>
                    <View style={styles.productImageContainer}>
                      <Image source={{ uri: getImageUrl(product.images?.[0]) }} style={styles.productImage} />
                      {discountPercent > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                      {product.store && product.store.name ? (
                        <Text style={styles.productStore} numberOfLines={1}>{product.store.name}</Text>
                      ) : null}
                      <View style={styles.productFooter}>
                        <View style={styles.priceContainer}>
                          <Text style={styles.productPrice}>₹{finalPrice}</Text>
                          {hasDiscount ? <Text style={styles.originalPrice}>₹{product.price}</Text> : null}
                        </View>
                        <TouchableOpacity
                          style={[styles.addButton, product.inStock === false && styles.addButtonDisabled]}
                          activeOpacity={0.7}
                          onPress={(e) => { e.stopPropagation(); if (product.inStock !== false) addToCart(product); }}
                          disabled={product.inStock === false}>
                          <Ionicons name={product.inStock === false ? "close" : "add"} size={18} color="#FFFFFF" />
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

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="home" size={24} color="#22C55E" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push("/(customer)/orders" as any)}>
          <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push("/(customer)/cart" as any)}>
          <View style={styles.cartIconContainer}>
            <Ionicons name="cart-outline" size={24} color="#94A3B8" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? "99+" : String(cartCount)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push("/(customer)/profile" as any)}>
          <Ionicons name="person-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  locationContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  locationIcon: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 12, color: "#64748B" },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationAddress: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginTop: 2, flex: 1 },
  profileButton: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  welcomeText: { fontSize: 16, color: "#64748B", marginBottom: 16 },
  userName: { fontWeight: "700", color: "#1E293B" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, paddingHorizontal: 14, height: 48, marginBottom: 20 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: "#94A3B8", marginLeft: 10 },
  filterButton: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
  bannerContainer: { marginBottom: 24, borderRadius: 16, overflow: "hidden" },
  promoBanner: { width: width - 40, height: 160 },
  bannerImage: { width: "100%", height: "100%", resizeMode: "cover", borderRadius: 16 },
  bannerOverlay: { position: "absolute", left: 20, top: 20, bottom: 20, justifyContent: "center" },
  bannerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", marginBottom: 4, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  bannerSubtitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginBottom: 12, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  bannerButton: { backgroundColor: "#1E293B", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignSelf: "flex-start" },
  bannerButtonText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  promoDots: { position: "absolute", bottom: 12, right: 16, flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: "#FFFFFF", width: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  seeAll: { fontSize: 14, fontWeight: "500", color: "#22C55E" },
  categoriesContainer: { paddingTop: 8, gap: 16 },
  categoryItem: { alignItems: "center", width: 80 },
  categoryImageContainer: { width: 70, height: 70, borderRadius: 35, overflow: "hidden", marginBottom: 8, backgroundColor: "#F8FAFC", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  categoryImage: { width: "100%", height: "100%", resizeMode: "cover" },
  categoryName: { fontSize: 13, fontWeight: "600", color: "#1E293B", textAlign: "center" },
  categoryCount: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#94A3B8", marginTop: 12 },
  shopsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  shopCard: { width: SHOP_CARD_WIDTH, marginBottom: 16, borderRadius: 12, overflow: "hidden", backgroundColor: "#FFFFFF", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  shopImage: { width: "100%", height: 120, resizeMode: "cover" },
  deliveryBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  deliveryText: { fontSize: 10, fontWeight: "600", color: "#FFFFFF" },
  openBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "#22C55E", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  openText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  shopInfo: { paddingVertical: 10, paddingHorizontal: 10 },
  shopName: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  shopMeta: { flexDirection: "row", alignItems: "center" },
  shopRating: { fontSize: 12, fontWeight: "600", color: "#1E293B", marginLeft: 2 },
  shopDot: { fontSize: 12, color: "#CBD5E1", marginHorizontal: 6 },
  shopDistance: { fontSize: 12, color: "#64748B" },
  productsContainer: { gap: 12 },
  productCard: { width: 160, backgroundColor: "#FFFFFF", borderRadius: 12, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  productImageContainer: { width: "100%", height: 120, position: "relative" },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  discountBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "#EF4444", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: "600", color: "#1E293B", marginBottom: 2, minHeight: 32 },
  productStore: { fontSize: 11, color: "#64748B", marginBottom: 6 },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  productPrice: { fontSize: 15, fontWeight: "700", color: "#22C55E" },
  originalPrice: { fontSize: 11, color: "#94A3B8", textDecorationLine: "line-through" },
  addButton: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  addButtonDisabled: { backgroundColor: "#CBD5E1" },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#FFFFFF", paddingTop: 12, paddingBottom: 28, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: "#F1F5F9", alignItems: "center", justifyContent: "space-around" },
  navItem: { alignItems: "center", gap: 4 },
  navLabel: { fontSize: 12, fontWeight: "500", color: "#94A3B8" },
  navLabelActive: { color: "#22C55E", fontWeight: "600" },
  cartIconContainer: { position: "relative" },
  cartBadge: { position: "absolute", top: -6, right: -10, backgroundColor: "#EF4444", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  cartBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
});