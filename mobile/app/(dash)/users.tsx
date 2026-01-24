// app/(dash)/users.tsx
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
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "vendor" | "delivery_partner" | "admin";
  status: "active" | "inactive" | "blocked";
  createdAt: string;
  profile?: {
    address?: string;
  };
  stats?: {
    totalOrders?: number;
    totalSpent?: number;
    totalDeliveries?: number;
  };
}

const userRoleFilters = [
  { id: "all", label: "All Users" },
  { id: "customer", label: "Customers" },
  { id: "vendor", label: "Vendors" },
  { id: "delivery_partner", label: "Delivery Partners" },
];

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [selectedFilter])
  );

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      let url = `${API_URL}/api/admin/users`;
      const params = [];
      if (selectedFilter !== "all") {
        params.push(`role=${selectedFilter}`);
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
      console.log("Users data:", data);

      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateUserStatus = async (
    userId: string,
    newStatus: "active" | "blocked"
  ) => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", `User status updated to ${newStatus}`);
        setModalVisible(false);
        fetchUsers();
      } else {
        Alert.alert("Error", data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert("Error", "Failed to update user status");
    } finally {
      setUpdating(false);
    }
  };

  const getRoleIcon = (role: string): any => {
    const icons: Record<string, any> = {
      customer: "person",
      vendor: "storefront",
      delivery_partner: "bicycle",
      admin: "shield-checkmark",
    };
    return icons[role] || "person";
  };

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      customer: "#3B82F6",
      vendor: "#8B5CF6",
      delivery_partner: "#22C55E",
      admin: "#EF4444",
    };
    return colors[role] || "#64748B";
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: "#22C55E",
      inactive: "#F59E0B",
      blocked: "#EF4444",
    };
    return colors[status] || "#94A3B8";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading users...</Text>
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
          <Text style={styles.headerTitle}>Users</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchUsers}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                fetchUsers();
              }}
            >
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {userRoleFilters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => {
              setSelectedFilter(filter.id);
              setLoading(true);
            }}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Users List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchUsers();
            }}
            colors={["#22C55E"]}
          />
        }
      >
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          users.map((user) => (
            <TouchableOpacity
              key={user._id}
              style={styles.userCard}
              activeOpacity={0.8}
              onPress={() => openUserDetails(user)}
            >
              <View
                style={[
                  styles.userAvatar,
                  { backgroundColor: `${getRoleColor(user.role)}20` },
                ]}
              >
                <Ionicons
                  name={getRoleIcon(user.role)}
                  size={24}
                  color={getRoleColor(user.role)}
                />
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.phone && (
                  <Text style={styles.userPhone}>{user.phone}</Text>
                )}
              </View>

              <View style={styles.userRight}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: `${getRoleColor(user.role)}20` },
                  ]}
                >
                  <Text
                    style={[styles.roleText, { color: getRoleColor(user.role) }]}
                  >
                    {user.role.replace("_", " ")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(user.status)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(user.status) },
                    ]}
                  >
                    {user.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* User Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalUserHeader}>
                  <View
                    style={[
                      styles.modalAvatar,
                      {
                        backgroundColor: `${getRoleColor(selectedUser.role)}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getRoleIcon(selectedUser.role)}
                      size={32}
                      color={getRoleColor(selectedUser.role)}
                    />
                  </View>
                  <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(
                          selectedUser.status
                        )}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(selectedUser.status) },
                      ]}
                    >
                      {selectedUser.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Contact Info</Text>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" />
                    <Text style={styles.modalInfoText}>
                      {selectedUser.email}
                    </Text>
                  </View>
                  {selectedUser.phone && (
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="call-outline" size={18} color="#64748B" />
                      <Text style={styles.modalInfoText}>
                        {selectedUser.phone}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Role & Status</Text>
                  <View style={styles.modalInfoRow}>
                    <Ionicons
                      name={getRoleIcon(selectedUser.role)}
                      size={18}
                      color="#64748B"
                    />
                    <Text style={styles.modalInfoText}>
                      {selectedUser.role.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#64748B"
                    />
                    <Text style={styles.modalInfoText}>
                      Joined {formatDate(selectedUser.createdAt)}
                    </Text>
                  </View>
                </View>

                {selectedUser.profile?.address && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Address</Text>
                    <Text style={styles.modalText}>
                      {selectedUser.profile.address}
                    </Text>
                  </View>
                )}

                {selectedUser.stats && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Statistics</Text>
                    {selectedUser.stats.totalOrders !== undefined && (
                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Total Orders</Text>
                        <Text style={styles.statValue}>
                          {selectedUser.stats.totalOrders}
                        </Text>
                      </View>
                    )}
                    {selectedUser.stats.totalSpent !== undefined && (
                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Total Spent</Text>
                        <Text style={styles.statValue}>
                          ₹{selectedUser.stats.totalSpent}
                        </Text>
                      </View>
                    )}
                    {selectedUser.stats.totalDeliveries !== undefined && (
                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Total Deliveries</Text>
                        <Text style={styles.statValue}>
                          {selectedUser.stats.totalDeliveries}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Actions */}
                {selectedUser.role !== "admin" && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Actions</Text>
                    <View style={styles.actionButtons}>
                      {selectedUser.status === "active" && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.blockButton]}
                          onPress={() => {
                            Alert.alert("Block User", "Are you sure?", [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Block",
                                onPress: () =>
                                  updateUserStatus(selectedUser._id, "blocked"),
                              },
                            ]);
                          }}
                          disabled={updating}
                        >
                          <Ionicons name="ban" size={18} color="#FFF" />
                          <Text style={styles.actionButtonText}>Block User</Text>
                        </TouchableOpacity>
                      )}
                      {selectedUser.status === "blocked" && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.activateButton]}
                          onPress={() =>
                            updateUserStatus(selectedUser._id, "active")
                          }
                          disabled={updating}
                        >
                          <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                          <Text style={styles.actionButtonText}>
                            Activate User
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
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
    marginBottom: 16,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1E293B" },
  filtersScroll: {
    maxHeight: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filtersContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: "#22C55E" },
  filterText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  filterTextActive: { color: "#FFF" },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { fontSize: 16, color: "#94A3B8", marginTop: 16 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  userEmail: { fontSize: 13, color: "#64748B", marginTop: 2 },
  userPhone: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  userRight: { alignItems: "flex-end", gap: 6 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  modalBody: { padding: 20 },
  modalUserHeader: { alignItems: "center", marginBottom: 24 },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  modalSection: { marginBottom: 20 },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  modalInfoText: { fontSize: 14, color: "#1E293B" },
  modalText: { fontSize: 14, color: "#1E293B", lineHeight: 20 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  statLabel: { fontSize: 14, color: "#64748B" },
  statValue: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  actionButtons: { gap: 10 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  blockButton: { backgroundColor: "#EF4444" },
  activateButton: { backgroundColor: "#22C55E" },
  actionButtonText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
});