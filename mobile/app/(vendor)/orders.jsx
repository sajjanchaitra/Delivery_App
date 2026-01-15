import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const tabs = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
];

const dummyOrders = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customer: "John Doe",
    phone: "+91 98765 43210",
    address: "123, Main Street, Bangalore",
    items: [
      { name: "Fresh Tomatoes", qty: 2, unit: "kg", price: 70 },
      { name: "Organic Bananas", qty: 1, unit: "dozen", price: 60 },
    ],
    total: 130,
    status: "pending",
    time: "2 min ago",
    paymentMethod: "COD",
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    customer: "Jane Smith",
    phone: "+91 87654 32109",
    address: "456, Park Avenue, Bangalore",
    items: [
      { name: "Fresh Milk", qty: 2, unit: "L", price: 130 },
      { name: "Brown Eggs", qty: 1, unit: "dozen", price: 80 },
    ],
    total: 210,
    status: "preparing",
    time: "10 min ago",
    paymentMethod: "Online",
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    customer: "Mike Johnson",
    phone: "+91 76543 21098",
    address: "789, Lake View, Bangalore",
    items: [
      { name: "Whole Wheat Bread", qty: 2, unit: "pack", price: 90 },
    ],
    total: 90,
    status: "ready",
    time: "25 min ago",
    paymentMethod: "Online",
  },
  {
    id: "4",
    orderNumber: "ORD-004",
    customer: "Sarah Wilson",
    phone: "+91 65432 10987",
    address: "321, Green Park, Bangalore",
    items: [
      { name: "Fresh Tomatoes", qty: 1, unit: "kg", price: 35 },
      { name: "Organic Bananas", qty: 2, unit: "dozen", price: 120 },
      { name: "Fresh Milk", qty: 1, unit: "L", price: 65 },
    ],
    total: 220,
    status: "completed",
    time: "1 hour ago",
    paymentMethod: "COD",
  },
];

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return { bg: "#FEF3C7", text: "#D97706", icon: "time" };
    case "preparing":
      return { bg: "#DBEAFE", text: "#2563EB", icon: "restaurant" };
    case "ready":
      return { bg: "#DCFCE7", text: "#16A34A", icon: "checkmark-circle" };
    case "completed":
      return { bg: "#F3F4F6", text: "#6B7280", icon: "checkbox" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280", icon: "help-circle" };
  }
};

const getNextStatus = (currentStatus) => {
  switch (currentStatus) {
    case "pending":
      return "preparing";
    case "preparing":
      return "ready";
    case "ready":
      return "completed";
    default:
      return null;
  }
};

const getActionLabel = (status) => {
  switch (status) {
    case "pending":
      return "Start Preparing";
    case "preparing":
      return "Mark Ready";
    case "ready":
      return "Complete Order";
    default:
      return null;
  }
};

export default function VendorOrders() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState(dummyOrders);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) => order.status === activeTab);

  const updateOrderStatus = (orderId) => {
    setOrders(
      orders.map((order) => {
        if (order.id === orderId) {
          const nextStatus = getNextStatus(order.status);
          if (nextStatus) {
            return { ...order, status: nextStatus };
          }
        }
        return order;
      })
    );
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.id !== "all" && tab.id !== "completed" && (
              <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.id && styles.tabBadgeTextActive]}>
                  {orders.filter((o) => o.status === tab.id).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>No orders</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "all" ? "You don't have any orders yet" : `No ${activeTab} orders`}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusColor = getStatusColor(order.status);
            const isExpanded = expandedOrder === order.id;
            const actionLabel = getActionLabel(order.status);

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => toggleExpand(order.id)}
                activeOpacity={0.8}
              >
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View>
                    <View style={styles.orderNumberRow}>
                      <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                        <Ionicons name={statusColor.icon} size={12} color={statusColor.text} />
                        <Text style={[styles.statusText, { color: statusColor.text }]}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderTime}>{order.time}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#94A3B8"
                  />
                </View>

                {/* Customer Info */}
                <View style={styles.customerInfo}>
                  <Ionicons name="person" size={16} color="#64748B" />
                  <Text style={styles.customerName}>{order.customer}</Text>
                  <Text style={styles.paymentBadge}>{order.paymentMethod}</Text>
                </View>

                {/* Expanded Content */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Contact */}
                    <View style={styles.contactRow}>
                      <Ionicons name="call" size={14} color="#64748B" />
                      <Text style={styles.contactText}>{order.phone}</Text>
                    </View>
                    <View style={styles.contactRow}>
                      <Ionicons name="location" size={14} color="#64748B" />
                      <Text style={styles.contactText}>{order.address}</Text>
                    </View>

                    {/* Items */}
                    <View style={styles.itemsSection}>
                      <Text style={styles.itemsTitle}>Order Items</Text>
                      {order.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                          <Text style={styles.itemName}>
                            {item.name} x {item.qty} {item.unit}
                          </Text>
                          <Text style={styles.itemPrice}>₹{item.price}</Text>
                        </View>
                      ))}
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>₹{order.total}</Text>
                      </View>
                    </View>

                    {/* Action Button */}
                    {actionLabel && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => updateOrderStatus(order.id)}
                      >
                        <Text style={styles.actionButtonText}>{actionLabel}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Quick Info Footer */}
                {!isExpanded && (
                  <View style={styles.quickFooter}>
                    <Text style={styles.itemsCount}>{order.items.length} items</Text>
                    <Text style={styles.orderTotal}>₹{order.total}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    backgroundColor: "#FFF",
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#22C55E",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFF",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  tabBadgeTextActive: {
    color: "#FFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  orderTime: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  customerName: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
  },
  paymentBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  itemsSection: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    color: "#334155",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  quickFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  itemsCount: {
    fontSize: 13,
    color: "#64748B",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
});