// Create: app/(delivery)/order-details.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

const orderDetails = {
  orderId: "ORD12345",
  status: "accepted",
  customer: {
    name: "John Doe",
    phone: "+91 98765 43210",
    address: "Flat 201, Green Apartments, New mico layout, Kudlu, Bangalore - 560068",
    landmark: "Near Metro Station",
  },
  store: {
    name: "Westside Market",
    phone: "+91 98765 43200",
    address: "Shop 15, MG Road, Bangalore - 560001",
  },
  items: [
    { id: "1", name: "Basmati Rice", quantity: 2, unit: "5 kg" },
    { id: "2", name: "Fresh Tomatoes", quantity: 1, unit: "1 kg" },
    { id: "3", name: "Fresh Milk", quantity: 3, unit: "1 L" },
  ],
  payment: {
    method: "Cash on Delivery",
    amount: 1299,
    deliveryFee: 40,
  },
  earnings: 130,
  distance: "2.5 km",
  estimatedTime: "25 min",
};

const statusSteps = [
  { id: 1, name: "Order Accepted", completed: true },
  { id: 2, name: "Reached Store", completed: false },
  { id: 3, name: "Picked Up", completed: false },
  { id: 4, name: "On the Way", completed: false },
  { id: 5, name: "Delivered", completed: false },
];

export default function DeliveryOrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentStatus, setCurrentStatus] = useState("accepted");

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = () => {
    router.push({
      pathname: "/(delivery)/navigation",
      params: { orderId: params.orderId }
    });
  };

  const handleMarkPicked = () => {
    Alert.alert(
      "Mark as Picked",
      "Have you picked up all items from the store?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Picked",
          onPress: () => {
            setCurrentStatus("picked");
            Alert.alert("Success", "Order marked as picked up!");
          }
        }
      ]
    );
  };

  const handleStartDelivery = () => {
    router.push({
      pathname: "/(delivery)/navigation",
      params: { 
        orderId: params.orderId,
        destination: "customer"
      }
    });
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
          <Text style={styles.orderId}>{orderDetails.orderId}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Accepted</Text>
          </View>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsIcon}>
            <Ionicons name="wallet" size={24} color="#22C55E" />
          </View>
          <View style={styles.earningsInfo}>
            <Text style={styles.earningsLabel}>Your Earnings</Text>
            <Text style={styles.earningsValue}>₹{orderDetails.earnings}</Text>
          </View>
          <View style={styles.earningsDetails}>
            <Text style={styles.distanceText}>{orderDetails.distance}</Text>
            <Text style={styles.timeText}>{orderDetails.estimatedTime}</Text>
          </View>
        </View>

        {/* Progress Steps */}
        <View style={styles.progressCard}>
          <Text style={styles.cardTitle}>Delivery Progress</Text>
          {statusSteps.map((step, index) => (
            <View key={step.id} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                step.completed && styles.stepDotCompleted
              ]}>
                {step.completed && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              {index < statusSteps.length - 1 && (
                <View style={[
                  styles.stepLine,
                  step.completed && styles.stepLineCompleted
                ]} />
              )}
              <Text style={[
                styles.stepText,
                step.completed && styles.stepTextCompleted
              ]}>
                {step.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Store Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="storefront" size={20} color="#22C55E" />
              <Text style={styles.cardTitle}>Pickup from Store</Text>
            </View>
            <TouchableOpacity 
              style={styles.callButton}
              activeOpacity={0.7}
              onPress={() => makeCall(orderDetails.store.phone)}
            >
              <Ionicons name="call" size={18} color="#22C55E" />
            </TouchableOpacity>
          </View>
          <Text style={styles.detailName}>{orderDetails.store.name}</Text>
          <Text style={styles.detailText}>{orderDetails.store.address}</Text>
          <TouchableOpacity style={styles.navigateButton} activeOpacity={0.8}>
            <Ionicons name="navigate" size={18} color="#22C55E" />
            <Text style={styles.navigateText}>Navigate to Store</Text>
          </TouchableOpacity>
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
              onPress={() => makeCall(orderDetails.customer.phone)}
            >
              <Ionicons name="call" size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <Text style={styles.detailName}>{orderDetails.customer.name}</Text>
          <Text style={styles.detailText}>{orderDetails.customer.address}</Text>
          {orderDetails.customer.landmark && (
            <View style={styles.landmarkContainer}>
              <Ionicons name="location-outline" size={14} color="#94A3B8" />
              <Text style={styles.landmarkText}>{orderDetails.customer.landmark}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items ({orderDetails.items.length})</Text>
          {orderDetails.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemIcon}>
                <Ionicons name="bag-handle" size={16} color="#64748B" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
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
            <Text style={styles.paymentValue}>₹{orderDetails.payment.amount}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Delivery Fee</Text>
            <Text style={styles.paymentValue}>₹{orderDetails.payment.deliveryFee}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.paymentRow}>
            <Text style={styles.totalLabel}>Total to Collect</Text>
            <Text style={styles.totalValue}>
              ₹{orderDetails.payment.amount + orderDetails.payment.deliveryFee}
            </Text>
          </View>
          <View style={styles.paymentMethod}>
            <Ionicons name="cash" size={16} color="#22C55E" />
            <Text style={styles.paymentMethodText}>{orderDetails.payment.method}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {currentStatus === "accepted" && (
          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={handleMarkPicked}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Mark as Picked</Text>
          </TouchableOpacity>
        )}

        {currentStatus === "picked" && (
          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={handleStartDelivery}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Start Delivery</Text>
          </TouchableOpacity>
        )}
      </View>
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
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
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
  earningsDetails: {
    alignItems: "flex-end",
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
  },
  timeText: {
    fontSize: 12,
    color: "#16A34A",
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepDotCompleted: {
    backgroundColor: "#22C55E",
  },
  stepLine: {
    position: "absolute",
    left: 15,
    top: 32,
    width: 2,
    height: 24,
    backgroundColor: "#E2E8F0",
  },
  stepLineCompleted: {
    backgroundColor: "#22C55E",
  },
  stepText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  stepTextCompleted: {
    fontWeight: "600",
    color: "#1E293B",
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
    marginBottom: 12,
  },
  landmarkContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  landmarkText: {
    fontSize: 13,
    color: "#94A3B8",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  navigateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
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
  itemUnit: {
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionButton: {
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
});