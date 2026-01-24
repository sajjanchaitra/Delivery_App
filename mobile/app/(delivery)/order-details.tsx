// app/(delivery)/order-details.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://13.203.206.134:5000";

type OrderStatus = "assigned" | "picked_up" | "on_the_way" | "delivered";

interface OrderDetails {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: {
    name?: string;
    phone?: string;
  };
  customerName: string;
  customerPhone: string;
  store: {
    name: string;
    phone?: string;
    address?: string | {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  deliveryAddress: {
    street?: string;
    houseNo?: string;
    area?: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total?: number;
  }>;
  total: number;
  deliveryFee: number;
  paymentMethod: string;
  customerNote?: string;
}

export default function DeliveryOrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/delivery/order/${params.orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log("📦 Order details:", data);

      if (data.success && data.order) {
        setOrder(data.order);
      }
    } catch (error) {
      console.error("❌ Error fetching order:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/delivery/orders/${params.orderId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();
      console.log("✅ Status update:", data);

      if (data.success) {
        setOrder(data.order);
        
        if (newStatus === "delivered") {
          // Navigate to success screen
          router.replace({
            pathname: "/(delivery)/delivery-success" as any,
            params: {
              orderId: order?.orderNumber,
              earnings: order?.deliveryFee,
            },
          });
        } else {
          Alert.alert("Success", `Order marked as ${getStatusText(newStatus)}`);
        }
      } else {
        Alert.alert("Error", data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
      Alert.alert("Error", "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkPickedUp = () => {
    Alert.alert(
      "Mark as Picked Up",
      "Have you picked up all items from the store?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Picked Up",
          onPress: () => updateOrderStatus("picked_up"),
        },
      ]
    );
  };

  const handleStartDelivery = () => {
    Alert.alert(
      "Start Delivery",
      "Ready to deliver to customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => updateOrderStatus("on_the_way"),
        },
      ]
    );
  };

  const handleMarkDelivered = () => {
    Alert.alert(
      "Complete Delivery",
      "Have you delivered the order to the customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delivered",
          style: "default",
          onPress: () => updateOrderStatus("delivered"),
        },
      ]
    );
  };

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "assigned": return "Assigned";
      case "picked_up": return "Picked Up";
      case "on_the_way": return "On the Way";
      case "delivered": return "Delivered";
      default: return status;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "assigned": return "#F59E0B";
      case "picked_up": return "#8B5CF6";
      case "on_the_way": return "#22C55E";
      case "delivered": return "#10B981";
      default: return "#94A3B8";
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return "Address not available";
    if (typeof address === "string") return address;
    
    const parts = [
      address.street || address.houseNo,
      address.area,
      address.landmark,
      address.city,
      address.pincode,
    ].filter(Boolean);
    
    return parts.join(", ") || "Address not available";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity 
          style={styles.backButton2}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order ID & Status */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{order.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsIcon}>
            <Ionicons name="wallet" size={24} color="#22C55E" />
          </View>
          <View style={styles.earningsInfo}>
            <Text style={styles.earningsLabel}>Your Earnings</Text>
            <Text style={styles.earningsValue}>₹{order.deliveryFee}</Text>
          </View>
        </View>

        {/* Store Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="storefront" size={20} color="#22C55E" />
              <Text style={styles.cardTitle}>Pickup from Store</Text>
            </View>
            {order.store.phone && (
              <TouchableOpacity 
                style={styles.callButton}
                activeOpacity={0.7}
                onPress={() => makeCall(order.store.phone!)}
              >
                <Ionicons name="call" size={18} color="#22C55E" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.detailName}>{order.store.name}</Text>
          {order.store.address && (
            <Text style={styles.detailText}>
              {typeof order.store.address === 'string' 
                ? order.store.address 
                : formatAddress(order.store.address)}
            </Text>
          )}
        </View>

        {/* Customer Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="person" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Deliver to Customer</Text>
            </View>
            <TouchableOpacity 
              style={styles.callButton}
              activeOpacity={0.7}
              onPress={() => makeCall(order.customerPhone)}
            >
              <Ionicons name="call" size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <Text style={styles.detailName}>{order.customerName}</Text>
          <Text style={styles.detailText}>{formatAddress(order.deliveryAddress)}</Text>
          {order.customerNote && (
            <View style={styles.noteContainer}>
              <Ionicons name="chatbox-outline" size={14} color="#F59E0B" />
              <Text style={styles.noteText}>Note: {order.customerNote}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items ({order.items?.length || 0})</Text>
          {order.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemIcon}>
                <Ionicons name="bag-handle" size={16} color="#64748B" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price} each</Text>
              </View>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Order Amount</Text>
            <Text style={styles.paymentValue}>₹{order.total}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Delivery Fee</Text>
            <Text style={styles.paymentValue}>₹{order.deliveryFee}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.paymentRow}>
            <Text style={styles.totalLabel}>Total to Collect</Text>
            <Text style={styles.totalValue}>₹{order.total + order.deliveryFee}</Text>
          </View>
          <View style={styles.paymentMethod}>
            <Ionicons name="cash" size={16} color="#22C55E" />
            <Text style={styles.paymentMethodText}>{order.paymentMethod.toUpperCase()}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {!updating && (
        <View style={styles.bottomBar}>
          {order.status === "assigned" && (
            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={handleMarkPickedUp}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Mark as Picked Up</Text>
            </TouchableOpacity>
          )}

          {order.status === "picked_up" && (
            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={handleStartDelivery}
            >
              <Ionicons name="bicycle" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Start Delivery</Text>
            </TouchableOpacity>
          )}

          {order.status === "on_the_way" && (
            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={handleMarkDelivered}
            >
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {updating && (
        <View style={styles.bottomBar}>
          <ActivityIndicator size="small" color="#22C55E" />
          <Text style={styles.updatingText}>Updating status...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
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
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  backButton2: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#22C55E",
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderId: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  earningsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  earningsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  earningsInfo: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 12,
    color: "#16A34A",
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#16A34A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  detailName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: "#94A3B8",
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22C55E",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22C55E",
  },
  bottomBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  updatingText: {
    fontSize: 14,
    color: "#64748B",
  },
});