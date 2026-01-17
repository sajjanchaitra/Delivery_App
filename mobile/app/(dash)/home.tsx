import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const quickActions = [
  { id: "1", label: "All Orders", icon: "receipt", route: "/admin/orders" as const },
  { id: "2", label: "Vendors", icon: "storefront", route: "/admin/vendors" as const },
  { id: "3", label: "Users", icon: "people", route: "/admin/users" as const },
  { id: "4", label: "Analytics", icon: "bar-chart", route: "/admin/analytics" as const },
];

export default function AdminHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage platform operations</Text>
      </LinearGradient>

      {/* Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="receipt" label="Orders" value="1,240" />
          <StatCard icon="storefront" label="Vendors" value="48" />
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="people" label="Users" value="3,560" />
          <StatCard icon="wallet" label="Revenue" value="₹4,25,000" />
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
                onPress={() => router.push(action.route)}
              >
                <Ionicons name={action.icon} size={26} color="#22C55E" />
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={28} color="#22C55E" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    color: "#1E293B",
  },
});
