// app/(customer)/cart.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath}`;
};

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images?: string[];
    price: number;
    discountPrice?: number | null;
    salePrice?: number | null;
    unit?: string;
    quantity?: number | string;
    inStock?: boolean;
  };
  quantity: number;
}

interface Cart {
  _id: string;
  items: CartItem[];
  store?: { _id: string; name: string };
}

export default function CartScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkAuthAndFetchCart();
    }, [])
  );

  const checkAuthAndFetchCart = async () => {
    const token = await AsyncStorage.getItem("authToken");
    setIsLoggedIn(!!token);
    if (token) {
      await fetchCart();
    } else {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) { setLoading(false); return; }

      const response = await fetch(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("Cart response:", data);

      if (data.success) {
        setCart(data.cart);
      } else {
        setCart(null);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      setUpdatingItem(productId);

      if (newQuantity <= 0) {
        const response = await fetch(`${API_URL}/api/cart/remove`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId }),
        });
        const data = await response.json();
        if (data.success) setCart(data.cart);
      } else {
        const response = await fetch(`${API_URL}/api/cart/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId, quantity: newQuantity }),
        });
        const data = await response.json();
        if (data.success) setCart(data.cart);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      Alert.alert("Error", "Failed to update cart");
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = (productId: string, productName: string) => {
    Alert.alert("Remove Item", `Remove ${productName} from cart?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => updateQuantity(productId, 0) },
    ]);
  };

  const clearCart = () => {
    Alert.alert("Clear Cart", "Remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("authToken");
            if (!token) return;
            const response = await fetch(`${API_URL}/api/cart/clear`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) setCart(null);
          } catch (error) {
            Alert.alert("Error", "Failed to clear cart");
          }
        },
      },
    ]);
  };

  const calculateSubtotal = (): number => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      const price = item.product.discountPrice || item.product.salePrice || item.product.price;
      return total + price * item.quantity;
    }, 0);
  };

  const calculateSavings = (): number => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      const originalPrice = item.product.price;
      const discountPrice = item.product.discountPrice || item.product.salePrice || item.product.price;
      return total + (originalPrice - discountPrice) * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const savings = calculateSavings();
  const deliveryFee = subtotal >= 500 ? 0 : 40;
  const total = subtotal + deliveryFee;

  const proceedToCheckout = () => {
    if (!cart?.items?.length) {
      Alert.alert("Empty Cart", "Please add items to your cart");
      return;
    }
    router.push("/(customer)/checkout" as any);
  };

  const hasItems = cart?.items && cart.items.length > 0;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        {hasItems ? (
          <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {!isLoggedIn ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Please Login</Text>
          <Text style={styles.emptyText}>Login to view your cart and place orders</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/(auth)/login" as any)}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      ) : !hasItems ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>Looks like you haven't added anything yet</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push("/(customer)/home" as any)}>
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCart(); }} colors={["#22C55E"]} />
            }
          >
            {cart.store ? (
              <TouchableOpacity
                style={styles.storeCard}
                onPress={() => router.push({ pathname: "/(customer)/store-details", params: { storeId: cart.store!._id } } as any)}
              >
                <Ionicons name="storefront" size={20} color="#22C55E" />
                <Text style={styles.storeCardName}>{cart.store.name}</Text>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            ) : null}

            <View style={styles.cartItems}>
              {cart.items.map((item) => {
                const price = item.product.discountPrice || item.product.salePrice || item.product.price;
                const hasDiscount = (item.product.discountPrice && item.product.discountPrice < item.product.price) || 
                                   (item.product.salePrice && item.product.salePrice < item.product.price);
                const isUpdating = updatingItem === item.product._id;

                return (
                  <View key={item._id} style={styles.cartItem}>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: "/(customer)/product-details", params: { productId: item.product._id } } as any)}
                    >
                      <Image source={{ uri: getImageUrl(item.product.images?.[0]) }} style={styles.itemImage} />
                    </TouchableOpacity>

                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                      {item.product.unit ? (
                        <Text style={styles.itemUnit}>{String(item.product.quantity)} {item.product.unit}</Text>
                      ) : null}
                      <View style={styles.itemPriceRow}>
                        <Text style={styles.itemPrice}>₹{String(price)}</Text>
                        {hasDiscount ? <Text style={styles.itemOriginalPrice}>₹{String(item.product.price)}</Text> : null}
                      </View>
                    </View>

                    <View style={styles.itemActions}>
                      <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.product._id, item.product.name)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>

                      <View style={styles.quantityControl}>
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#22C55E" />
                        ) : (
                          <>
                            <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.product._id, item.quantity - 1)}>
                              <Ionicons name="remove" size={16} color="#64748B" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{String(item.quantity)}</Text>
                            <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.product._id, item.quantity + 1)}>
                              <Ionicons name="add" size={16} color="#64748B" />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>

                      <Text style={styles.itemTotal}>₹{String(price * item.quantity)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{`Subtotal (${String(cart.items.length)} items)`}</Text>
                <Text style={styles.summaryValue}>₹{String(subtotal)}</Text>
              </View>

              {savings > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.savingsLabel}>You're Saving</Text>
                  <Text style={styles.savingsValue}>-₹{String(savings)}</Text>
                </View>
              ) : null}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeDelivery]}>
                  {deliveryFee === 0 ? "FREE" : `₹${String(deliveryFee)}`}
                </Text>
              </View>

              {subtotal < 500 ? (
                <Text style={styles.freeDeliveryHint}>{`Add ₹${String(500 - subtotal)} more for free delivery`}</Text>
              ) : null}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{String(total)}</Text>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          <View style={styles.bottomBar}>
            <View style={styles.bottomTotal}>
              <Text style={styles.bottomTotalLabel}>Total</Text>
              <Text style={styles.bottomTotalValue}>₹{String(total)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={proceedToCheckout}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  clearButton: { paddingHorizontal: 12, paddingVertical: 6 },
  clearText: { fontSize: 14, color: "#EF4444", fontWeight: "500" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1E293B", marginTop: 16 },
  emptyText: { fontSize: 14, color: "#64748B", textAlign: "center", marginTop: 8 },
  loginButton: { marginTop: 24, backgroundColor: "#22C55E", paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  loginButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  shopButton: { marginTop: 24, backgroundColor: "#22C55E", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  shopButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  scrollView: { flex: 1 },
  storeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 12, gap: 10 },
  storeCardName: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1E293B" },
  cartItems: { backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 12, borderRadius: 12, overflow: "hidden" },
  cartItem: { flexDirection: "row", padding: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  itemImage: { width: 70, height: 70, borderRadius: 8, resizeMode: "cover" },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  itemUnit: { fontSize: 12, color: "#94A3B8", marginBottom: 4 },
  itemPriceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemPrice: { fontSize: 15, fontWeight: "700", color: "#22C55E" },
  itemOriginalPrice: { fontSize: 12, color: "#94A3B8", textDecorationLine: "line-through" },
  itemActions: { alignItems: "flex-end", justifyContent: "space-between" },
  removeButton: { padding: 4 },
  quantityControl: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 8, marginVertical: 4 },
  qtyButton: { width: 28, height: 28, justifyContent: "center", alignItems: "center" },
  qtyText: { fontSize: 14, fontWeight: "600", color: "#1E293B", paddingHorizontal: 8 },
  itemTotal: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  summaryCard: { backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12 },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: "#64748B" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  savingsLabel: { fontSize: 14, color: "#22C55E" },
  savingsValue: { fontSize: 14, fontWeight: "600", color: "#22C55E" },
  freeDelivery: { color: "#22C55E" },
  freeDeliveryHint: { fontSize: 12, color: "#F59E0B", backgroundColor: "#FEF3C7", padding: 8, borderRadius: 6, marginBottom: 12, textAlign: "center" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  totalValue: { fontSize: 20, fontWeight: "700", color: "#22C55E" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: "#F1F5F9", gap: 16 },
  bottomTotal: { alignItems: "flex-start" },
  bottomTotalLabel: { fontSize: 12, color: "#64748B" },
  bottomTotalValue: { fontSize: 20, fontWeight: "700", color: "#1E293B" },
  checkoutButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#22C55E", borderRadius: 12, paddingVertical: 14, gap: 8 },
  checkoutText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});