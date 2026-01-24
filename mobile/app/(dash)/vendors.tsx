// app/(dash)/vendors.tsx - Simple Store Details View
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

interface Vendor {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  category?: string;
  address?: {
    street?: string;
    city?: string;
    pincode?: string;
  };
  isApproved?: boolean;
  isActive?: boolean;
  vendor?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  stats?: {
    totalOrders?: number;
    totalRevenue?: number;
    totalProducts?: number;
  };
}

const vendorFilters = [
  { id: "all", label: "All Stores" },
  { id: "active", label: "Active" },
  { id: "new", label: "New" },
];

export default function AdminVendors() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVendors();
    }, [selectedFilter])
  );

  const fetchVendors = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      let url = `${API_URL}/api/admin/stores`;
      const params = [];
      
      if (selectedFilter === "active") {
        params.push(`isActive=true`);
      } else if (selectedFilter === "new") {
        // Get stores created in last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.push(`createdAfter=${weekAgo.toISOString()}`);
      }
      
      if (searchQuery) {
        params.push(`search=${encodeURIComponent(searchQuery)}`);
      }
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("Stores Response:", data);
      console.log("First store:", data.stores?.[0]);

      if (data.success) {
        const storesData = data.stores || data.vendors || [];
        console.log("Total stores:", storesData.length);
        setVendors(storesData);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const formatAddress = (address: any): string => {
    if (!address) return "N/A";
    if (typeof address === "string") return address;
    const parts = [address.street, address.city, address.pincode].filter(Boolean);
    return parts.join(", ");
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const openVendorDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stores & Vendors</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stores..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchVendors}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); fetchVendors(); }}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {vendorFilters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
            onPress={() => { setSelectedFilter(filter.id); setLoading(true); }}
          >
            <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchVendors(); }}
            colors={["#22C55E"]}
          />
        }
      >
        {vendors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No stores found</Text>
            <Text style={styles.emptyHint}>Try changing the filter or search</Text>
          </View>
        ) : (
          vendors.map((vendor) => (
            <TouchableOpacity
              key={vendor._id}
              style={styles.vendorCard}
              activeOpacity={0.8}
              onPress={() => openVendorDetails(vendor)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.storeIcon}>
                  <Ionicons name="storefront" size={28} color="#8B5CF6" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.storeName}>{vendor.name || "Unnamed Store"}</Text>
                  {vendor.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{vendor.category}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </View>

              {vendor.vendor && (
                <View style={styles.vendorRow}>
                  <Ionicons name="person-outline" size={16} color="#64748B" />
                  <Text style={styles.vendorText}>{vendor.vendor.name}</Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Ionicons name="receipt-outline" size={18} color="#3B82F6" />
                  <Text style={styles.statValue}>{vendor.stats?.totalOrders || 0}</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Ionicons name="cube-outline" size={18} color="#8B5CF6" />
                  <Text style={styles.statValue}>{vendor.stats?.totalProducts || 0}</Text>
                  <Text style={styles.statLabel}>Products</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Ionicons name="cash-outline" size={18} color="#22C55E" />
                  <Text style={styles.statValue}>{formatCurrency(vendor.stats?.totalRevenue || 0)}</Text>
                  <Text style={styles.statLabel}>Revenue</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Store Details Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Store Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedVendor && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalStoreHeader}>
                  <View style={styles.modalStoreIcon}>
                    <Ionicons name="storefront" size={40} color="#8B5CF6" />
                  </View>
                  <Text style={styles.modalStoreName}>{selectedVendor.name || "Unnamed Store"}</Text>
                  {selectedVendor.category && (
                    <View style={styles.modalCategoryBadge}>
                      <Text style={styles.modalCategoryText}>{selectedVendor.category}</Text>
                    </View>
                  )}
                </View>

                {selectedVendor.description && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>About</Text>
                    <Text style={styles.modalText}>{selectedVendor.description}</Text>
                  </View>
                )}

                {selectedVendor.vendor && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Vendor Information</Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="person" size={18} color="#64748B" />
                      <Text style={styles.infoText}>{selectedVendor.vendor.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="mail" size={18} color="#64748B" />
                      <Text style={styles.infoText}>{selectedVendor.vendor.email}</Text>
                    </View>
                    {selectedVendor.vendor.phone && (
                      <View style={styles.infoRow}>
                        <Ionicons name="call" size={18} color="#64748B" />
                        <Text style={styles.infoText}>{selectedVendor.vendor.phone}</Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedVendor.address && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Address</Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="location" size={18} color="#64748B" />
                      <Text style={styles.infoText}>{formatAddress(selectedVendor.address)}</Text>
                    </View>
                  </View>
                )}

                {selectedVendor.stats && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Performance Statistics</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.modalStatCard}>
                        <Ionicons name="receipt" size={24} color="#3B82F6" />
                        <Text style={styles.modalStatValue}>{selectedVendor.stats.totalOrders || 0}</Text>
                        <Text style={styles.modalStatLabel}>Total Orders</Text>
                      </View>
                      <View style={styles.modalStatCard}>
                        <Ionicons name="cube" size={24} color="#8B5CF6" />
                        <Text style={styles.modalStatValue}>{selectedVendor.stats.totalProducts || 0}</Text>
                        <Text style={styles.modalStatLabel}>Products</Text>
                      </View>
                      <View style={styles.modalStatCard}>
                        <Ionicons name="cash" size={24} color="#22C55E" />
                        <Text style={styles.modalStatValue}>{formatCurrency(selectedVendor.stats.totalRevenue || 0)}</Text>
                        <Text style={styles.modalStatLabel}>Revenue</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Other Details</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={18} color="#64748B" />
                    <Text style={styles.infoText}>Joined {formatDate(selectedVendor.createdAt)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="finger-print" size={18} color="#64748B" />
                    <Text style={styles.infoText}>ID: {selectedVendor._id}</Text>
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: "#1E293B" },
  filtersScroll: { maxHeight: 60, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  filtersContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9", marginRight: 8 },
  filterChipActive: { backgroundColor: "#22C55E" },
  filterText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  filterTextActive: { color: "#FFF" },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, color: "#94A3B8", marginTop: 16, fontWeight: "600" },
  emptyHint: { fontSize: 14, color: "#CBD5E1", marginTop: 8 },
  vendorCard: { backgroundColor: "#FFF", borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  storeIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#F3E8FF", justifyContent: "center", alignItems: "center", marginRight: 14 },
  cardInfo: { flex: 1 },
  storeName: { fontSize: 17, fontWeight: "700", color: "#1E293B", marginBottom: 6 },
  categoryBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  categoryText: { fontSize: 11, fontWeight: "600", color: "#3B82F6" },
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingLeft: 4 },
  vendorText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  statsRow: { flexDirection: "row", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "800", color: "#1E293B", marginTop: 6, marginBottom: 2 },
  statLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: "#F1F5F9", marginHorizontal: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  modalBody: { padding: 20 },
  modalStoreHeader: { alignItems: "center", marginBottom: 24 },
  modalStoreIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: "#F3E8FF", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  modalStoreName: { fontSize: 22, fontWeight: "800", color: "#1E293B", marginBottom: 10, textAlign: "center" },
  modalCategoryBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  modalCategoryText: { fontSize: 12, fontWeight: "700", color: "#3B82F6" },
  modalSection: { marginBottom: 24 },
  modalSectionTitle: { fontSize: 15, fontWeight: "700", color: "#64748B", marginBottom: 14 },
  modalText: { fontSize: 14, color: "#1E293B", lineHeight: 22 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, paddingVertical: 4 },
  infoText: { fontSize: 14, color: "#1E293B", flex: 1 },
  statsGrid: { flexDirection: "row", gap: 12 },
  modalStatCard: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 14, padding: 16, alignItems: "center" },
  modalStatValue: { fontSize: 20, fontWeight: "800", color: "#1E293B", marginTop: 8, marginBottom: 4 },
  modalStatLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", textAlign: "center" },
});