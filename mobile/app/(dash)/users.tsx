import { View, Text, StyleSheet } from "react-native";

const users = [
  { id: 1, name: "Kiran", role: "Customer" },
  { id: 2, name: "Ramesh", role: "Delivery" },
];

export default function AdminUsers() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Users</Text>

      {users.map((u) => (
        <View key={u.id} style={styles.card}>
          <Text style={styles.name}>{u.name}</Text>
          <Text style={styles.role}>{u.role}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  name: { fontWeight: "600" },
  role: { color: "#64748B", marginTop: 4 },
});
