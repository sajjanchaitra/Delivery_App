import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "http://13.203.206.134:5000";

export default function StoresScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stores, setStores] = useState([]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (typeof imagePath !== "string") return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const fetchStores = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      const res = await fetch(`${API_URL}/api/customer/stores`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      console.log("📦 Stores API:", data);

      if (data?.success) {
        setStores(data.stores || []);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.log("❌ Error loading stores:", err);
      setStores([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStores();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>All Stores</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {stores.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="storefront-outline" size={50} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No stores found</Text>
            <Text style={styles.emptyText}>
              Vendors haven't created stores yet or API is not returning data.
            </Text>
          </View>
        ) : (
          stores.map((store) => {
            const img = getImageUrl(store.image || store.logo || store.coverImage);

            return (
              <TouchableOpacity
                key={store._id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(customer)/store-details",
                    params: { storeId: store._id },
                  })
                }
              >
                {img ? (
                  <Image source={{ uri: img }} style={styles.storeImg} />
                ) : (
                  <View style={styles.noImg}>
                    <Ionicons name="storefront" size={26} color="#64748B" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.storeName}>{store.name || "Store"}</Text>
                  <Text style={styles.storeCat}>{store.category || "Category"}</Text>

                  <View style={styles.row}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.addressText}>
                      {store?.address?.city || "City"} {store?.address?.state || ""}
                    </Text>
                  </View>

                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, store.isOpen ? styles.openBadge : styles.closedBadge]}>
                      <Text style={styles.badgeText}>{store.isOpen ? "OPEN" : "CLOSED"}</Text>
                    </View>

                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>
                        {store?.rating?.average ? Number(store.rating.average).toFixed(1) : "0.0"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748B" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },

  emptyBox: { padding: 40, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginTop: 12, color: "#0F172A" },
  emptyText: { fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 6 },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  storeImg: { width: 70, height: 70, borderRadius: 14, backgroundColor: "#E2E8F0" },
  noImg: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  storeName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  storeCat: { fontSize: 12, color: "#64748B", marginTop: 2 },

  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  addressText: { fontSize: 12, color: "#64748B" },

  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  openBadge: { backgroundColor: "#DCFCE7" },
  closedBadge: { backgroundColor: "#FEE2E2" },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#0F172A" },

  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontWeight: "600", color: "#0F172A" },
});
