// app/(dash)/home.tsx - Beautiful & Simple Admin Dashboard
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
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_URL = "http://13.203.206.134:5000";

interface DashboardStats {
  users: { total: number; customers: number; vendors: number; deliveryPartners: number };
  stores: { total: number; active: number };
  products: { total: number };
  orders: { total: number; today: number; thisMonth: number; pending: number };
  revenue: { total: number; today: number; thisMonth: number };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    customer?: { name: string };
    store?: { name: string };
    createdAt: string;
  }>;
}

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

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("authToken");
            await AsyncStorage.removeItem("userRole");
            router.replace("/(auth)/login" as any);
          } catch (error) {
            console.error("Error logging out:", error);
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Beautiful Header */}
      <LinearGradient colors={["#22C55E", "#16A34A", "#15803D"]} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back! 👋</Text>
            <Text style={styles.title}>Admin Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Today's Revenue Highlight */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="cash" size={28} color="#22C55E" />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>Today's Revenue</Text>
            <Text style={styles.heroValue}>{formatCurrency(dashboard?.revenue?.today || 0)}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="trending-up" size={16} color="#22C55E" />
            <Text style={styles.heroBadgeText}>{dashboard?.orders?.today || 0} orders</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} colors={["#22C55E"]} />
        }
      >
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statBox, { backgroundColor: "#EFF6FF" }]} onPress={() => router.push("/(dash)/orders" as any)}>
            <View style={[styles.statIcon, { backgroundColor: "#3B82F6" }]}>
              <Ionicons name="receipt" size={20} color="#FFF" />
            </View>
            <Text style={styles.statValue}>{dashboard?.orders?.total || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statBox, { backgroundColor: "#FEF3C7" }]} onPress={() => router.push("/(dash)/orders" as any)}>
            <View style={[styles.statIcon, { backgroundColor: "#F59E0B" }]}>
              <Ionicons name="time" size={20} color="#FFF" />
            </View>
            <Text style={styles.statValue}>{dashboard?.orders?.pending || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statBox, { backgroundColor: "#F3E8FF" }]} onPress={() => router.push("/(dash)/vendors" as any)}>
            <View style={[styles.statIcon, { backgroundColor: "#8B5CF6" }]}>
              <Ionicons name="storefront" size={20} color="#FFF" />
            </View>
            <Text style={styles.statValue}>{dashboard?.stores?.total || 0}</Text>
            <Text style={styles.statLabel}>Vendors</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statBox, { backgroundColor: "#DBEAFE" }]} onPress={() => router.push("/(dash)/users" as any)}>
            <View style={[styles.statIcon, { backgroundColor: "#06B6D4" }]}>
              <Ionicons name="people" size={20} color="#FFF" />
            </View>
            <Text style={styles.statValue}>{dashboard?.users?.total || 0}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(dash)/orders" as any)}>
              <LinearGradient colors={["#3B82F6", "#2563EB"]} style={styles.actionGradient}>
                <Ionicons name="receipt-outline" size={24} color="#FFF" />
                <Text style={styles.actionText}>View Orders</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(dash)/vendors" as any)}>
              <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.actionGradient}>
                <Ionicons name="storefront-outline" size={24} color="#FFF" />
                <Text style={styles.actionText}>Manage Vendors</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(dash)/users" as any)}>
              <LinearGradient colors={["#06B6D4", "#0891B2"]} style={styles.actionGradient}>
                <Ionicons name="people-outline" size={24} color="#FFF" />
                <Text style={styles.actionText}>View Users</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(dash)/analytics" as any)}>
              <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.actionGradient}>
                <Ionicons name="bar-chart-outline" size={24} color="#FFF" />
                <Text style={styles.actionText}>Analytics</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        {dashboard?.recentOrders && dashboard.recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push("/(dash)/orders" as any)}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            {dashboard.recentOrders.slice(0, 5).map((order) => (
              <TouchableOpacity key={order._id} style={styles.orderItem}>
                <View style={styles.orderLeft}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderCustomer}>{order.customer?.name || "Customer"}</Text>
                </View>
                <View style={styles.orderRight}>
                  <View style={[styles.orderStatus, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
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

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B", fontWeight: "500" },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  greeting: { fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "500" },
  title: { fontSize: 28, fontWeight: "800", color: "#FFF", marginTop: 4 },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(239,68,68,0.25)", justifyContent: "center", alignItems: "center" },
  heroCard: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 20, padding: 18, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center", marginRight: 14 },
  heroContent: { flex: 1 },
  heroLabel: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  heroValue: { fontSize: 28, fontWeight: "800", color: "#1E293B", marginTop: 2 },
  heroBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  heroBadgeText: { fontSize: 12, color: "#22C55E", fontWeight: "700" },
  content: { padding: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statBox: { width: (width - 52) / 2, borderRadius: 18, padding: 18, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: "800", color: "#1E293B", marginBottom: 2 },
  statLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  seeAll: { fontSize: 14, fontWeight: "700", color: "#22C55E" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: { width: (width - 52) / 2, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  actionGradient: { padding: 20, alignItems: "center", gap: 8 },
  actionText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  orderItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFF", borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  orderLeft: { flex: 1 },
  orderNumber: { fontSize: 15, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  orderCustomer: { fontSize: 13, color: "#64748B" },
  orderRight: { alignItems: "flex-end" },
  orderStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  orderStatusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  orderAmount: { fontSize: 16, fontWeight: "800", color: "#22C55E" },
});