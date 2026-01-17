import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const vendors = [
  { id: 1, name: "Fresh Mart", approved: true },
  { id: 2, name: "Daily Needs", approved: false },
];

export default function AdminVendors() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendors</Text>

      {vendors.map((v) => (
        <View key={v.id} style={styles.card}>
          <Text style={styles.name}>{v.name}</Text>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: v.approved ? "#22C55E" : "#F59E0B" },
            ]}
          >
            <Text style={styles.btnText}>
              {v.approved ? "Approved" : "Approve"}
            </Text>
          </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: { fontWeight: "600" },
  button: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  btnText: { color: "#FFF", fontWeight: "600" },
});
