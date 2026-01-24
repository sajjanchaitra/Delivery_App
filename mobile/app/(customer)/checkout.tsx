// app/(customer)/checkout.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

interface Address {
  _id: string;
  name?: string; // home/work/other
  fullName?: string;
  phone?: string;
  houseNo?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
}

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images?: string[];
    price: number;
    discountPrice?: number;
    salePrice?: number;
    unit?: string;
    quantity?: number | string;
  };
  quantity: number;
}

interface Cart {
  _id: string;
  items: CartItem[];
  store?: {
    _id: string;
    name: string;
    deliverySettings?: {
      deliveryFee?: number;
      freeDeliveryAbove?: number;
      estimatedDeliveryTime?: string;
    };
  };
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: "cod", name: "Cash on Delivery", icon: "cash", description: "Pay when you receive" },
  { id: "online", name: "Online Payment", icon: "card", description: "UPI, Cards, Wallets" },
];

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath}`;
};

export default function CheckoutScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [cart, setCart] = useState<Cart | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<string>("cod");
  const [customerNote, setCustomerNote] = useState("");

  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchCart(), fetchAddresses(), loadUserData()]);
    setLoading(false);
  };

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || "");
        setUserPhone(user.phone || "");
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success && data.cart) {
        setCart(data.cart);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  // ✅ FIX: fetch addresses from correct backend route
  const fetchAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/address`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success && data.addresses) {
        setAddresses(data.addresses);

        const defaultAddr = data.addresses.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr._id);
        } else if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const calculateSubtotal = (): number => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      const price = item.product.discountPrice || item.product.salePrice || item.product.price;
      return total + price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const freeDeliveryThreshold = cart?.store?.deliverySettings?.freeDeliveryAbove || 500;
  const baseDeliveryFee = cart?.store?.deliverySettings?.deliveryFee || 40;
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee;
  const total = subtotal + deliveryFee;

  // Helper for UI label
  const getAddressTitle = (a: Address) => {
    const t = (a.name || "home").toLowerCase();
    if (t === "work") return "Work";
    if (t === "other") return "Other";
    return "Home";
  };

  const getAddressLine = (a: Address) => {
    const parts = [a.houseNo, a.area, a.landmark, a.city, a.state, a.pincode].filter(Boolean);
    return parts.join(", ");
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert("Address Required", "Please select a delivery address");
      return;
    }

    if (!cart?.items?.length) {
      Alert.alert("Empty Cart", "Your cart is empty");
      return;
    }

    const selectedAddr = addresses.find((a) => a._id === selectedAddress);
    if (!selectedAddr) {
      Alert.alert("Error", "Please select a valid address");
      return;
    }

    Alert.alert(
      "Confirm Order",
      `Deliver to: ${getAddressTitle(selectedAddr)}\nPayment: ${
        selectedPayment === "cod" ? "Cash on Delivery" : "Online"
      }\nTotal: ₹${total}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Place Order",
          onPress: async () => {
            setPlacing(true);

            try {
              const token = await AsyncStorage.getItem("authToken");
              if (!token) {
                Alert.alert("Error", "Please login to place order");
                return;
              }

              // ✅ FIX: send address in correct format backend expects
              const orderData = {
                deliveryAddress: {
                  houseNo: selectedAddr.houseNo || "",
                  area: selectedAddr.area || "",
                  landmark: selectedAddr.landmark || "",
                  city: selectedAddr.city || "",
                  state: selectedAddr.state || "",
                  pincode: selectedAddr.pincode || "",
                },
                customerPhone: userPhone,
                customerName: userName,
                customerNote: customerNote,
                paymentMethod: selectedPayment,
              };

              console.log("📦 Placing order:", orderData);

              const response = await fetch(`${API_URL}/api/orders`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(orderData),
              });

              const data = await response.json();
              console.log("📦 Order response:", data);

              if (data.success) {
                router.replace({
                  pathname: "/(customer)/order-success",
                  params: {
                    orderId: data.order._id,
                    orderNumber: data.order.orderNumber,
                    amount: total.toString(),
                  },
                } as any);
              } else {
                Alert.alert("Error", data.error || "Failed to place order");
              }
            } catch (error) {
              console.error("Error placing order:", error);
              Alert.alert("Error", "Failed to place order. Please try again.");
            } finally {
              setPlacing(false);
            }
          },
        },
      ]
    );
  };

  const selectedAddressData = addresses.find((a) => a._id === selectedAddress);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  if (!cart?.items?.length) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Cart is Empty</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push("/(customer)/home" as any)}>
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(customer)/addresses" as any)}>
              <Text style={styles.changeText}>{addresses.length > 0 ? "Change" : "Add"}</Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <TouchableOpacity style={styles.addAddressCard} onPress={() => router.push("/(customer)/add-address" as any)}>
              <Ionicons name="add-circle-outline" size={24} color="#22C55E" />
              <Text style={styles.addAddressText}>Add Delivery Address</Text>
            </TouchableOpacity>
          ) : (
            <>
              {selectedAddressData && (
                <View style={styles.addressCard}>
                  <View style={styles.addressHeader}>
                    <View style={styles.addressLabelContainer}>
                      <Ionicons
                        name={
                          getAddressTitle(selectedAddressData) === "Home"
                            ? "home"
                            : getAddressTitle(selectedAddressData) === "Work"
                            ? "briefcase"
                            : "location"
                        }
                        size={18}
                        color="#22C55E"
                      />
                      <Text style={styles.addressLabel}>{getAddressTitle(selectedAddressData)}</Text>
                    </View>

                    {selectedAddressData.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.addressText}>{getAddressLine(selectedAddressData)}</Text>
                </View>
              )}

              {addresses
                .filter((a) => a._id !== selectedAddress)
                .slice(0, 2)
                .map((addr) => (
                  <TouchableOpacity key={addr._id} style={styles.addressCardAlt} onPress={() => setSelectedAddress(addr._id)}>
                    <View style={styles.radioButton}>
                      <View style={styles.radioOuter} />
                    </View>
                    <View style={styles.addressContent}>
                      <View style={styles.addressLabelContainer}>
                        <Ionicons name="location" size={16} color="#64748B" />
                        <Text style={styles.addressLabelAlt}>{getAddressTitle(addr)}</Text>
                      </View>
                      <Text style={styles.addressTextAlt} numberOfLines={1}>
                        {getAddressLine(addr)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Order Summary ({cart.items.length} items)</Text>
          </View>

          <View style={styles.orderItemsCard}>
            {cart.store && (
              <View style={styles.storeHeader}>
                <Ionicons name="storefront" size={16} color="#22C55E" />
                <Text style={styles.storeHeaderText}>{cart.store.name}</Text>
              </View>
            )}

            {cart.items.map((item) => {
              const price = item.product.discountPrice || item.product.salePrice || item.product.price;
              return (
                <View key={item._id} style={styles.orderItem}>
                  <Image source={{ uri: getImageUrl(item.product.images?.[0]) }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    {item.product.unit && (
                      <Text style={styles.itemUnit}>
                        {item.product.quantity} {item.product.unit}
                      </Text>
                    )}
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{price * item.quantity}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Delivery Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleSmall}>Delivery Instructions (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Any special instructions for delivery..."
            placeholderTextColor="#94A3B8"
            value={customerNote}
            onChangeText={setCustomerNote}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentCard, selectedPayment === method.id && styles.paymentCardActive]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={styles.radioButton}>
                <View style={styles.radioOuter}>
                  {selectedPayment === method.id && <View style={styles.radioInner} />}
                </View>
              </View>

              <View style={[styles.paymentIconContainer, selectedPayment === method.id && styles.paymentIconActive]}>
                <Ionicons name={method.icon as any} size={20} color={selectedPayment === method.id ? "#22C55E" : "#64748B"} />
              </View>

              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentName, selectedPayment === method.id && styles.paymentNameActive]}>
                  {method.name}
                </Text>
                <Text style={styles.paymentDesc}>{method.description}</Text>
              </View>

              {selectedPayment === method.id && <Ionicons name="checkmark-circle" size={24} color="#22C55E" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal ({cart.items.length} items)</Text>
              <Text style={styles.billValue}>₹{subtotal}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={[styles.billValue, deliveryFee === 0 && styles.freeText]}>
                {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
              </Text>
            </View>

            {subtotal < freeDeliveryThreshold && (
              <Text style={styles.freeDeliveryHint}>Add ₹{freeDeliveryThreshold - subtotal} more for free delivery</Text>
            )}

            <View style={styles.divider} />

            <View style={styles.billRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalSection}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomTotal}>₹{total}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderButton, (placing || !selectedAddress) && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={placing || !selectedAddress}
        >
          {placing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  placeholder: { width: 40 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginTop: 16 },
  shopButton: { marginTop: 24, backgroundColor: "#22C55E", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  shopButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitleContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  stepText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  sectionTitleSmall: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 8 },
  changeText: { fontSize: 14, fontWeight: "600", color: "#22C55E" },
  addAddressCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: "#22C55E",
    borderStyle: "dashed",
    gap: 8,
  },
  addAddressText: { fontSize: 15, fontWeight: "600", color: "#22C55E" },
  addressCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, borderWidth: 2, borderColor: "#22C55E", marginBottom: 12 },
  addressCardAlt: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center" },
  addressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  addressLabelContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  addressLabel: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  addressLabelAlt: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  defaultBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  defaultText: { fontSize: 11, fontWeight: "600", color: "#22C55E" },
  addressText: { fontSize: 14, color: "#64748B", lineHeight: 20 },
  addressTextAlt: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
  radioButton: { marginRight: 12 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#E2E8F0", justifyContent: "center", alignItems: "center" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E" },
  addressContent: { flex: 1 },
  orderItemsCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12 },
  storeHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  storeHeaderText: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  orderItem: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  itemImage: { width: 50, height: 50, borderRadius: 8, resizeMode: "cover" },
  itemDetails: { flex: 1, marginLeft: 12, justifyContent: "center" },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 2 },
  itemUnit: { fontSize: 12, color: "#94A3B8", marginBottom: 2 },
  itemQuantity: { fontSize: 12, color: "#64748B" },
  itemPrice: { fontSize: 15, fontWeight: "700", color: "#22C55E", alignSelf: "center" },
  noteInput: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, fontSize: 14, color: "#1E293B", borderWidth: 1, borderColor: "#E2E8F0", minHeight: 60, textAlignVertical: "top" },
  paymentCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  paymentCardActive: { borderColor: "#22C55E", borderWidth: 2, backgroundColor: "#F0FDF4" },
  paymentIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", marginRight: 12 },
  paymentIconActive: { backgroundColor: "#DCFCE7" },
  paymentInfo: { flex: 1 },
  paymentName: { fontSize: 15, fontWeight: "600", color: "#1E293B", marginBottom: 2 },
  paymentNameActive: { color: "#22C55E" },
  paymentDesc: { fontSize: 12, color: "#94A3B8" },
  billCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
  billRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  billLabel: { fontSize: 14, color: "#64748B" },
  billValue: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  freeText: { color: "#22C55E" },
  freeDeliveryHint: { fontSize: 12, color: "#F59E0B", backgroundColor: "#FEF3C7", padding: 8, borderRadius: 6, marginBottom: 12, textAlign: "center" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#22C55E" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  totalSection: { alignItems: "flex-start" },
  bottomLabel: { fontSize: 12, color: "#64748B" },
  bottomTotal: { fontSize: 22, fontWeight: "700", color: "#1E293B" },
  placeOrderButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#22C55E", borderRadius: 12, paddingVertical: 16, gap: 8 },
  placeOrderButtonDisabled: { backgroundColor: "#94A3B8" },
  placeOrderText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
