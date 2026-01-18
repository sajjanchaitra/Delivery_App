import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Order status types
type OrderStatus = "delivered" | "in_progress" | "cancelled" | "pending";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  image: string;
};

type Order = {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  deliveryAddress: string;
  estimatedDelivery?: string;
};

// Dummy orders data
const ordersData: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    date: "14 Jan, 2025",
    status: "in_progress",
    totalAmount: 156,
    estimatedDelivery: "Today, 4:30 PM",
    deliveryAddress: "Home - Bengaluru",
    items: [
      {
        id: "1",
        name: "Bell Pepper Red",
        quantity: 2,
        image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=200",
      },
      {
        id: "2",
        name: "Organic Bananas",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200",
      },
    ],
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    date: "12 Jan, 2025",
    status: "delivered",
    totalAmount: 289,
    deliveryAddress: "Office - Whitefield",
    items: [
      {
        id: "3",
        name: "Fresh Vegetables",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200",
      },
      {
        id: "4",
        name: "Dairy Products",
        quantity: 3,
        image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200",
      },
      {
        id: "5",
        name: "Bread",
        quantity: 2,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200",
      },
    ],
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    date: "10 Jan, 2025",
    status: "delivered",
    totalAmount: 432,
    deliveryAddress: "Home - Bengaluru",
    items: [
      {
        id: "6",
        name: "Chicken",
        quantity: 2,
        image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200",
      },
    ],
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    date: "8 Jan, 2025",
    status: "cancelled",
    totalAmount: 178,
    deliveryAddress: "Home - Bengaluru",
    items: [
      {
        id: "7",
        name: "Snacks Pack",
        quantity: 4,
        image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200",
      },
    ],
  },
];

const tabs = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case "delivered":
      return {
        label: "Delivered",
        color: "#22C55E",
        bg: "#DCFCE7",
        icon: "checkmark-circle",
      };
    case "in_progress":
      return {
        label: "In Progress",
        color: "#F59E0B",
        bg: "#FEF3C7",
        icon: "time",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        color: "#EF4444",
        bg: "#FEE2E2",
        icon: "close-circle",
      };
    case "pending":
      return {
        label: "Pending",
        color: "#64748B",
        bg: "#F1F5F9",
        icon: "hourglass",
      };
    default:
      return {
        label: "Unknown",
        color: "#64748B",
        bg: "#F1F5F9",
        icon: "help-circle",
      };
  }
};

export default function Orders() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders =
    activeTab === "all"
      ? ordersData
      : ordersData.filter((order) => order.status === activeTab);

  const renderOrderCard = (order: Order) => {
    const statusConfig = getStatusConfig(order.status);

    return (
      <TouchableOpacity
        key={order.id}
        style={styles.orderCard}
        activeOpacity={0.8}
        onPress={() => {
          // Navigate to order details
          // router.push(`/(customer)/order/${order.id}`);
        }}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.orderDate}>{order.date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons
              name={statusConfig.icon as any}
              size={14}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Order Items Preview */}
        <View style={styles.itemsPreview}>
          <View style={styles.itemImages}>
            {order.items.slice(0, 3).map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemImageContainer,
                  { marginLeft: index > 0 ? -12 : 0, zIndex: 3 - index },
                ]}
              >
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              </View>
            ))}
            {order.items.length > 3 && (
              <View style={[styles.itemImageContainer, styles.moreItems]}>
                <Text style={styles.moreItemsText}>+{order.items.length - 3}</Text>
              </View>
            )}
          </View>
          <View style={styles.itemsInfo}>
            <Text style={styles.itemsCount}>
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </Text>
            <Text style={styles.itemsList} numberOfLines={1}>
              {order.items.map((item) => item.name).join(", ")}
            </Text>
          </View>
        </View>

        {/* Estimated Delivery (for in-progress orders) */}
        {order.status === "in_progress" && order.estimatedDelivery && (
          <View style={styles.deliveryInfo}>
            <Ionicons name="bicycle" size={16} color="#F59E0B" />
            <Text style={styles.deliveryText}>
              Expected: {order.estimatedDelivery}
            </Text>
          </View>
        )}

        {/* Order Footer */}
        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
          </View>
          <View style={styles.actionButtons}>
            {order.status === "delivered" && (
              <TouchableOpacity style={styles.reorderButton} activeOpacity={0.7}>
                <Ionicons name="refresh" size={16} color="#4A90FF" />
                <Text style={styles.reorderText}>Reorder</Text>
              </TouchableOpacity>
            )}
            {order.status === "in_progress" && (
              <TouchableOpacity style={styles.trackButton} activeOpacity={0.7}>
                <Ionicons name="location" size={16} color="#FFFFFF" />
                <Text style={styles.trackText}>Track</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
          <Ionicons name="search" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredOrders.map(renderOrderCard)}
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={80} color="#E2E8F0" />
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === "all"
              ? "You haven't placed any orders yet"
              : `No ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} orders`}
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push("/(customer)/home")}
            activeOpacity={0.8}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(customer)/home")}
        >
          <Ionicons name="home-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="receipt" size={24} color="#22C55E" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(customer)/cart")}
        >
          <Ionicons name="cart-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(customer)/profile")}
        >
          <Ionicons name="person-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 16,
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
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    color: "#94A3B8",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemsPreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemImages: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  moreItems: {
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -12,
  },
  moreItemsText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  itemsInfo: {
    flex: 1,
    marginLeft: 14,
  },
  itemsCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  itemsList: {
    fontSize: 12,
    color: "#94A3B8",
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  deliveryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D97706",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  reorderButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F0F7FF",
    gap: 6,
  },
  reorderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A90FF",
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#22C55E",
    gap: 6,
  },
  trackText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
  },
  shopButton: {
    marginTop: 24,
    backgroundColor: "#22C55E",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
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
    color: "#22C55E",
    fontWeight: "600",
  },
});