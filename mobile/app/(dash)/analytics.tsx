// app/(dash)/analytics.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_URL = "http://13.203.206.134:5000";

interface AnalyticsData {
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  activeDeliveries: number;
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  topSellingProducts: Array<{
    _id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

const timeRanges = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedRange, setSelectedRange] = useState("today");

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [selectedRange])
  );

  const fetchAnalytics = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/analytics?range=${selectedRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      console.log("Analytics data:", data);

      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
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

  const getRevenueForRange = (): number => {
    if (!analytics) return 0;
    switch (selectedRange) {
      case "today":
        return analytics.revenueToday;
      case "week":
        return analytics.revenueThisWeek;
      case "month":
        return analytics.revenueThisMonth;
      default:
        return 0;
    }
  };

  const getOrdersForRange = (): number => {
    if (!analytics) return 0;
    switch (selectedRange) {
      case "today":
        return analytics.ordersToday;
      case "week":
        return analytics.ordersThisWeek;
      case "month":
        return analytics.ordersThisMonth;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
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
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {/* Time Range Selector */}
      <View style={styles.rangeSelector}>
        {timeRanges.map((range) => (
          <TouchableOpacity
            key={range.id}
            style={[
              styles.rangeButton,
              selectedRange === range.id && styles.rangeButtonActive,
            ]}
            onPress={() => {
              setSelectedRange(range.id);
              setLoading(true);
            }}
          >
            <Text
              style={[
                styles.rangeButtonText,
                selectedRange === range.id && styles.rangeButtonTextActive,
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAnalytics();
            }}
            colors={["#22C55E"]}
          />
        }
      >
        {/* Main Stats */}
        <View style={styles.mainStatsRow}>
          <View style={styles.mainStatCard}>
            <Ionicons name="cash" size={32} color="#22C55E" />
            <Text style={styles.mainStatValue}>
              {formatCurrency(getRevenueForRange())}
            </Text>
            <Text style={styles.mainStatLabel}>Revenue</Text>
          </View>
          <View style={styles.mainStatCard}>
            <Ionicons name="receipt" size={32} color="#3B82F6" />
            <Text style={styles.mainStatValue}>{getOrdersForRange()}</Text>
            <Text style={styles.mainStatLabel}>Orders</Text>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="bicycle"
            label="Active Deliveries"
            value={analytics?.activeDeliveries?.toString() || "0"}
            color="#F59E0B"
          />
          <StatCard
            icon="people"
            label="Total Users"
            value={analytics?.totalUsers?.toString() || "0"}
            color="#8B5CF6"
          />
          <StatCard
            icon="storefront"
            label="Total Vendors"
            value={analytics?.totalVendors?.toString() || "0"}
            color="#06B6D4"
          />
          <StatCard
            icon="cube"
            label="Total Products"
            value={analytics?.totalProducts?.toString() || "0"}
            color="#EC4899"
          />
        </View>

        {/* Average Order Value */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Average Order Value</Text>
          <Text style={styles.avgOrderValue}>
            {formatCurrency(analytics?.averageOrderValue || 0)}
          </Text>
        </View>

        {/* Orders by Status */}
        {analytics?.ordersByStatus && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Orders by Status</Text>
            <View style={styles.statusList}>
              {Object.entries(analytics.ordersByStatus).map(
                ([status, count]) => (
                  <View key={status} style={styles.statusItem}>
                    <View style={styles.statusLeft}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(status) },
                        ]}
                      />
                      <Text style={styles.statusLabel}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.statusCount}>{count}</Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

        {/* Top Selling Products */}
        {analytics?.topSellingProducts &&
          analytics.topSellingProducts.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Top Selling Products</Text>
              {analytics.topSellingProducts.slice(0, 5).map((product, index) => (
                <View key={product._id} style={styles.productItem}>
                  <View style={styles.productRank}>
                    <Text style={styles.productRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productStats}>
                      {product.totalSold} sold
                    </Text>
                  </View>
                  <Text style={styles.productRevenue}>
                    {formatCurrency(product.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          )}

        {/* Revenue Trend */}
        {analytics?.revenueByDay && analytics.revenueByDay.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Revenue Trend</Text>
            {analytics.revenueByDay.map((day) => (
              <View key={day.date} style={styles.trendItem}>
                <Text style={styles.trendDate}>
                  {new Date(day.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
                <View style={styles.trendBar}>
                  <View
                    style={[
                      styles.trendFill,
                      {
                        width: `${Math.min(
                          (day.revenue / Math.max(...analytics.revenueByDay.map(d => d.revenue))) * 100,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendValue}>
                  {formatCurrency(day.revenue)}
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
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View
        style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "#F59E0B",
    confirmed: "#3B82F6",
    preparing: "#8B5CF6",
    ready: "#06B6D4",
    delivered: "#22C55E",
    cancelled: "#EF4444",
  };
  return colors[status] || "#94A3B8";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  rangeSelector: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
  },
  rangeButtonActive: { backgroundColor: "#22C55E" },
  rangeButtonText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  rangeButtonTextActive: { color: "#FFF" },
  scrollView: { flex: 1, padding: 20 },
  mainStatsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  mainStatCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 8,
  },
  mainStatLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: "#1E293B" },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
  },
  avgOrderValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#22C55E",
    textAlign: "center",
  },
  statusList: { gap: 12 },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, color: "#64748B" },
  statusCount: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productRankText: { fontSize: 12, fontWeight: "700", color: "#22C55E" },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  productStats: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  productRevenue: { fontSize: 14, fontWeight: "700", color: "#22C55E" },
  trendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  trendDate: { fontSize: 12, color: "#64748B", width: 50 },
  trendBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  trendFill: { height: "100%", backgroundColor: "#22C55E" },
  trendValue: { fontSize: 12, fontWeight: "600", color: "#1E293B", width: 60, textAlign: "right" },
});