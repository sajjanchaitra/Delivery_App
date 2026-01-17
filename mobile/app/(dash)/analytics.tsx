import { View, Text, StyleSheet } from "react-native";

export default function AdminAnalytics() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>

      <View style={styles.card}>
        <Text>📦 Orders Today: 96</Text>
      </View>
      <View style={styles.card}>
        <Text>💰 Revenue Today: ₹18,500</Text>
      </View>
      <View style={styles.card}>
        <Text>🚚 Active Deliveries: 24</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
});
