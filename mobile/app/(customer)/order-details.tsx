// app/(customer)/order-details.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

interface OrderItem {
  _id: string;
  product?: { _id: string; name: string; images?: string[] };
  name: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  preparedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  estimatedDeliveryTime?: string;
  items: OrderItem[];
  store?: {
    _id: string;
    name: string;
    phone?: string;
    image?: string;
    logo?: string;
  };
  deliveryPartner?: {
    _id: string;
    name: string;
    phone?: string;
  };
  deliveryAddress: {
    street: string;
    landmark?: string;
    city: string;
    state?: string;
    pincode: string;
  };
  customerPhone: string;
  customerName: string;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  customerNote?: string;
  cancellationReason?: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath}`;
};

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (orderId) {
        fetchOrderDetails();
      }
    }, [orderId])
  );

  const fetchOrderDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        router.replace("/(auth)/login" as any);
        return;
      }

      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("📦 Order details:", data);

      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        Alert.alert("Error", data.error || "Order not found");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cancelOrder = () => {
    if (!order) return;

    if (!["pending", "confirmed"].includes(order.status)) {
      Alert.alert("Cannot Cancel", "This order cannot be cancelled at this stage");
      return;
    }

    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("authToken");
              const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: "Cancelled by customer" }),
              });
              const data = await response.json();

              if (data.success) {
                Alert.alert("Order Cancelled", "Your order has been cancelled");
                fetchOrderDetails();
              } else {
                Alert.alert("Error", data.error || "Failed to cancel order");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to cancel order");
            }
          },
        },
      ]
    );
  };

  const callStore = () => {
    if (order?.store?.phone) {
      Linking.openURL(`tel:${order.store.phone}`);
    }
  };

  const callDeliveryPartner = () => {
    if (order?.deliveryPartner?.phone) {
      Linking.openURL(`tel:${order.deliveryPartner.phone}`);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: "#F59E0B",
      confirmed: "#DC2626",
      preparing: "#DC2626",
      ready: "#DC2626",
      assigned: "#DC2626",
      picked_up: "#DC2626",
      on_the_way: "#DC2626",
      delivered: "#DC2626",
      cancelled: "#64748B",
      refunded: "#64748B",
    };
    return colors[status] || "#94A3B8";
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Order Placed",
      confirmed: "Confirmed",
      preparing: "Preparing",
      ready: "Ready for Pickup",
      assigned: "Driver Assigned",
      picked_up: "Picked Up",
      on_the_way: "On the Way",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusSteps = () => {
    const allSteps = [
      { id: "pending", name: "Order Placed", icon: "receipt" },
      { id: "confirmed", name: "Confirmed", icon: "checkmark-circle" },
      { id: "preparing", name: "Preparing", icon: "restaurant" },
      { id: "ready", name: "Ready", icon: "cube" },
      { id: "picked_up", name: "Picked Up", icon: "bicycle" },
      { id: "on_the_way", name: "On the Way", icon: "navigate" },
      { id: "delivered", name: "Delivered", icon: "home" },
    ];

    if (!order) return allSteps.map((s) => ({ ...s, completed: false, current: false }));

    if (order.status === "cancelled") {
      return [
        { id: "pending", name: "Order Placed", icon: "receipt", completed: true, current: false },
        { id: "cancelled", name: "Cancelled", icon: "close-circle", completed: true, current: true },
      ];
    }

    const statusOrder = ["pending", "confirmed", "preparing", "ready", "assigned", "picked_up", "on_the_way", "delivered"];
    const currentIndex = statusOrder.indexOf(order.status);

    return allSteps.map((step, index) => {
      const stepIndex = statusOrder.indexOf(step.id);
      return {
        ...step,
        completed: stepIndex <= currentIndex,
        current: step.id === order.status,
      };
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Order Not Found</Text>
        </View>
      </View>
    );
  }

  const statusSteps = getStatusSteps();
  const isActive = ["pending", "confirmed", "preparing", "ready", "assigned", "picked_up", "on_the_way"].includes(order.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrderDetails(); }} colors={["#DC2626"]} />}
      >
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderId}>{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>

          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            {statusSteps.map((step, index) => (
              <View key={step.id} style={styles.stepWrapper}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepIconContainer, step.completed && styles.stepIconCompleted, step.current && styles.stepIconCurrent]}>
                    <Ionicons name={step.icon as any} size={18} color={step.completed ? "#FFFFFF" : "#94A3B8"} />
                  </View>
                  <View style={styles.stepTextContainer}>
                    <Text style={[styles.stepName, step.completed && styles.stepNameCompleted]}>{step.name}</Text>
                    {step.current && order.estimatedDeliveryTime && (
                      <Text style={styles.stepTime}>{order.estimatedDeliveryTime}</Text>
                    )}
                  </View>
                </View>
                {index < statusSteps.length - 1 && (
                  <View style={[styles.stepLine, step.completed && styles.stepLineCompleted]} />
                )}
              </View>
            ))}
          </View>

          {order.status === "cancelled" && order.cancellationReason && (
            <View style={styles.cancellationReason}>
              <Ionicons name="information-circle" size={16} color="#64748B" />
              <Text style={styles.cancellationText}>Reason: {order.cancellationReason}</Text>
            </View>
          )}
        </View>

        {/* Store Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Details</Text>
          <View style={styles.storeCard}>
            <Image source={{ uri: getImageUrl(order.store?.image || order.store?.logo) }} style={styles.storeImage} />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{order.store?.name || "Store"}</Text>
              {order.estimatedDeliveryTime && (
                <View style={styles.storeMetaRow}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={styles.storeMetaText}>{order.estimatedDeliveryTime}</Text>
                </View>
              )}
            </View>
            {order.store?.phone && (
              <TouchableOpacity style={styles.callButton} onPress={callStore}>
                <Ionicons name="call" size={20} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Delivery Partner */}
        {order.deliveryPartner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Partner</Text>
            <View style={styles.storeCard}>
              <View style={styles.deliveryAvatar}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{order.deliveryPartner.name}</Text>
                <Text style={styles.storeMetaText}>Delivery Partner</Text>
              </View>
              {order.deliveryPartner.phone && (
                <TouchableOpacity style={styles.callButton} onPress={callDeliveryPartner}>
                  <Ionicons name="call" size={20} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({order.items.length})</Text>
          {order.items.map((item) => (
            <View key={item._id} style={styles.itemCard}>
              <Image source={{ uri: getImageUrl(item.image || item.product?.images?.[0]) }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name || item.product?.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price} × {item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.total}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressIconContainer}>
              <Ionicons name="location" size={20} color="#DC2626" />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>{order.customerName}</Text>
              <Text style={styles.addressText}>
                {order.deliveryAddress.street}
                {order.deliveryAddress.landmark ? `, ${order.deliveryAddress.landmark}` : ""}
              </Text>
              <Text style={styles.addressText}>
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              </Text>
              <Text style={styles.addressPhone}>{order.customerPhone}</Text>
            </View>
          </View>
        </View>

        {/* Customer Note */}
        {order.customerNote && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Instructions</Text>
            <View style={styles.noteCard}>
              <Ionicons name="document-text-outline" size={18} color="#64748B" />
              <Text style={styles.noteText}>{order.customerNote}</Text>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Subtotal</Text>
              <Text style={styles.paymentValue}>₹{order.subtotal}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Delivery Fee</Text>
              <Text style={[styles.paymentValue, order.deliveryFee === 0 && styles.freeText]}>
                {order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
              </Text>
            </View>
            {order.discount && order.discount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, styles.discountLabel]}>Discount</Text>
                <Text style={[styles.paymentValue, styles.discountValue]}>-₹{order.discount}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{order.total}</Text>
            </View>
            <View style={styles.paymentMethodRow}>
              <Ionicons name={order.paymentMethod === "cod" ? "cash" : "card"} size={16} color="#64748B" />
              <Text style={styles.paymentMethodText}>
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid Online"}
                {order.paymentStatus === "paid" && " • Paid"}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {isActive && ["pending", "confirmed"].includes(order.status) ? (
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelOrder}>
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trackButton}>
              <Ionicons name="navigate" size={20} color="#FFFFFF" />
              <Text style={styles.trackText}>Track Order</Text>
            </TouchableOpacity>
          </>
        ) : isActive ? (
          <TouchableOpacity style={[styles.trackButton, { flex: 1 }]}>
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.trackText}>Track Order</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.supportButton}>
              <Ionicons name="chatbubble-outline" size={20} color="#1E293B" />
              <Text style={styles.supportText}>Get Help</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => router.push({ pathname: "/(customer)/store-details", params: { storeId: order.store?._id } } as any)}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.reorderText}>Reorder</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", flex: 1, textAlign: "center" },
  helpButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  placeholder: { width: 40 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748B", marginTop: 16 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  statusCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 16 },
  statusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  orderId: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  orderDate: { fontSize: 13, color: "#94A3B8" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600" },
  stepsContainer: { paddingLeft: 4 },
  stepWrapper: { position: "relative" },
  stepItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  stepIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", marginRight: 12 },
  stepIconCompleted: { backgroundColor: "#DC2626" },
  stepIconCurrent: { backgroundColor: "#DC2626", borderWidth: 3, borderColor: "#FEE2E2" },
  stepTextContainer: { flex: 1 },
  stepName: { fontSize: 14, color: "#94A3B8" },
  stepNameCompleted: { color: "#1E293B", fontWeight: "600" },
  stepTime: { fontSize: 12, color: "#DC2626", marginTop: 2 },
  stepLine: { width: 2, height: 16, backgroundColor: "#E2E8F0", marginLeft: 17, marginBottom: 4 },
  stepLineCompleted: { backgroundColor: "#DC2626" },
  cancellationReason: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", padding: 12, borderRadius: 8, marginTop: 12, gap: 8 },
  cancellationText: { fontSize: 13, color: "#64748B", flex: 1 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 12 },
  storeCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, alignItems: "center" },
  storeImage: { width: 56, height: 56, borderRadius: 8, resizeMode: "cover" },
  deliveryAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#DC2626", justifyContent: "center", alignItems: "center" },
  storeInfo: { flex: 1, marginLeft: 12 },
  storeName: { fontSize: 15, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  storeMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  storeMetaText: { fontSize: 13, color: "#64748B" },
  callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center" },
  itemCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginBottom: 8, alignItems: "center" },
  itemImage: { width: 50, height: 50, borderRadius: 8, resizeMode: "cover" },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  itemPrice: { fontSize: 12, color: "#64748B" },
  itemTotal: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
  addressCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
  addressIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center", marginRight: 12 },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  addressText: { fontSize: 13, color: "#64748B", lineHeight: 20 },
  addressPhone: { fontSize: 13, color: "#64748B", marginTop: 4 },
  noteCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, gap: 10, alignItems: "flex-start" },
  noteText: { fontSize: 14, color: "#64748B", flex: 1 },
  paymentCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  paymentLabel: { fontSize: 14, color: "#64748B" },
  paymentValue: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  freeText: { color: "#DC2626" },
  discountLabel: { color: "#DC2626" },
  discountValue: { color: "#DC2626" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#DC2626" },
  paymentMethodRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  paymentMethodText: { fontSize: 13, color: "#64748B" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: "#F1F5F9", gap: 12 },
  cancelButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2", borderRadius: 12, paddingVertical: 14, gap: 8, borderWidth: 1, borderColor: "#FECACA" },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
  trackButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#DC2626", borderRadius: 12, paddingVertical: 14, gap: 8 },
  trackText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  supportButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC", borderRadius: 12, paddingVertical: 14, gap: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  supportText: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  reorderButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#DC2626", borderRadius: 12, paddingVertical: 14, gap: 8 },
  reorderText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
});