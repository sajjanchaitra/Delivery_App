// app/(dash)/home.tsx
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
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_URL = "http://13.203.206.134:5000";

interface DashboardStats {
  users: {
    total: number;
    customers: number;
    vendors: number;
    deliveryPartners: number;
  };
  stores: {
    total: number;
    active: number;
  };
  products: {
    total: number;
  };
  orders: {
    total: number;
    today: number;
    thisMonth: number;
    pending: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    customer?: { name: string };
    store?: { name: string };
    createdAt: string;
  }>;
  topStores: Array<{
    _id: string;
    name: string;
    stats?: { totalRevenue: number; totalOrders: number };
  }>;
}

const quickActions = [
  { id: "1", label: "All Orders", icon: "receipt", route: "/(dash)/orders" },
  { id: "2", label: "Vendors", icon: "storefront", route: "/(dash)/vendors" },
  { id: "3", label: "Users", icon: "people", route: "/(dash)/users" },
  { id: "4", label: "Analytics", icon: "bar-chart", route: "/(dash)/analytics" },
];

export default function AdminHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const fetchDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("Dashboard data:", data);

      if (data.success && data.dashboard) {
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: "#F59E0B",
      confirmed: "#3B82F6",
      preparing: "#8B5CF6",
      ready: "#06B6D4",
      delivered: "#22C55E",
      cancelled: "#EF4444",
    };
    return colors[status] || "#94A3B8";
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Manage platform operations</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDashboard();
            }}
            colors={["#22C55E"]}
          />
        }
      >
        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <View style={styles.revenueBadge}>
              <Ionicons name="trending-up" size={14} color="#22C55E" />
              <Text style={styles.revenueBadgeText}>This Month</Text>
            </View>
          </View>
          <Text style={styles.revenueValue}>{formatCurrency(dashboard?.revenue?.total || 0)}</Text>
          <View style={styles.revenueStats}>
            <View style={styles.revenueStat}>
              <Text style={styles.revenueStatLabel}>Today</Text>
              <Text style={styles.revenueStatValue}>{formatCurrency(dashboard?.revenue?.today || 0)}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueStat}>
              <Text style={styles.revenueStatLabel}>This Month</Text>
              <Text style={styles.revenueStatValue}>{formatCurrency(dashboard?.revenue?.thisMonth || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="receipt"
            label="Total Orders"
            value={dashboard?.orders?.total?.toString() || "0"}
            subValue={`${dashboard?.orders?.today || 0} today`}
            color="#3B82F6"
          />
          <StatCard
            icon="time"
            label="Pending"
            value={dashboard?.orders?.pending?.toString() || "0"}
            subValue="Need attention"
            color="#F59E0B"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="storefront"
            label="Vendors"
            value={dashboard?.stores?.total?.toString() || "0"}
            subValue={`${dashboard?.stores?.active || 0} active`}
            color="#8B5CF6"
          />
          <StatCard
            icon="people"
            label="Users"
            value={dashboard?.users?.total?.toString() || "0"}
            subValue={`${dashboard?.users?.customers || 0} customers`}
            color="#06B6D4"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="bicycle"
            label="Delivery Partners"
            value={dashboard?.users?.deliveryPartners?.toString() || "0"}
            subValue="Active partners"
            color="#22C55E"
          />
          <StatCard
            icon="cube"
            label="Products"
            value={dashboard?.products?.total?.toString() || "0"}
            subValue="Total listings"
            color="#EC4899"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => router.push(action.route as any)}
              >
                <View style={styles.quickIconContainer}>
                  <Ionicons name={action.icon as any} size={24} color="#22C55E" />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        {dashboard?.recentOrders && dashboard.recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push("/(dash)/orders" as any)}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {dashboard.recentOrders.slice(0, 5).map((order) => (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(dash)/orders",
                    params: { orderId: order._id },
                  } as any)
                }
              >
                <View style={styles.orderLeft}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderStore}>{order.store?.name || "Store"}</Text>
                  <Text style={styles.orderCustomer}>{order.customer?.name || "Customer"}</Text>
                </View>
                <View style={styles.orderRight}>
                  <View style={[styles.orderStatus, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                    <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                  <Text style={styles.orderAmount}>₹{order.total}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Top Stores */}
        {dashboard?.topStores && dashboard.topStores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Stores</Text>
              <TouchableOpacity onPress={() => router.push("/(dash)/vendors" as any)}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {dashboard.topStores.slice(0, 5).map((store, index) => (
              <View key={store._id} style={styles.storeCard}>
                <View style={styles.storeRank}>
                  <Text style={styles.storeRankText}>{index + 1}</Text>
                </View>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeStats}>
                    {store.stats?.totalOrders || 0} orders
                  </Text>
                </View>
                <Text style={styles.storeRevenue}>
                  {formatCurrency(store.stats?.totalRevenue || 0)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 24, fontWeight: "700", color: "#FFF" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  notificationButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },
  revenueCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  revenueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  revenueLabel: { fontSize: 14, color: "#64748B" },
  revenueBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  revenueBadgeText: { fontSize: 12, color: "#22C55E", fontWeight: "600" },
  revenueValue: { fontSize: 32, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  revenueStats: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 16 },
  revenueStat: { flex: 1, alignItems: "center" },
  revenueStatLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 4 },
  revenueStatValue: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  revenueDivider: { width: 1, backgroundColor: "#F1F5F9" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: "#FFF", borderRadius: 16, padding: 16, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  statIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: "700", color: "#1E293B" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 4, textAlign: "center" },
  statSubValue: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  section: { marginTop: 8, marginBottom: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  seeAll: { fontSize: 14, fontWeight: "600", color: "#22C55E" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickCard: { width: (width - 52) / 2, backgroundColor: "#FFF", borderRadius: 16, padding: 20, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  quickIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  quickLabel: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  orderCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  orderLeft: { flex: 1 },
  orderNumber: { fontSize: 14, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  orderStore: { fontSize: 13, color: "#64748B", marginBottom: 2 },
  orderCustomer: { fontSize: 12, color: "#94A3B8" },
  orderRight: { alignItems: "flex-end" },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
  orderStatusText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  orderAmount: { fontSize: 16, fontWeight: "700", color: "#22C55E" },
  storeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  storeRank: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center", marginRight: 12 },
  storeRankText: { fontSize: 14, fontWeight: "700", color: "#22C55E" },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 2 },
  storeStats: { fontSize: 12, color: "#94A3B8" },
  storeRevenue: { fontSize: 16, fontWeight: "700", color: "#22C55E" },
});