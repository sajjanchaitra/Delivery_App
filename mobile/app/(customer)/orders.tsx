// app/(customer)/orders.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Order = {
  id: string;
  status: string;
  date: string;
  items: number;
  total: number;
  storeName: string;
  storeImage: string;
};

const orders: Order[] = [
  {
    id: "ORD12345",
    status: "delivered",
    date: "Jan 15, 2026",
    items: 3,
    total: 1299,
    storeName: "Westside Market",
    storeImage: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300",
  },
  {
    id: "ORD12344",
    status: "confirmed",
    date: "Jan 19, 2026",
    items: 5,
    total: 899,
    storeName: "Green Mart",
    storeImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300",
  },
  {
    id: "ORD12343",
    status: "preparing",
    date: "Jan 18, 2026",
    items: 2,
    total: 549,
    storeName: "Fresh Basket",
    storeImage: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300",
  },
  {
    id: "ORD12342",
    status: "cancelled",
    date: "Jan 14, 2026",
    items: 4,
    total: 1099,
    storeName: "Daily Needs",
    storeImage: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=300",
  },
];

const tabs: string[] = ["All", "Ongoing", "Completed", "Cancelled"];

export default function OrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("All");

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "delivered":
        return "#22C55E";
      case "confirmed":
        return "#3B82F6";
      case "preparing":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#94A3B8";
    }
  };

  const getStatusText = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getFilteredOrders = (): Order[] => {
    if (activeTab === "All") return orders;
    if (activeTab === "Ongoing") return orders.filter(o => 
      ["confirmed", "preparing"].includes(o.status)
    );
    if (activeTab === "Completed") return orders.filter(o => o.status === "delivered");
    if (activeTab === "Cancelled") return orders.filter(o => o.status === "cancelled");
    return orders;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {getFilteredOrders().map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            activeOpacity={0.8}
            onPress={() => router.push({
              pathname: "/(customer)/order-details",
              params: { orderId: order.id }
            })}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderIdContainer}>
                <Ionicons name="receipt-outline" size={16} color="#1E293B" />
                <Text style={styles.orderId}>{order.id}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {getStatusText(order.status)}
                </Text>
              </View>
            </View>

            <View style={styles.orderBody}>
              <Image source={{ uri: order.storeImage }} style={styles.storeImage} />
              
              <View style={styles.orderInfo}>
                <Text style={styles.storeName}>{order.storeName}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
                <Text style={styles.itemCount}>{order.items} items</Text>
              </View>

              <View style={styles.orderAmount}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹{order.total}</Text>
              </View>
            </View>

            <View style={styles.orderFooter}>
              <TouchableOpacity 
                style={styles.reorderButton}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color="#22C55E" />
                <Text style={styles.reorderText}>Reorder</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.detailsButton}
                activeOpacity={0.7}
              >
                <Text style={styles.detailsText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {getFilteredOrders().length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyText}>
              {activeTab === "All" 
                ? "You haven't placed any orders yet" 
                : `No ${activeTab.toLowerCase()} orders`}
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabs: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
  },
  tabActive: {
    backgroundColor: "#22C55E",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderBody: {
    flexDirection: "row",
    marginBottom: 12,
  },
  storeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: "cover",
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  storeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 12,
    color: "#64748B",
  },
  orderAmount: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  totalLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22C55E",
  },
  orderFooter: {
    flexDirection: "row",
    gap: 12,
  },
  reorderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  reorderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
  },
  detailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
});