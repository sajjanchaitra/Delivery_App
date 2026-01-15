import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function VendorHome() {
  const router = useRouter();
  const [storeActive, setStoreActive] = useState(true);
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const stats = {
    todayOrders: 12,
    todayEarnings: 4580,
    pendingOrders: 5,
    totalProducts: 48,
    monthlyEarnings: 125600,
    rating: 4.8,
  };

  const quickActions = [
    { id: "1", label: "Add Product", icon: "add-circle", color: "#22C55E", route: "/(vendor)/add-product" },
    { id: "2", label: "My Products", icon: "cube", color: "#3B82F6", route: "/(vendor)/products" },
    { id: "3", label: "All Orders", icon: "receipt", color: "#F59E0B", route: "/(vendor)/orders" },
    { id: "4", label: "Store Setup", icon: "storefront", color: "#8B5CF6", route: "/(vendor)/store-setup" },
  ];

  const recentOrders = [
    { id: "1", orderNo: "ORD-2024", customer: "Rahul Kumar", items: 3, total: 450, status: "pending", time: "2 min ago" },
    { id: "2", orderNo: "ORD-2023", customer: "Priya Sharma", items: 2, total: 280, status: "preparing", time: "15 min ago" },
    { id: "3", orderNo: "ORD-2022", customer: "Amit Singh", items: 5, total: 720, status: "ready", time: "30 min ago" },
    { id: "4", orderNo: "ORD-2021", customer: "Sneha Patel", items: 1, total: 150, status: "delivered", time: "1 hr ago" },
  ];

  const topProducts = [
    { id: "1", name: "Fresh Tomatoes", sold: 45, revenue: 1575, image: "🍅" },
    { id: "2", name: "Organic Milk", sold: 38, revenue: 2470, image: "🥛" },
    { id: "3", name: "Brown Eggs", sold: 32, revenue: 1920, image: "🥚" },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending": return { bg: "#FEF3C7", color: "#D97706", label: "Pending" };
      case "preparing": return { bg: "#DBEAFE", color: "#2563EB", label: "Preparing" };
      case "ready": return { bg: "#D1FAE5", color: "#059669", label: "Ready" };
      case "delivered": return { bg: "#F3F4F6", color: "#6B7280", label: "Delivered" };
      default: return { bg: "#F3F4F6", color: "#6B7280", label: status };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16A34A" />

      {/* Header */}
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        {/* Top Row */}
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>FM</Text>
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>{greeting} 👋</Text>
              <Text style={styles.storeName}>Fresh Mart Store</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Store Status Toggle */}
        <View style={styles.storeStatusCard}>
          <View style={styles.storeStatusLeft}>
            <View style={[styles.statusDot, { backgroundColor: storeActive ? "#22C55E" : "#EF4444" }]} />
            <View>
              <Text style={styles.storeStatusLabel}>Store Status</Text>
              <Text style={styles.storeStatusValue}>{storeActive ? "Open for orders" : "Currently closed"}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.toggleButton, storeActive && styles.toggleButtonActive]}
            onPress={() => setStoreActive(!storeActive)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, storeActive && styles.toggleTextActive]}>
              {storeActive ? "OPEN" : "CLOSED"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{stats.rating}</Text>
          <Text style={styles.ratingLabel}>Rating</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.statCardGradient}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="cart" size={24} color="#FFF" />
                </View>
                <Text style={styles.statValueLight}>{stats.todayOrders}</Text>
                <Text style={styles.statLabelLight}>Today's Orders</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="wallet" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>₹{stats.todayEarnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="time" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name="cube" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{stats.totalProducts}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
          </View>
        </View>

        {/* Monthly Earnings Banner */}
        <TouchableOpacity style={styles.earningsBanner} activeOpacity={0.9}>
          <LinearGradient
            colors={["#1E293B", "#334155"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.earningsBannerGradient}
          >
            <View>
              <Text style={styles.earningsBannerLabel}>This Month's Earnings</Text>
              <Text style={styles.earningsBannerValue}>₹{stats.monthlyEarnings.toLocaleString()}</Text>
            </View>
            <View style={styles.earningsBannerIcon}>
              <Ionicons name="trending-up" size={32} color="#22C55E" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => router.push(action.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push("/(vendor)/orders")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.map((order) => {
            const statusStyle = getStatusStyle(order.status);
            return (
              <TouchableOpacity key={order.id} style={styles.orderCard} activeOpacity={0.7}>
                <View style={styles.orderLeft}>
                  <View style={styles.orderIconContainer}>
                    <Ionicons name="receipt" size={20} color="#22C55E" />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>{order.orderNo}</Text>
                    <Text style={styles.orderCustomer}>{order.customer}</Text>
                    <Text style={styles.orderMeta}>{order.items} items • {order.time}</Text>
                  </View>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderTotal}>₹{order.total}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Top Selling Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Selling</Text>
            <TouchableOpacity onPress={() => router.push("/(vendor)/products")}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {topProducts.map((product, index) => (
              <View key={product.id} style={styles.topProductCard}>
                <View style={styles.topProductRank}>
                  <Text style={styles.topProductRankText}>#{index + 1}</Text>
                </View>
                <Text style={styles.topProductEmoji}>{product.image}</Text>
                <Text style={styles.topProductName}>{product.name}</Text>
                <Text style={styles.topProductSold}>{product.sold} sold</Text>
                <Text style={styles.topProductRevenue}>₹{product.revenue}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navItemActive}>
            <Ionicons name="home" size={22} color="#22C55E" />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(vendor)/products")}>
          <Ionicons name="cube-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabel}>Products</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemCenter} onPress={() => router.push("/(vendor)/add-product")}>
          <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.addButtonGradient}>
            <Ionicons name="add" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(vendor)/orders")}>
          <Ionicons name="receipt-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(vendor)/profile")}>
          <Ionicons name="person-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  greetingContainer: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  storeStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    padding: 14,
  },
  storeStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  storeStatusLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  storeStatusValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  toggleButtonActive: {
    backgroundColor: "#FFF",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  toggleTextActive: {
    color: "#22C55E",
  },
  ratingBadge: {
    position: "absolute",
    bottom: -15,
    right: 30,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  ratingLabel: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  statsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardPrimary: {
    padding: 0,
    overflow: "hidden",
  },
  statCardGradient: {
    padding: 16,
    flex: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  statValueLight: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
  },
  statLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  statLabelLight: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  earningsBanner: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  earningsBannerGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  earningsBannerLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  earningsBannerValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 4,
  },
  earningsBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(34,197,94,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  orderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  orderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  orderCustomer: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  orderMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  orderRight: {
    alignItems: "flex-end",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  topProductCard: {
    width: 130,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topProductRank: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  topProductRankText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#22C55E",
  },
  topProductEmoji: {
    fontSize: 36,
    marginBottom: 8,
    marginTop: 10,
  },
  topProductName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  topProductSold: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  topProductRevenue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22C55E",
    marginTop: 4,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  navItemActive: {
    backgroundColor: "#F0FDF4",
    padding: 8,
    borderRadius: 12,
  },
  navItemCenter: {
    marginTop: -30,
  },
  addButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 4,
  },
  navLabelActive: {
    color: "#22C55E",
    fontWeight: "600",
  },
});