// app/(customer)/product-details.tsx
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
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_URL = "http://13.203.206.134:5000";

interface Product {
  _id: string;
  name: string;
  description?: string;
  images?: string[];
  price: number;
  discountPrice?: number;
  salePrice?: number;
  quantity?: number;
  unit?: string;
  inStock?: boolean;
  stock?: number;
  category?: string;
  store?: {
    _id: string;
    name: string;
    isOpen?: boolean;
    rating?: { average?: number };
    phone?: string;
  };
}

export default function ProductDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.productId as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/customer/products/${productId}`, { headers });
      const data = await response.json();

      if (data.success && data.product) {
        setProduct(data.product);
      } else {
        Alert.alert("Error", data.error || "Product not found");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      Alert.alert("Error", "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Login Required", "Please login to add items to cart", [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/(auth)/login" as any) },
        ]);
        return;
      }

      setAddingToCart(true);
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product?._id, quantity: cartQuantity }),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", `${product?.name} added to cart!`, [
          { text: "Continue Shopping", style: "cancel" },
          { text: "Go to Cart", onPress: () => router.push("/(customer)/cart" as any) },
        ]);
      } else {
        Alert.alert("Error", data.message || data.error || "Failed to add to cart");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const incrementQuantity = () => {
    if (product?.stock && cartQuantity < product.stock) {
      setCartQuantity(prev => prev + 1);
    } else if (!product?.stock) {
      setCartQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (cartQuantity > 1) {
      setCartQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Product Not Found</Text>
        </View>
      </View>
    );
  }

  const finalPrice = product.discountPrice || product.salePrice || product.price;
  const hasDiscount = product.discountPrice || product.salePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - finalPrice) / product.price) * 100)
    : 0;
  const images = product.images?.length ? product.images : ["https://via.placeholder.com/400"];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => router.push("/(customer)/cart" as any)}>
          <Ionicons name="cart-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          <Image source={{ uri: images[selectedImage] }} style={styles.mainImage} />
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
          {product.inStock === false && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailContainer}>
            {images.map((img, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.thumbnail, selectedImage === index && styles.thumbnailActive]}
                onPress={() => setSelectedImage(index)}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          {product.unit && (
            <Text style={styles.productUnit}>{product.quantity} {product.unit}</Text>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₹{finalPrice}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.originalPrice}>₹{product.price}</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>Save ₹{product.price - finalPrice}</Text>
                </View>
              </>
            )}
          </View>

          {/* Stock Status */}
          {product.inStock !== false && product.stock !== undefined && (
            <Text style={styles.stockText}>
              {product.stock > 10 ? "In Stock" : `Only ${product.stock} left in stock`}
            </Text>
          )}

          {/* Store Info */}
          {product.store && (
            <TouchableOpacity
              style={styles.storeCard}
              onPress={() => router.push({
                pathname: "/(customer)/store-details",
                params: { storeId: product.store!._id },
              } as any)}
            >
              <View style={styles.storeIcon}>
                <Ionicons name="storefront" size={24} color="#22C55E" />
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{product.store.name}</Text>
                <View style={styles.storeMetaRow}>
                  {product.store.rating?.average && (
                    <>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.storeRating}>{product.store.rating.average.toFixed(1)}</Text>
                    </>
                  )}
                  {product.store.isOpen !== false && (
                    <View style={styles.openIndicator}>
                      <View style={styles.openDot} />
                      <Text style={styles.openText}>Open</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          )}

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Category */}
          {product.category && (
            <View style={styles.categorySection}>
              <Text style={styles.sectionTitle}>Category</Text>
              <TouchableOpacity
                style={styles.categoryChip}
                onPress={() => router.push({
                  pathname: "/(customer)/categories",
                  params: { categoryId: product.category, categoryName: product.category },
                } as any)}
              >
                <Text style={styles.categoryText}>{product.category}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {product.inStock !== false && (
        <View style={styles.bottomBar}>
          <View style={styles.quantitySelector}>
            <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
              <Ionicons name="remove" size={20} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{cartQuantity}</Text>
            <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
              <Ionicons name="add" size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addToCartButton, addingToCart && styles.addToCartButtonDisabled]}
            onPress={addToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cart" size={20} color="#FFFFFF" />
                <Text style={styles.addToCartText}>Add to Cart • ₹{finalPrice * cartQuantity}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  cartButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  imageSection: { width: width, height: width * 0.8, position: "relative", backgroundColor: "#F8FAFC" },
  mainImage: { width: "100%", height: "100%", resizeMode: "contain" },
  discountBadge: { position: "absolute", top: 16, left: 16, backgroundColor: "#EF4444", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  discountText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  outOfStockBadge: { position: "absolute", bottom: 16, left: 16, right: 16, backgroundColor: "rgba(0,0,0,0.8)", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  outOfStockText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  thumbnailContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  thumbnail: { width: 60, height: 60, borderRadius: 8, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  thumbnailActive: { borderColor: "#22C55E" },
  thumbnailImage: { width: "100%", height: "100%", resizeMode: "cover" },
  productInfo: { padding: 20 },
  productName: { fontSize: 22, fontWeight: "700", color: "#1E293B", marginBottom: 8 },
  productUnit: { fontSize: 14, color: "#64748B", marginBottom: 12 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  currentPrice: { fontSize: 28, fontWeight: "700", color: "#22C55E" },
  originalPrice: { fontSize: 18, color: "#94A3B8", textDecorationLine: "line-through" },
  saveBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  saveText: { fontSize: 12, fontWeight: "600", color: "#D97706" },
  stockText: { fontSize: 14, color: "#F59E0B", marginBottom: 16 },
  storeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, padding: 14, marginBottom: 20 },
  storeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#DCFCE7", justifyContent: "center", alignItems: "center" },
  storeInfo: { flex: 1, marginLeft: 12 },
  storeName: { fontSize: 16, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  storeMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  storeRating: { fontSize: 13, fontWeight: "500", color: "#1E293B", marginLeft: 2 },
  openIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  openText: { fontSize: 12, color: "#22C55E", fontWeight: "500" },
  descriptionSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 8 },
  descriptionText: { fontSize: 14, color: "#64748B", lineHeight: 22 },
  categorySection: { marginBottom: 20 },
  categoryChip: { backgroundColor: "#F1F5F9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: "flex-start" },
  categoryText: { fontSize: 14, fontWeight: "500", color: "#64748B" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748B", marginTop: 16 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: "#F1F5F9", gap: 12 },
  quantitySelector: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 10, paddingHorizontal: 4 },
  quantityButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  quantityText: { fontSize: 16, fontWeight: "600", color: "#1E293B", paddingHorizontal: 12 },
  addToCartButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#22C55E", borderRadius: 12, paddingVertical: 14, gap: 8 },
  addToCartButtonDisabled: { backgroundColor: "#86EFAC" },
  addToCartText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});