// app/(delivery)/home.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const API_URL = "http://13.203.206.134:5000";

type OrderStatus = "new" | "accepted" | "picked" | "delivering" | "completed";

interface OrderPreview {
  _id: string;
  orderId: string;
  orderNumber?: string;
  customer?: {
    _id: string;
    name: string;
    phone?: string;
  };
  customerName?: string;
  store?: {
    _id: string;
    name: string;
    address?: string;
  };
  storeName?: string;
  distance?: string;
  amount: number;
  totalAmount?: number;
  deliveryFee?: number;
  status: OrderStatus;
  pickupAddress: string;
  deliveryAddress: string;
  createdAt?: string;
  estimatedDeliveryTime?: string;
}

interface Stats {
  todayEarnings: number;
  todayDeliveries: number;
  rating: number;
  totalEarnings?: number;
  completedDeliveries?: number;
  onTimeRate?: number;
}

export default function DeliveryHome() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationText, setLocationText] = useState("Fetching location...");
  const [driverName, setDriverName] = useState("Driver");
  
  const [stats, setStats] = useState<Stats>({
    todayEarnings: 0,
    todayDeliveries: 0,
    rating: 0,
  });
  
  const [activeOrders, setActiveOrders] = useState<OrderPreview[]>([]);
  const [newOrders, setNewOrders] = useState<OrderPreview[]>([]);

  useEffect(() => {
    initializeScreen();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      fetchStats();
    }, [])
  );

  const initializeScreen = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDriverProfile(),
        fetchLocation(),
        fetchOrders(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error("Error initializing screen:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setDriverName("Driver");
        return;
      }

      const response = await fetch(`${API_URL}/api/delivery/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      if (data.success && data.driver) {
        setDriverName(data.driver.name || "Driver");
        setIsOnline(data.driver.isOnline !== false);
      }
    } catch (error) {
      console.error("Error fetching driver profile:", error);
      setDriverName("Driver");
    }
  };

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Location access denied");
        return;
      }

      setLocationText("Getting location...");
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address && address[0]) {
        const { city, district, subregion, street, name } = address[0];
        const primaryLocation = street || name || district || subregion || city || "Unknown";
        const secondaryLocation = city || district || "";
        
        setLocationText(
          primaryLocation === secondaryLocation || !secondaryLocation
            ? primaryLocation
            : `${primaryLocation}, ${secondaryLocation}`
        );

        await AsyncStorage.setItem(
          "driverLocation",
          JSON.stringify({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: address[0],
          })
        );
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setLocationText("Unable to get location");
    }
  };

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setActiveOrders([]);
        setNewOrders([]);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch active orders (accepted, picked, delivering)
      const activeResponse = await fetch(
        `${API_URL}/api/delivery/orders?status=active`,
        { headers }
      );
      const activeData = await activeResponse.json();

      // Fetch new orders (available for pickup)
      const newResponse = await fetch(
        `${API_URL}/api/delivery/orders?status=new&limit=10`,
        { headers }
      );
      const newData = await newResponse.json();

      console.log("Active orders:", activeData);
      console.log("New orders:", newData);

      if (activeData.success && activeData.orders) {
        setActiveOrders(activeData.orders);
      }

      if (newData.success && newData.orders) {
        setNewOrders(newData.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Set mock data for testing
      setActiveOrders([]);
      setNewOrders([]);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/delivery/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log("Stats:", data);

      if (data.success) {
        setStats({
          todayEarnings: data.stats?.todayEarnings || 0,
          todayDeliveries: data.stats?.todayDeliveries || 0,
          rating: data.stats?.rating || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const toggleOnlineStatus = async (value: boolean) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const response = await fetch(`${API_URL}/api/delivery/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isOnline: value }),
      });

      const data = await response.json();
      if (data.success) {
        setIsOnline(value);
      } else {
        Alert.alert("Error", data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/delivery/orders/${orderId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", "Order accepted!");
        fetchOrders();
      } else {
        Alert.alert("Error", data.message || "Failed to accept order");
      }
    } catch (error) {
      console.error("Error accepting order:", error);
      Alert.alert("Error", "Failed to accept order");
    }
  };

  const rejectOrder = async (orderId: string) => {
    Alert.alert(
      "Reject Order",
      "Are you sure you want to reject this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("authToken");
              if (!token) return;

              const response = await fetch(
                `${API_URL}/api/delivery/orders/${orderId}/reject`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              const data = await response.json();
              if (data.success) {
                fetchOrders();
              } else {
                Alert.alert("Error", data.message || "Failed to reject order");
              }
            } catch (error) {
              console.error("Error rejecting order:", error);
              Alert.alert("Error", "Failed to reject order");
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchStats()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "new": return "#3B82F6";
      case "accepted": return "#F59E0B";
      case "picked": return "#8B5CF6";
      case "delivering": return "#22C55E";
      default: return "#94A3B8";
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "new": return "New Order";
      case "accepted": return "Accepted";
      case "picked": return "Picked Up";
      case "delivering": return "On the Way";
      case "completed": return "Completed";
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {driverName}!</Text>
            <Text style={styles.subGreeting}>Ready to deliver?</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            activeOpacity={0.7}
            onPress={() => router.push("/(delivery)/notifications" as any)}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Online/Offline Toggle */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isOnline ? "#22C55E" : "#EF4444" }
            ]} />
            <Text style={styles.statusText}>
              You are {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
            thumbColor={isOnline ? "#22C55E" : "#F1F5F9"}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="cash" size={24} color="#22C55E" />
            </View>
            <Text style={styles.statValue}>₹{stats.todayEarnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="bicycle" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.todayDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="star" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.rating || 0}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Active Deliveries */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Deliveries</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeOrders.length}</Text>
              </View>
            </View>

            {activeOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                style={[styles.orderCard, styles.activeOrderCard]}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: "/(delivery)/order-details" as any,
                  params: { orderId: order._id }
                })}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>
                    {order.orderNumber || order.orderId || `#${order._id.slice(-6)}`}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(order.status)}20` }
                  ]}>
                    <Text style={[
                      styles.statusText2,
                      { color: getStatusColor(order.status) }
                    ]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderBody}>
                  <View style={styles.orderRoute}>
                    <View style={styles.routeItem}>
                      <View style={styles.routeDot} />
                      <View style={styles.routeInfo}>
                        <Text style={styles.routeLabel}>Pickup</Text>
                        <Text style={styles.routeText} numberOfLines={1}>
                          {order.pickupAddress}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.routeLine} />

                    <View style={styles.routeItem}>
                      <View style={[styles.routeDot, styles.routeDotDelivery]} />
                      <View style={styles.routeInfo}>
                        <Text style={styles.routeLabel}>Delivery</Text>
                        <Text style={styles.routeText} numberOfLines={1}>
                          {order.deliveryAddress}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.orderFooter}>
                    <View style={styles.orderMeta}>
                      <Ionicons name="location" size={16} color="#64748B" />
                      <Text style={styles.metaText}>{order.distance || "2.5 km"}</Text>
                    </View>
                    <Text style={styles.orderAmount}>
                      ₹{order.totalAmount || order.amount}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.navigateButton}
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: "/(delivery)/navigation" as any,
                    params: { orderId: order._id }
                  })}
                >
                  <Ionicons name="navigate" size={20} color="#FFFFFF" />
                  <Text style={styles.navigateText}>Navigate</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* New Orders */}
        {isOnline && newOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Orders</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(delivery)/orders" as any)}
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {newOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: "/(delivery)/order-details" as any,
                  params: { orderId: order._id }
                })}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>
                    {order.orderNumber || order.orderId || `#${order._id.slice(-6)}`}
                  </Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>

                <View style={styles.orderInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="storefront" size={16} color="#64748B" />
                    <Text style={styles.infoText}>
                      {order.store?.name || order.storeName || "Store"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={16} color="#64748B" />
                    <Text style={styles.infoText}>
                      {order.customer?.name || order.customerName || "Customer"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color="#64748B" />
                    <Text style={styles.infoText}>{order.distance || "2.5 km"}</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  <Text style={styles.earningsText}>
                    Earn ₹{Math.round((order.deliveryFee || order.amount * 0.1))}
                  </Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.rejectButton}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        rejectOrder(order._id);
                      }}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.acceptButton}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        acceptOrder(order._id);
                      }}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Offline Message */}
        {!isOnline && (
          <View style={styles.offlineCard}>
            <Ionicons name="moon" size={48} color="#94A3B8" />
            <Text style={styles.offlineTitle}>You're Offline</Text>
            <Text style={styles.offlineText}>
              Turn online to start receiving delivery requests
            </Text>
          </View>
        )}

        {/* Empty State */}
        {isOnline && newOrders.length === 0 && activeOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No orders available</Text>
            <Text style={styles.emptyText}>
              New delivery requests will appear here
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="home" size={24} color="#22C55E" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/orders" as any)}
        >
          <Ionicons name="list" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/earnings" as any)}
        >
          <Ionicons name="wallet" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push("/(delivery)/profile" as any)}
        >
          <Ionicons name="person" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
  },
  header: {
    backgroundColor: "#1E293B",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  badge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
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
  activeOrderCard: {
    borderWidth: 2,
    borderColor: "#22C55E",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText2: {
    fontSize: 12,
    fontWeight: "600",
  },
  newBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  orderBody: {
    marginBottom: 12,
  },
  orderRoute: {
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    marginTop: 4,
    marginRight: 12,
  },
  routeDotDelivery: {
    backgroundColor: "#EF4444",
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E2E8F0",
    marginLeft: 5,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  routeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#64748B",
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22C55E",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  navigateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  orderInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#64748B",
  },
  orderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  earningsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  rejectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rejectText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#22C55E",
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  offlineCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginHorizontal: 20,
    marginTop: 40,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
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
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
  navLabelActive: {
    color: "#22C55E",
    fontWeight: "600",
  },
});