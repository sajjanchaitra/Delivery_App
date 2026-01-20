// app/(vendor)/orders.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_URL = "http://13.203.206.134:5000"; // Update with your backend URL


export default function VendorOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    fetchOrders();
  }, [selectedFilter]);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      // Use vendor route - GET /api/vendor/orders with status filter
      const url = `${API_URL}/api/vendor/orders?status=${selectedFilter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
        setFilteredOrders(data.orders || []);
        setStatusCounts(data.statusCounts || {});
      } else {
        Alert.alert("Error", data.error || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Failed to fetch orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, note = "") => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      // Use vendor route - PATCH /api/vendor/orders/:id/status
      const response = await fetch(
        `${API_URL}/api/vendor/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus, note }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Refresh orders list
        fetchOrders();
        Alert.alert("Success", `Order status updated to ${newStatus}`);
        setModalVisible(false);
      } else {
        Alert.alert("Error", data.error || "Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Failed to update order status");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { bg: "#FEF3C7", color: "#D97706", icon: "time" };
      case "confirmed":
        return { bg: "#DBEAFE", color: "#2563EB", icon: "checkmark-circle" };
      case "preparing":
        return { bg: "#E0E7FF", color: "#6366F1", icon: "restaurant" };
      case "ready":
        return { bg: "#D1FAE5", color: "#059669", icon: "cube" };
      case "out_for_delivery":
        return { bg: "#FDE68A", color: "#D97706", icon: "bicycle" };
      case "delivered":
        return { bg: "#F3F4F6", color: "#6B7280", icon: "checkmark-done" };
      case "cancelled":
        return { bg: "#FEE2E2", color: "#DC2626", icon: "close-circle" };
      default:
        return { bg: "#F3F4F6", color: "#6B7280", icon: "help-circle" };
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: "Confirm Order",
      confirmed: "Start Preparing",
      preparing: "Mark as Ready",
    };
    return labels[currentStatus] || "Update";
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "preparing", label: "Preparing" },
    { id: "ready", label: "Ready" },
    { id: "delivered", label: "Delivered" },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      {/* Header */}
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orders</Text>
          <View style={{ width: 44 }} />
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
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
            {statusCounts[filter.id] > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  selectedFilter === filter.id && styles.filterBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    selectedFilter === filter.id &&
                      styles.filterBadgeTextActive,
                  ]}
                >
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
            onRefresh={onRefresh}
            colors={["#22C55E"]}
          />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusStyle = getStatusStyle(order.status);
            return (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                onPress={() => openOrderDetails(order)}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderLeft}>
                    <View
                      style={[
                        styles.orderIcon,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Ionicons
                        name={statusStyle.icon}
                        size={20}
                        color={statusStyle.color}
                      />
                    </View>
                    <View>
                      <Text style={styles.orderNumber}>
                        Order #{order.orderNumber || order._id.slice(-6)}
                      </Text>
                      <Text style={styles.orderTime}>
                        {new Date(order.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusStyle.color }]}
                    >
                      {order.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderBody}>
                  {order.customer && (
                    <View style={styles.orderInfo}>
                      <Ionicons name="person-outline" size={16} color="#64748B" />
                      <Text style={styles.orderInfoText}>
                        {order.customer.name}
                      </Text>
                    </View>
                  )}
                  <View style={styles.orderInfo}>
                    <Ionicons name="cube-outline" size={16} color="#64748B" />
                    <Text style={styles.orderInfoText}>
                      {order.items?.length || 0} items
                    </Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>
                    ₹{order.total || order.totalAmount || 0}
                  </Text>
                  {["pending", "confirmed", "preparing"].includes(
                    order.status
                  ) && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        const nextStatus = getNextStatus(order.status);
                        if (nextStatus) {
                          updateOrderStatus(order._id, nextStatus);
                        }
                      }}
                    >
                      <Text style={styles.actionButtonText}>
                        {getNextStatusLabel(order.status)}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Order Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalOrderNumber}>
                  Order #
                  {selectedOrder.orderNumber || selectedOrder._id.slice(-6)}
                </Text>

                {/* Items */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Items</Text>
                  {selectedOrder.items?.map((item, index) => (
                    <View key={index} style={styles.modalItem}>
                      <Text style={styles.modalItemName}>
                        {item.quantity}x {item.name || item.product?.name}
                      </Text>
                      <Text style={styles.modalItemPrice}>
                        ₹{item.total || item.price * item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Customer */}
                {selectedOrder.customer && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Customer</Text>
                    <Text style={styles.modalText}>
                      {selectedOrder.customer.name}
                    </Text>
                    <Text style={styles.modalText}>
                      {selectedOrder.customer.phone}
                    </Text>
                  </View>
                )}

                {/* Delivery Address */}
                {selectedOrder.deliveryLocation && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Delivery Address
                    </Text>
                    <Text style={styles.modalText}>
                      {selectedOrder.deliveryLocation.address ||
                        selectedOrder.deliveryLocation.street}
                    </Text>
                  </View>
                )}

                {/* Total */}
                <View style={styles.modalTotal}>
                  <Text style={styles.modalTotalLabel}>Total Amount</Text>
                  <Text style={styles.modalTotalAmount}>
                    ₹{selectedOrder.total || selectedOrder.totalAmount}
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Action Buttons */}
            {selectedOrder &&
              ["pending", "confirmed", "preparing"].includes(
                selectedOrder.status
              ) && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      const nextStatus = getNextStatus(selectedOrder.status);
                      if (nextStatus) {
                        updateOrderStatus(selectedOrder._id, nextStatus);
                      }
                    }}
                  >
                    <LinearGradient
                      colors={["#22C55E", "#16A34A"]}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.modalButtonText}>
                        {getNextStatusLabel(selectedOrder.status)}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      Alert.alert(
                        "Cancel Order",
                        "Are you sure you want to cancel this order?",
                        [
                          { text: "No", style: "cancel" },
                          {
                            text: "Yes",
                            style: "destructive",
                            onPress: () =>
                              updateOrderStatus(
                                selectedOrder._id,
                                "cancelled",
                                "Cancelled by vendor"
                              ),
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.modalCancelButtonText}>
                      Cancel Order
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  filtersScroll: {
    maxHeight: 60,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFF",
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: "#22C55E",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  filterTextActive: {
    color: "#FFF",
  },
  filterBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  filterBadgeTextActive: {
    color: "#FFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 16,
  },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  orderTime: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  orderBody: {
    gap: 8,
    marginBottom: 12,
    paddingLeft: 52,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderInfoText: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  modalBody: {
    padding: 20,
  },
  modalOrderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  modalItemName: {
    fontSize: 14,
    color: "#1E293B",
  },
  modalItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  modalText: {
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 4,
  },
  modalTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  modalTotalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22C55E",
  },
  modalActions: {
    padding: 20,
    gap: 10,
  },
  modalButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  modalCancelButton: {
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },
});