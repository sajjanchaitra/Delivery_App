// app/(delivery)/orders.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "assigned" | "picked_up" | "on_the_way" | "delivered";

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    name?: string;
    phone?: string;
  };
  customerName: string;
  customerPhone: string;
  store: {
    _id: string;
    name: string;
    address?: string;
  };
  deliveryAddress: {
    street?: string;
    houseNo?: string;
    area?: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  items: any[];
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  createdAt: string;
}

const tabs = ["Available", "My Orders", "Completed"];

export default function DeliveryOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Available");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [activeTab])
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("❌ No auth token");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (activeTab === "Available") {
        // Fetch available orders (ready for pickup, not assigned)
        const response = await fetch(`${API_URL}/api/delivery/orders/available`, { headers });
        const data = await response.json();
        console.log("📦 Available orders:", data);
        
        if (data.success && data.orders) {
          setAvailableOrders(data.orders);
        } else {
          setAvailableOrders([]);
        }
      } else if (activeTab === "My Orders") {
        // Fetch my active orders
        const response = await fetch(`${API_URL}/api/delivery/orders/my-orders`, { headers });
        const data = await response.json();
        console.log("📦 My orders:", data);
        
        if (data.success && data.orders) {
          setMyOrders(data.orders.filter((o: Order) => o.status !== "delivered"));
        } else {
          setMyOrders([]);
        }
      } else if (activeTab === "Completed") {
        // Fetch completed orders
        const response = await fetch(`${API_URL}/api/delivery/orders/my-orders?status=delivered`, { headers });
        const data = await response.json();
        console.log("📦 Completed orders:", data);
        
        if (data.success && data.orders) {
          setCompletedOrders(data.orders);
        } else {
          setCompletedOrders([]);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      console.log("📦 Accepting order:", orderId);

      const response = await fetch(`${API_URL}/api/delivery/orders/${orderId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("✅ Accept response:", data);

      if (data.success) {
        Alert.alert("Success", "Order accepted successfully!");
        fetchOrders(); // Refresh orders
      } else {
        Alert.alert("Error", data.message || "Failed to accept order");
      }
    } catch (error) {
      console.error("❌ Error accepting order:", error);
      Alert.alert("Error", "Failed to accept order");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatAddress = (address: any) => {
    if (!address) return "Address not available";
    if (typeof address === "string") return address;
    
    const parts = [
      address.street || address.houseNo,
      address.area,
      address.landmark,
      address.city,
    ].filter(Boolean);
    
    return parts.join(", ") || "Address not available";
  };

  const getFilteredOrders = () => {
    if (activeTab === "Available") return availableOrders;
    if (activeTab === "My Orders") return myOrders;
    return completedOrders;
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.8}
      onPress={() => router.push({
        pathname: "/(delivery)/order-details",
        params: { orderId: item._id }
      })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{item.orderNumber}</Text>
          <Text style={styles.storeName}>{item.store?.name || "Store"}</Text>
        </View>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>Earn</Text>
          <Text style={styles.earningsValue}>₹{item.deliveryFee}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: "#22C55E" }]} />
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>Pickup from</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {item.store?.name || "Store"}
            </Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: "#EF4444" }]} />
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>Deliver to</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {formatAddress(item.deliveryAddress)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.orderMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="person" size={16} color="#64748B" />
          <Text style={styles.metaText}>{item.customerName || item.customer?.name || "Customer"}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="bag-handle" size={16} color="#64748B" />
          <Text style={styles.metaText}>{item.items?.length || 0} items</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="cash" size={16} color="#64748B" />
          <Text style={styles.metaText}>₹{item.total}</Text>
        </View>
      </View>

      {activeTab === "Available" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.acceptButton} 
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              acceptOrder(item._id);
            }}
          >
            <Text style={styles.acceptText}>Accept Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "My Orders" && (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge2, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "ready": return "#3B82F6";
      case "assigned": return "#F59E0B";
      case "picked_up": return "#8B5CF6";
      case "on_the_way": return "#22C55E";
      case "delivered": return "#10B981";
      default: return "#94A3B8";
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "ready": return "Ready for Pickup";
      case "assigned": return "Assigned";
      case "picked_up": return "Picked Up";
      case "on_the_way": return "On the Way";
      case "delivered": return "Delivered";
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredOrders()}
          renderItem={renderOrder}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No orders available</Text>
              <Text style={styles.emptyText}>
                {activeTab === "Available" 
                  ? "New orders will appear here"
                  : activeTab === "My Orders"
                  ? "You haven't accepted any orders yet"
                  : "No completed deliveries yet"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    position: "relative",
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabTextActive: {
    color: "#22C55E",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#22C55E",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  storeName: {
    fontSize: 13,
    color: "#64748B",
  },
  earningsBox: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  earningsLabel: {
    fontSize: 10,
    color: "#16A34A",
    marginBottom: 2,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16A34A",
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E2E8F0",
    marginLeft: 5,
    marginVertical: 4,
  },
  orderMeta: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#64748B",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    alignItems: "center",
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statusContainer: {
    alignItems: "flex-start",
  },
  statusBadge2: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});