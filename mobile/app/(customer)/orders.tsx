// app/(customer)/orders.tsx
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
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  items: Array<{ _id: string; name: string; quantity: number }>;
  total: number;
  store?: {
    _id: string;
    name: string;
    image?: string;
    logo?: string;
  };
}

const tabs = ["All", "Active", "Completed", "Cancelled"];

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath}`;
};

export default function OrdersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("All");

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("📦 Orders response:", data);

      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "delivered": return "#22C55E";
      case "confirmed": return "#3B82F6";
      case "preparing": return "#F59E0B";
      case "ready": return "#8B5CF6";
      case "assigned":
      case "picked_up":
      case "on_the_way": return "#06B6D4";
      case "cancelled":
      case "refunded": return "#EF4444";
      default: return "#94A3B8";
    }
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      preparing: "Preparing",
      ready: "Ready",
      assigned: "Driver Assigned",
      picked_up: "Picked Up",
      on_the_way: "On the Way",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getFilteredOrders = (): Order[] => {
    if (activeTab === "All") return orders;
    if (activeTab === "Active") return orders.filter((o) => ["pending", "confirmed", "preparing", "ready", "assigned", "picked_up", "on_the_way"].includes(o.status));
    if (activeTab === "Completed") return orders.filter((o) => o.status === "delivered");
    if (activeTab === "Cancelled") return orders.filter((o) => ["cancelled", "refunded"].includes(o.status));
    return orders;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={["#22C55E"]} />}
      >
        {filteredOrders.map((order) => (
          <TouchableOpacity
            key={order._id}
            style={styles.orderCard}
            activeOpacity={0.8}
            onPress={() => router.push({
              pathname: "/(customer)/order-details",
              params: { orderId: order._id },
            } as any)}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderIdContainer}>
                <Ionicons name="receipt-outline" size={16} color="#1E293B" />
                <Text style={styles.orderId}>{order.orderNumber}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {getStatusText(order.status)}
                </Text>
              </View>
            </View>

            <View style={styles.orderBody}>
              <Image
                source={{ uri: getImageUrl(order.store?.image || order.store?.logo) }}
                style={styles.storeImage}
              />

              <View style={styles.orderInfo}>
                <Text style={styles.storeName}>{order.store?.name || "Store"}</Text>
                <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                <Text style={styles.itemCount}>{order.items.length} items</Text>
              </View>

              <View style={styles.orderAmount}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹{order.total}</Text>
              </View>
            </View>

            <View style={styles.orderFooter}>
              {order.status === "delivered" && (
                <TouchableOpacity style={styles.reorderButton}>
                  <Ionicons name="refresh" size={16} color="#22C55E" />
                  <Text style={styles.reorderText}>Reorder</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.detailsButton, order.status !== "delivered" && { flex: 1 }]}
                onPress={() => router.push({
                  pathname: "/(customer)/order-details",
                  params: { orderId: order._id },
                } as any)}
              >
                <Text style={styles.detailsText}>
                  {["pending", "confirmed", "preparing", "ready", "assigned", "picked_up", "on_the_way"].includes(order.status)
                    ? "Track Order"
                    : "View Details"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {filteredOrders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyText}>
              {activeTab === "All" ? "You haven't placed any orders yet" : `No ${activeTab.toLowerCase()} orders`}
            </Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => router.push("/(customer)/home" as any)}>
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: "#FFFFFF" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", flex: 1, textAlign: "center" },
  placeholder: { width: 40 },
  tabsContainer: { backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  tabs: { paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F8FAFC" },
  tabActive: { backgroundColor: "#22C55E" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#FFFFFF" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  orderCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  orderIdContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderId: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600" },
  orderBody: { flexDirection: "row", marginBottom: 12 },
  storeImage: { width: 60, height: 60, borderRadius: 8, resizeMode: "cover" },
  orderInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  storeName: { fontSize: 15, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  orderDate: { fontSize: 12, color: "#94A3B8", marginBottom: 2 },
  itemCount: { fontSize: 12, color: "#64748B" },
  orderAmount: { alignItems: "flex-end", justifyContent: "center" },
  totalLabel: { fontSize: 11, color: "#94A3B8", marginBottom: 4 },
  totalAmount: { fontSize: 18, fontWeight: "700", color: "#22C55E" },
  orderFooter: { flexDirection: "row", gap: 12 },
  reorderButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F0FDF4", borderRadius: 8, paddingVertical: 10, gap: 6 },
  reorderText: { fontSize: 14, fontWeight: "600", color: "#22C55E" },
  detailsButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC", borderRadius: 8, paddingVertical: 10, gap: 6 },
  detailsText: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#94A3B8", textAlign: "center" },
  shopButton: { marginTop: 24, backgroundColor: "#22C55E", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  shopButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});