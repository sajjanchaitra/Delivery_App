import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_URL = "http://13.203.206.134:5000";

export default function VendorHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeActive, setStoreActive] = useState(true);
  const [greeting, setGreeting] = useState("Good Morning");
  const [hasStore, setHasStore] = useState(false);
  const [storeData, setStoreData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [userName, setUserName] = useState("Vendor");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkStoreAndFetchData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || "Vendor");
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const checkStoreAndFetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      // Check if vendor has a store
      const storeResponse = await fetch(`${API_URL}/api/vendor/store`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const storeResult = await storeResponse.json();
      console.log("Store check:", storeResult);

      if (!storeResult.hasStore) {
        setHasStore(false);
        setLoading(false);
        return;
      }

      setHasStore(true);
      setStoreData(storeResult.store);
      setStoreActive(storeResult.store?.isOpen ?? true);

      // Fetch dashboard stats
      const dashboardResponse = await fetch(`${API_URL}/api/vendor/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const dashboardData = await dashboardResponse.json();
      console.log("Dashboard data:", dashboardData);

      if (dashboardData.success) {
        setDashboardStats(dashboardData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleStoreStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/vendor/store/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setStoreActive(data.isOpen);
      }
    } catch (error) {
      console.error("Error toggling store:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    checkStoreAndFetchData();
  };

  const quickActions = [
    {
      id: "1",
      label: "Add Product",
      icon: "add-circle",
      color: "#22C55E",
      route: "/(vendor)/add-product",
    },
    {
      id: "2",
      label: "My Products",
      icon: "cube",
      color: "#3B82F6",
      route: "/(vendor)/products",
    },
    {
      id: "3",
      label: "All Orders",
      icon: "receipt",
      color: "#F59E0B",
      route: "/(vendor)/orders",
    },
    {
      id: "4",
      label: "Store Setup",
      icon: "storefront",
      color: "#8B5CF6",
      route: "/(vendor)/store-setup",
    },
  ];

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={{ marginTop: 12, color: "#64748B" }}>Loading...</Text>
      </View>
    );
  }

  // No Store State
  if (!hasStore) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#16A34A" />
        <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#FFF" />
              </View>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{greeting} 👋</Text>
                <Text style={styles.storeName}>{userName}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/(vendor)/profile")}
            >
              <Ionicons name="person-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="storefront-outline" size={64} color="#22C55E" />
          </View>
          <Text style={styles.emptyStateTitle}>Setup Your Store</Text>
          <Text style={styles.emptyStateText}>
            Create your store profile to start selling products and receiving
            orders
          </Text>

          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => router.push("/(vendor)/store-setup")}
          >
            <LinearGradient
              colors={["#22C55E", "#16A34A"]}
              style={styles.setupButtonGradient}
            >
              <Ionicons name="storefront" size={20} color="#FFF" />
              <Text style={styles.setupButtonText}>Setup Store Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stats = dashboardStats?.stats || {
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16A34A" />

      {/* Header */}
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {storeData?.name?.substring(0, 2).toUpperCase() || "ST"}
              </Text>
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>{greeting} 👋</Text>
              <Text style={styles.storeName}>
                {storeData?.name || "Your Store"}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#FFF"
              />
              {stats.pendingOrders > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {stats.pendingOrders}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Store Status Toggle */}
        <View style={styles.storeStatusCard}>
          <View style={styles.storeStatusLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: storeActive ? "#22C55E" : "#EF4444" },
              ]}
            />
            <View>
              <Text style={styles.storeStatusLabel}>Store Status</Text>
              <Text style={styles.storeStatusValue}>
                {storeActive ? "Open for orders" : "Currently closed"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              storeActive && styles.toggleButtonActive,
            ]}
            onPress={toggleStoreStatus}
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
          <Text style={styles.ratingText}>
            {storeData?.rating?.average?.toFixed(1) || "0.0"}
          </Text>
          <Text style={styles.ratingLabel}>Rating</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#22C55E"]}
            tintColor="#22C55E"
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                style={styles.statCardGradient}
              >
                <View style={styles.statIconContainer}>
                  <Ionicons name="cart" size={24} color="#FFF" />
                </View>
                <Text style={styles.statValueLight}>{stats.todayOrders}</Text>
                <Text style={styles.statLabelLight}>Today's Orders</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#FEF3C7" },
                ]}
              >
                <Ionicons name="wallet" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>
                ₹{stats.todayRevenue?.toLocaleString() || 0}
              </Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#FEE2E2" },
                ]}
              >
                <Ionicons name="time" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#DBEAFE" },
                ]}
              >
                <Ionicons name="cube" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{stats.totalProducts}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
          </View>
        </View>

        {/* Total Earnings Banner */}
        <TouchableOpacity style={styles.earningsBanner} activeOpacity={0.9}>
          <LinearGradient
            colors={["#1E293B", "#334155"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.earningsBannerGradient}
          >
            <View>
              <Text style={styles.earningsBannerLabel}>Total Revenue</Text>
              <Text style={styles.earningsBannerValue}>
                ₹{stats.totalRevenue?.toLocaleString() || 0}
              </Text>
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
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: `${action.color}15` },
                  ]}
                >
                  <Ionicons name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        {dashboardStats?.recentOrders && dashboardStats.recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push("/(vendor)/orders")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {dashboardStats.recentOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/(vendor)/order-details",
                    params: { orderId: order._id },
                  })
                }
              >
                <View style={styles.orderLeft}>
                  <View style={styles.orderIconContainer}>
                    <Ionicons name="receipt" size={20} color="#22C55E" />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>
                      #{order._id?.substring(0, 8)}
                    </Text>
                    <Text style={styles.orderCustomer}>
                      {order.customer?.name || "Customer"}
                    </Text>
                    <Text style={styles.orderMeta}>
                      {new Date(order.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderRight}>
                  <Text style={styles.orderTotal}>₹{order.total}</Text>
                  <View style={[styles.statusBadge, getStatusStyle(order.status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(order.status)]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty Orders */}
        {(!dashboardStats?.recentOrders || dashboardStats.recentOrders.length === 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <View style={styles.emptyOrders}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyOrdersText}>No orders yet</Text>
              <Text style={styles.emptyOrdersSubtext}>
                Orders will appear here when customers place them
              </Text>
            </View>
          </View>
        )}

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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/(vendor)/products")}
        >
          <Ionicons name="cube-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabel}>Products</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItemCenter}
          onPress={() => router.push("/(vendor)/add-product")}
        >
          <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.addButtonGradient}>
            <Ionicons name="add" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/(vendor)/orders")}
        >
          <Ionicons name="receipt-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/(vendor)/profile")}
        >
          <Ionicons name="person-outline" size={22} color="#94A3B8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper functions for status styling
const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return { backgroundColor: "#FEF3C7" };
    case "confirmed":
      return { backgroundColor: "#DBEAFE" };
    case "preparing":
      return { backgroundColor: "#E0E7FF" };
    case "ready":
      return { backgroundColor: "#D1FAE5" };
    case "delivered":
      return { backgroundColor: "#DCFCE7" };
    case "cancelled":
      return { backgroundColor: "#FEE2E2" };
    default:
      return { backgroundColor: "#F1F5F9" };
  }
};

const getStatusTextStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return { color: "#D97706" };
    case "confirmed":
      return { color: "#2563EB" };
    case "preparing":
      return { color: "#4F46E5" };
    case "ready":
      return { color: "#059669" };
    case "delivered":
      return { color: "#16A34A" };
    case "cancelled":
      return { color: "#DC2626" };
    default:
      return { color: "#64748B" };
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  setupButton: { borderRadius: 14, overflow: "hidden" },
  setupButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  setupButtonText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  emptyOrders: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginTop: 12,
  },
  emptyOrdersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 12,
  },
  emptyOrdersSubtext: { fontSize: 13, color: "#94A3B8", marginTop: 4 },

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
  profileSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  greetingContainer: { marginLeft: 12 },
  greetingText: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  storeName: { fontSize: 18, fontWeight: "700", color: "#FFF", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 10 },
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
  notifBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFF" },

  storeStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    padding: 14,
  },
  storeStatusLeft: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  storeStatusLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  storeStatusValue: { fontSize: 14, fontWeight: "600", color: "#FFF", marginTop: 2 },

  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  toggleButtonActive: { backgroundColor: "#FFF" },
  toggleText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  toggleTextActive: { color: "#22C55E" },

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
  ratingText: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  ratingLabel: { fontSize: 12, color: "#64748B", marginLeft: 2 },

  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 30, paddingHorizontal: 20 },

  statsContainer: { gap: 12, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 12 },

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
  statCardPrimary: { padding: 0, overflow: "hidden" },
  statCardGradient: { padding: 16, flex: 1 },

  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  statValue: { fontSize: 24, fontWeight: "700", color: "#1E293B" },
  statValueLight: { fontSize: 24, fontWeight: "700", color: "#FFF" },
  statLabel: { fontSize: 13, color: "#64748B", marginTop: 4 },
  statLabelLight: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },

  earningsBanner: { marginBottom: 24, borderRadius: 16, overflow: "hidden" },
  earningsBannerGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  earningsBannerLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  earningsBannerValue: { fontSize: 28, fontWeight: "700", color: "#FFF", marginTop: 4 },
  earningsBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(34,197,94,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  seeAllText: { fontSize: 14, fontWeight: "600", color: "#22C55E" },

  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
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
  quickActionLabel: { fontSize: 14, fontWeight: "600", color: "#1E293B" },

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
  orderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  orderIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  orderInfo: { marginLeft: 12, flex: 1 },
  orderNumber: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  orderCustomer: { fontSize: 13, color: "#64748B", marginTop: 2 },
  orderMeta: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  orderRight: { alignItems: "flex-end" },
  orderTotal: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },

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
  navItem: { alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  navItemActive: { backgroundColor: "#F0FDF4", padding: 8, borderRadius: 12 },
  navItemCenter: { marginTop: -30 },
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
  navLabel: { fontSize: 11, fontWeight: "500", color: "#94A3B8", marginTop: 4 },
  navLabelActive: { color: "#22C55E", fontWeight: "600" },
});
