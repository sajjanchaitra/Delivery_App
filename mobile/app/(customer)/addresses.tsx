import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

type Address = {
  _id: string;
  name?: string;
  fullName?: string;
  phone?: string;
  houseNo?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
};

export default function AddressesScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const formatAddress = (a: Address) => {
    const parts = [
      a.houseNo,
      a.area,
      a.landmark,
      a.city,
      a.state,
      a.pincode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const fetchAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setAddresses([]);
        return;
      }

      const res = await fetch(`${API_URL}/api/address`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setAddresses(data.addresses || []);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.log("❌ fetchAddresses error:", err);
      setAddresses([]);
    }
  };

  const init = async () => {
    setLoading(true);
    await fetchAddresses();
    setLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  }, []);

  const deleteAddress = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/address/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        Alert.alert("Deleted", "Address removed successfully");
        fetchAddresses();
      } else {
        Alert.alert("Error", data.message || "Failed to delete");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to delete address");
    }
  };

  const setDefault = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/address/${id}/default`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        fetchAddresses();
      } else {
        Alert.alert("Error", data.message || "Failed to set default");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to set default");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Saved Addresses</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(customer)/add-address" as any)}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#DC2626"]}
            tintColor="#DC2626"
          />
        }
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={52} color="#CBD5E1" />
            <Text style={styles.emptyText}>No address saved yet</Text>

            <TouchableOpacity
              style={styles.bigAddBtn}
              onPress={() => router.push("/(customer)/add-address" as any)}
            >
              <Text style={styles.bigAddBtnText}>+ Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr._id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.addrTitle}>
                  {addr.name || "Address"}{" "}
                  {addr.isDefault ? (
                    <Text style={styles.defaultTag}> (Default)</Text>
                  ) : null}
                </Text>

                <TouchableOpacity onPress={() => deleteAddress(addr._id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <Text style={styles.addrText}>{formatAddress(addr)}</Text>

              {(addr.fullName || addr.phone) ? (
                <Text style={styles.addrSub}>
                  {addr.fullName || ""} {addr.phone ? `• ${addr.phone}` : ""}
                </Text>
              ) : null}

              <View style={styles.actionsRow}>
                {!addr.isDefault && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setDefault(addr._id)}
                  >
                    <Text style={styles.actionBtnText}>Set Default</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={() =>
                    router.push({
                      pathname: "/(customer)/add-address",
                      params: { addressId: addr._id },
                    } as any)
                  }
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextOutline]}>
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },

  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },

  content: { padding: 16 },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#94A3B8", marginTop: 12 },
  bigAddBtn: {
    marginTop: 16,
    backgroundColor: "#DC2626",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bigAddBtnText: { color: "#FFFFFF", fontWeight: "700" },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addrTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  defaultTag: { fontSize: 13, fontWeight: "700", color: "#DC2626" },

  addrText: { marginTop: 8, fontSize: 13, color: "#475569" },
  addrSub: { marginTop: 6, fontSize: 12, color: "#94A3B8" },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },

  actionBtn: {
    flex: 1,
    backgroundColor: "#DC2626",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  actionBtnOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  actionBtnTextOutline: { color: "#DC2626" },
});