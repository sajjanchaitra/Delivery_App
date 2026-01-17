import { View, Text, StyleSheet, ScrollView } from "react-native";

const orders = [
  { id: "ORD101", user: "Rahul", amount: 450, status: "Pending" },
  { id: "ORD102", user: "Anita", amount: 780, status: "Delivered" },
  { id: "ORD103", user: "Suresh", amount: 220, status: "Cancelled" },
];

export default function AdminOrders() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>All Orders</Text>

      {orders.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.id}>{o.id}</Text>
          <Text>{o.user}</Text>
          <Text>₹{o.amount}</Text>
          <Text style={styles.status}>{o.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  id: { fontWeight: "700" },
  status: { marginTop: 4, fontWeight: "600", color: "#22C55E" },
});
