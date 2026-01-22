// Create: app/(delivery)/earnings.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type EarningRecord = {
  id: string;
  orderId: string;
  date: string;
  amount: number;
  distance: string;
  status: "completed" | "pending";
};

const earningsHistory: EarningRecord[] = [
  {
    id: "1",
    orderId: "ORD12345",
    date: "Today, 3:45 PM",
    amount: 130,
    distance: "2.5 km",
    status: "completed",
  },
  {
    id: "2",
    orderId: "ORD12344",
    date: "Today, 2:30 PM",
    amount: 90,
    distance: "1.8 km",
    status: "completed",
  },
  {
    id: "3",
    orderId: "ORD12343",
    date: "Today, 1:15 PM",
    amount: 115,
    distance: "3.2 km",
    status: "completed",
  },
  {
    id: "4",
    orderId: "ORD12342",
    date: "Today, 11:30 AM",
    amount: 85,
    distance: "1.5 km",
    status: "completed",
  },
  {
    id: "5",
    orderId: "ORD12341",
    date: "Yesterday, 5:20 PM",
    amount: 105,
    distance: "2.1 km",
    status: "completed",
  },
  {
    id: "6",
    orderId: "ORD12340",
    date: "Yesterday, 4:15 PM",
    amount: 95,
    distance: "1.9 km",
    status: "completed",
  },
  {
    id: "7",
    orderId: "ORD12339",
    date: "Yesterday, 2:45 PM",
    amount: 120,
    distance: "2.8 km",
    status: "completed",
  },
  {
    id: "8",
    orderId: "ORD12338",
    date: "Yesterday, 1:30 PM",
    amount: 80,
    distance: "1.4 km",
    status: "completed",
  },
];

export default function EarningsScreen() {
  const router = useRouter();
  const [todayEarnings] = useState(2450);
  const [weekEarnings] = useState(12340);
  const [monthEarnings] = useState(45600);
  const [totalEarnings] = useState(156780);
  const [pendingWithdrawal] = useState(5420);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Total Earnings Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalIcon}>
            <Ionicons name="wallet" size={32} color="#22C55E" />
          </View>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>₹{totalEarnings.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.withdrawButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-down" size={18} color="#22C55E" />
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Withdrawal */}
        {pendingWithdrawal > 0 && (
          <View style={styles.pendingCard}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={styles.pendingText}>
              ₹{pendingWithdrawal} pending withdrawal
            </Text>
          </View>
        )}

        {/* Period Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{todayEarnings}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{weekEarnings}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{monthEarnings}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>
      </View>

      {/* Earnings History */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={18} color="#64748B" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {earningsHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.earningCard}
              activeOpacity={0.8}
            >
              <View style={styles.earningIcon}>
                <Ionicons name="cash" size={20} color="#22C55E" />
              </View>
              <View style={styles.earningInfo}>
                <Text style={styles.earningOrderId}>{item.orderId}</Text>
                <Text style={styles.earningDate}>{item.date}</Text>
                <View style={styles.earningMeta}>
                  <Ionicons name="location" size={12} color="#94A3B8" />
                  <Text style={styles.earningMetaText}>{item.distance}</Text>
                </View>
              </View>
              <View style={styles.earningAmount}>
                <Text style={styles.earningValue}>+₹{item.amount}</Text>
                <View style={styles.earningBadge}>
                  <Text style={styles.earningBadgeText}>Completed</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Deliveries</Text>
              <Text style={styles.summaryValue}>{earningsHistory.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Average Earnings</Text>
              <Text style={styles.summaryValue}>
                ₹{Math.round(todayEarnings / 12)}
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/home")}
        >
          <Ionicons name="home-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/orders")}
        >
          <Ionicons name="list-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
        >
          <Ionicons name="wallet" size={24} color="#22C55E" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/profile")}
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#1E293B",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  totalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(34,197,94,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  withdrawText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22C55E",
  },
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245,158,11,0.2)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F59E0B",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  earningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  earningIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  earningInfo: {
    flex: 1,
  },
  earningOrderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  earningDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  earningMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  earningMetaText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  earningAmount: {
    alignItems: "flex-end",
  },
  earningValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 4,
  },
  earningBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  earningBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#16A34A",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
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