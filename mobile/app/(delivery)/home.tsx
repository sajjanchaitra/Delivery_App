// app/(delivery)/home.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

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

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "assigned" | "picked_up" | "on_the_way" | "delivered";

interface OrderPreview {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    name?: string;
    phone?: string;
  };
  customerName: string;
  customerPhone: string;
  store: {
    _id: string;
    name: string;
    address?: string;
  };
  deliveryAddress: {
    street?: string;
    houseNo?: string;
    area?: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  items: any[];
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  createdAt: string;
}

export default function DeliveryHome() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("Driver");
  const [activeOrders, setActiveOrders] = useState<OrderPreview[]>([]);
  const [availableOrders, setAvailableOrders] = useState<OrderPreview[]>([]);

  useEffect(() => {
    initializeScreen();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const initializeScreen = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDriverProfile(),
        fetchOrders(),
      ]);
    } catch (error) {
      console.error("Error initializing screen:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setDriverName("Driver");
        return;
      }

      const response = await fetch(`${API_URL}/api/delivery/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      console.log("📦 Driver profile:", data);
      
      if (data.success && data.profile) {
        setDriverName(data.profile.name || "Driver");
      }
    } catch (error) {
      console.error("Error fetching driver profile:", error);
      setDriverName("Driver");
    }
  };

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("❌ No auth token found");
        setActiveOrders([]);
        setAvailableOrders([]);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch my active orders
      const myOrdersResponse = await fetch(
        `${API_URL}/api/delivery/orders/my-orders`,
        { headers }
      );
      const myOrdersData = await myOrdersResponse.json();
      console.log("📦 My active orders:", myOrdersData);

      // Fetch available orders
      const availableResponse = await fetch(
        `${API_URL}/api/delivery/orders/available`,
        { headers }
      );
      const availableData = await availableResponse.json();
      console.log("📦 Available orders:", availableData);

      if (myOrdersData.success && myOrdersData.orders) {
        setActiveOrders(myOrdersData.orders.filter((o: OrderPreview) => o.status !== "delivered"));
      } else {
        setActiveOrders([]);
      }

      if (availableData.success && availableData.orders) {
        setAvailableOrders(availableData.orders);
      } else {
        setAvailableOrders([]);
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      setActiveOrders([]);
      setAvailableOrders([]);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      console.log("📦 Accepting order:", orderId);

      const response = await fetch(`${API_URL}/api/delivery/orders/${orderId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("✅ Accept response:", data);

      if (data.success) {
        Alert.alert("Success", "Order accepted successfully!");
        await fetchOrders();
      } else {
        Alert.alert("Error", data.message || "Failed to accept order");
      }
    } catch (error) {
      console.error("❌ Error accepting order:", error);
      Alert.alert("Error", "Failed to accept order");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "ready": return "#3B82F6";
      case "assigned": return "#F59E0B";
      case "picked_up": return "#8B5CF6";
      case "on_the_way": return COLORS.success;
      default: return "#94A3B8";
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "ready": return "Ready for Pickup";
      case "assigned": return "Assigned";
      case "picked_up": return "Picked Up";
      case "on_the_way": return "On the Way";
      case "delivered": return "Delivered";
      default: return status;
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return "Address not available";
    if (typeof address === "string") return address;
    
    const parts = [
      address.street || address.houseNo,
      address.area,
      address.landmark,
      address.city,
    ].filter(Boolean);
    
    return parts.join(", ") || "Address not available";
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, "#B91C1C"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {driverName}!</Text>
            <Text style={styles.subGreeting}>Ready to deliver?</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            activeOpacity={0.7}
            onPress={() => router.push("/(delivery)/profile" as any)}
          >
            <Ionicons name="person-circle-outline" size={36} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Active Deliveries */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Active Deliveries</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeOrders.length}</Text>
              </View>
            </View>

            {activeOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                style={[styles.orderCard, styles.activeOrderCard]}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: "/(delivery)/order-details" as any,
                  params: { orderId: order._id }
                })}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.orderNumber}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(order.status)}20` }
                  ]}>
                    <Text style={[
                      styles.statusText2,
                      { color: getStatusColor(order.status) }
                    ]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderBody}>
                  <View style={styles.orderRoute}>
                    <View style={styles.routeItem}>
                      <View style={styles.routeDot} />
                      <View style={styles.routeInfo}>
                        <Text style={styles.routeLabel}>Pickup</Text>
                        <Text style={styles.routeText} numberOfLines={1}>
                          {order.store?.name || "Store"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.routeLine} />

                    <View style={styles.routeItem}>
                      <View style={[styles.routeDot, styles.routeDotDelivery]} />
                      <View style={styles.routeInfo}>
                        <Text style={styles.routeLabel}>Delivery</Text>
                        <Text style={styles.routeText} numberOfLines={1}>
                          {formatAddress(order.deliveryAddress)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.orderFooter}>
                    <View style={styles.customerInfo}>
                      <Ionicons name="person" size={16} color={COLORS.textLight} />
                      <Text style={styles.customerText}>{order.customerName}</Text>
                    </View>
                    <Text style={styles.orderAmount}>₹{order.total}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.detailsButton}
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: "/(delivery)/order-details" as any,
                    params: { orderId: order._id }
                  })}
                >
                  <Ionicons name="information-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.detailsText}>View Details</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Available Orders */}
        {availableOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Orders</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(delivery)/orders" as any)}
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {availableOrders.slice(0, 5).map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.orderNumber}</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>

                <View style={styles.orderInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="storefront" size={16} color={COLORS.textLight} />
                    <Text style={styles.infoText}>{order.store?.name || "Store"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={16} color={COLORS.textLight} />
                    <Text style={styles.infoText}>{order.customerName || "Customer"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color={COLORS.textLight} />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {formatAddress(order.deliveryAddress)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  <Text style={styles.earningsText}>
                    Earn ₹{order.deliveryFee}
                  </Text>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    activeOpacity={0.7}
                    onPress={() => acceptOrder(order._id)}
                  >
                    <Text style={styles.acceptText}>Accept Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {availableOrders.length === 0 && activeOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No orders available</Text>
            <Text style={styles.emptyText}>
              New delivery requests will appear here
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="home" size={24} color={COLORS.primary} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/orders" as any)}
        >
          <Ionicons name="list" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/profile" as any)}
        >
          <Ionicons name="person" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textLight,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  profileButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeOrderCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText2: {
    fontSize: 12,
    fontWeight: "600",
  },
  newBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  orderBody: {
    marginBottom: 12,
  },
  orderRoute: {
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    marginTop: 4,
    marginRight: 12,
  },
  routeDotDelivery: {
    backgroundColor: COLORS.danger,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 5,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  routeText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customerText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  detailsText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  orderInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    flex: 1,
  },
  orderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  earningsText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.success,
  },
  acceptButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: COLORS.card,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});