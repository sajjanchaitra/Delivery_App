// app/(dash)/orders.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  customer?: {
    _id: string;
    name: string;
    phone?: string;
  };
  store?: {
    _id: string;
    name: string;
  };
  deliveryPartner?: {
    _id: string;
    name: string;
    phone?: string;
  };
  items: Array<{ _id: string; name: string; quantity: number; total: number }>;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  deliveryAddress?: {
    street: string;
    city: string;
    pincode: string;
  };
}

const filters = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function AdminOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [selectedFilter])
  );

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      let url = `${API_URL}/api/admin/orders?status=${selectedFilter}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("Orders data:", data);

      if (data.success) {
        setOrders(data.orders || []);
        setStatusCounts(data.statusCounts || {});
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, note?: string) => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, note }),
      });

      const data = await response.json();
      console.log("Update status response:", data);

      if (data.success) {
        Alert.alert("Success", `Order status updated to ${newStatus}`);
        setModalVisible(false);
        fetchOrders();
      } else {
        Alert.alert("Error", data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: "#F59E0B",
      confirmed: "#3B82F6",
      preparing: "#8B5CF6",
      ready: "#06B6D4",
      assigned: "#0EA5E9",
      picked_up: "#14B8A6",
      on_the_way: "#10B981",
      delivered: "#22C55E",
      cancelled: "#EF4444",
      refunded: "#EF4444",
    };
    return colors[status] || "#94A3B8";
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      preparing: "Preparing",
      ready: "Ready",
      assigned: "Assigned",
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address: any): string => {
    if (!address) return "N/A";
    if (typeof address === "string") return address;
    const parts = [address.street, address.city, address.pincode].filter(Boolean);
    return parts.join(", ");
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      {/* Header */}
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Orders</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchOrders}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); fetchOrders(); }}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
            onPress={() => {
              setSelectedFilter(filter.id);
              setLoading(true);
            }}
          >
            <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
              {filter.label}
            </Text>
            {statusCounts[filter.id] !== undefined && statusCounts[filter.id] > 0 && (
              <View style={[styles.filterBadge, selectedFilter === filter.id && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, selectedFilter === filter.id && styles.filterBadgeTextActive]}>
                  {statusCounts[filter.id]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrders();
            }}
            colors={["#22C55E"]}
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order._id}
              style={styles.orderCard}
              activeOpacity={0.8}
              onPress={() => openOrderDetails(order)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderLeft}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderTime}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderBody}>
                <View style={styles.orderInfo}>
                  <Ionicons name="storefront-outline" size={16} color="#64748B" />
                  <Text style={styles.orderInfoText}>{order.store?.name || "Store"}</Text>
                </View>
                <View style={styles.orderInfo}>
                  <Ionicons name="person-outline" size={16} color="#64748B" />
                  <Text style={styles.orderInfoText}>{order.customer?.name || "Customer"}</Text>
                </View>
                <View style={styles.orderInfo}>
                  <Ionicons name="cube-outline" size={16} color="#64748B" />
                  <Text style={styles.orderInfoText}>{order.items?.length || 0} items</Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.paymentInfo}>
                  <Ionicons name={order.paymentMethod === "cod" ? "cash" : "card"} size={16} color="#64748B" />
                  <Text style={styles.paymentText}>
                    {order.paymentMethod === "cod" ? "COD" : "Online"} • {order.paymentStatus}
                  </Text>
                </View>
                <Text style={styles.orderTotal}>₹{order.total}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Order Details Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalOrderHeader}>
                  <Text style={styles.modalOrderNumber}>{selectedOrder.orderNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedOrder.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                      {getStatusText(selectedOrder.status)}
                    </Text>
                  </View>
                </View>

                {/* Store & Customer */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Store</Text>
                  <Text style={styles.modalText}>{selectedOrder.store?.name || "N/A"}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Customer</Text>
                  <Text style={styles.modalText}>{selectedOrder.customer?.name || "N/A"}</Text>
                  <Text style={styles.modalTextSmall}>{selectedOrder.customer?.phone || "No phone"}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Delivery Address</Text>
                  <Text style={styles.modalText}>{formatAddress(selectedOrder.deliveryAddress)}</Text>
                </View>

                {selectedOrder.deliveryPartner && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Delivery Partner</Text>
                    <Text style={styles.modalText}>{selectedOrder.deliveryPartner.name}</Text>
                    <Text style={styles.modalTextSmall}>{selectedOrder.deliveryPartner.phone || "No phone"}</Text>
                  </View>
                )}

                {/* Items */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Items ({selectedOrder.items?.length || 0})</Text>
                  {selectedOrder.items?.map((item) => (
                    <View key={item._id} style={styles.modalItem}>
                      <Text style={styles.modalItemName}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={styles.modalItemPrice}>₹{item.total}</Text>
                    </View>
                  ))}
                </View>

                {/* Total */}
                <View style={styles.modalTotal}>
                  <Text style={styles.modalTotalLabel}>Total Amount</Text>
                  <Text style={styles.modalTotalAmount}>₹{selectedOrder.total}</Text>
                </View>

                {/* Status Update Buttons */}
                {!["delivered", "cancelled", "refunded"].includes(selectedOrder.status) && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Update Status</Text>
                    <View style={styles.statusButtons}>
                      {selectedOrder.status === "pending" && (
                        <>
                          <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: "#3B82F6" }]}
                            onPress={() => updateOrderStatus(selectedOrder._id, "confirmed")}
                            disabled={updating}
                          >
                            <Text style={styles.statusButtonText}>Confirm</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: "#EF4444" }]}
                            onPress={() => {
                              Alert.alert("Cancel Order", "Are you sure?", [
                                { text: "No", style: "cancel" },
                                { text: "Yes", onPress: () => updateOrderStatus(selectedOrder._id, "cancelled") },
                              ]);
                            }}
                            disabled={updating}
                          >
                            <Text style={styles.statusButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {selectedOrder.status === "confirmed" && (
                        <TouchableOpacity
                          style={[styles.statusButton, { backgroundColor: "#8B5CF6" }]}
                          onPress={() => updateOrderStatus(selectedOrder._id, "preparing")}
                          disabled={updating}
                        >
                          <Text style={styles.statusButtonText}>Mark Preparing</Text>
                        </TouchableOpacity>
                      )}
                      {selectedOrder.status === "preparing" && (
                        <TouchableOpacity
                          style={[styles.statusButton, { backgroundColor: "#06B6D4" }]}
                          onPress={() => updateOrderStatus(selectedOrder._id, "ready")}
                          disabled={updating}
                        >
                          <Text style={styles.statusButtonText}>Mark Ready</Text>
                        </TouchableOpacity>
                      )}
                      {["ready", "assigned", "picked_up", "on_the_way"].includes(selectedOrder.status) && (
                        <TouchableOpacity
                          style={[styles.statusButton, { backgroundColor: "#22C55E" }]}
                          onPress={() => updateOrderStatus(selectedOrder._id, "delivered")}
                          disabled={updating}
                        >
                          <Text style={styles.statusButtonText}>Mark Delivered</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: "#1E293B" },
  filtersScroll: { maxHeight: 60, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  filtersContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9", marginRight: 8, gap: 6 },
  filterChipActive: { backgroundColor: "#22C55E" },
  filterText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  filterTextActive: { color: "#FFF" },
  filterBadge: { backgroundColor: "#E2E8F0", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  filterBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  filterBadgeText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  filterBadgeTextActive: { color: "#FFF" },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, color: "#94A3B8", marginTop: 16 },
  orderCard: { backgroundColor: "#FFF", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  orderLeft: {},
  orderNumber: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  orderTime: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  orderBody: { gap: 8, marginBottom: 12 },
  orderInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderInfoText: { fontSize: 13, color: "#64748B" },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  paymentInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  paymentText: { fontSize: 12, color: "#64748B", textTransform: "capitalize" },
  orderTotal: { fontSize: 18, fontWeight: "700", color: "#22C55E" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  modalBody: { padding: 20 },
  modalOrderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalOrderNumber: { fontSize: 18, fontWeight: "700", color: "#22C55E" },
  modalSection: { marginBottom: 20 },
  modalSectionTitle: { fontSize: 14, fontWeight: "600", color: "#64748B", marginBottom: 8 },
  modalText: { fontSize: 14, color: "#1E293B", marginBottom: 4 },
  modalTextSmall: { fontSize: 13, color: "#94A3B8" },
  modalItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalItemName: { fontSize: 14, color: "#1E293B" },
  modalItemPrice: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  modalTotal: { flexDirection: "row", justifyContent: "space-between", paddingTop: 16, borderTopWidth: 1, borderTopColor: "#F1F5F9", marginBottom: 20 },
  modalTotalLabel: { fontSize: 16, fontWeight: "600", color: "#64748B" },
  modalTotalAmount: { fontSize: 20, fontWeight: "700", color: "#22C55E" },
  statusButtons: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statusButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  statusButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
});