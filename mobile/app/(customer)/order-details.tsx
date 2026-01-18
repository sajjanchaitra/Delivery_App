// Create a new file: app/(customer)/order-details.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
};

type OrderDetails = {
  orderId: string;
  status: string;
  date: string;
  deliveryTime: string;
  storeName: string;
  storeImage: string;
  items: OrderItem[];
  deliveryAddress: {
    label: string;
    address: string;
    phone: string;
  };
  payment: {
    method: string;
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
  };
};

type StatusStep = {
  id: number;
  name: string;
  icon: string;
  completed: boolean;
};

const orderDetails: OrderDetails = {
  orderId: "ORD12345",
  status: "confirmed",
  date: "Jan 19, 2026",
  deliveryTime: "25-30 min",
  storeName: "Westside Market",
  storeImage: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300",
  items: [
    {
      id: "1",
      name: "Basmati Rice",
      price: 599,
      quantity: 2,
      unit: "5 kg",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300",
    },
    {
      id: "2",
      name: "Fresh Tomatoes",
      price: 60,
      quantity: 1,
      unit: "1 kg",
      image: "https://images.unsplash.com/photo-1546470427-e26264959c0e?w=300",
    },
  ],
  deliveryAddress: {
    label: "Home",
    address: "New mico layout, Kudlu, Bangalore",
    phone: "+91 98765 43210",
  },
  payment: {
    method: "UPI",
    subtotal: 1258,
    deliveryFee: 40,
    tax: 63,
    total: 1361,
  },
};

const statusSteps: StatusStep[] = [
  { id: 1, name: "Order Placed", icon: "checkmark-circle", completed: true },
  { id: 2, name: "Confirmed", icon: "checkmark-circle", completed: true },
  { id: 3, name: "Preparing", icon: "restaurant", completed: false },
  { id: 4, name: "Out for Delivery", icon: "bicycle", completed: false },
  { id: 5, name: "Delivered", icon: "home", completed: false },
];

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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
        <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
          <Ionicons name="help-circle-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderId}>{orderDetails.orderId}</Text>
              <Text style={styles.orderDate}>{orderDetails.date}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Confirmed</Text>
            </View>
          </View>

          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            {statusSteps.map((step, index) => (
              <View key={step.id} style={styles.stepWrapper}>
                <View style={styles.stepItem}>
                  <View style={[
                    styles.stepIconContainer,
                    step.completed && styles.stepIconCompleted
                  ]}>
                    <Ionicons 
                      name={step.icon as any} 
                      size={20} 
                      color={step.completed ? "#FFFFFF" : "#94A3B8"} 
                    />
                  </View>
                  <Text style={[
                    styles.stepName,
                    step.completed && styles.stepNameCompleted
                  ]}>
                    {step.name}
                  </Text>
                </View>
                {index < statusSteps.length - 1 && (
                  <View style={[
                    styles.stepLine,
                    step.completed && styles.stepLineCompleted
                  ]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Store Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Details</Text>
          <View style={styles.storeCard}>
            <Image 
              source={{ uri: orderDetails.storeImage }} 
              style={styles.storeImage}
            />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{orderDetails.storeName}</Text>
              <View style={styles.storeMetaRow}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.storeMetaText}>{orderDetails.deliveryTime}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton} activeOpacity={0.7}>
              <Ionicons name="call" size={20} color="#22C55E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({orderDetails.items.length})</Text>
          {orderDetails.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
                <Text style={styles.itemPrice}>₹{item.price} × {item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressIconContainer}>
              <Ionicons name="location" size={20} color="#22C55E" />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>{orderDetails.deliveryAddress.label}</Text>
              <Text style={styles.addressText}>{orderDetails.deliveryAddress.address}</Text>
              <Text style={styles.addressPhone}>{orderDetails.deliveryAddress.phone}</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Subtotal</Text>
              <Text style={styles.paymentValue}>₹{orderDetails.payment.subtotal}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Delivery Fee</Text>
              <Text style={styles.paymentValue}>₹{orderDetails.payment.deliveryFee}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tax</Text>
              <Text style={styles.paymentValue}>₹{orderDetails.payment.tax}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{orderDetails.payment.total}</Text>
            </View>
            <View style={styles.paymentMethodRow}>
              <Ionicons name="wallet-outline" size={16} color="#64748B" />
              <Text style={styles.paymentMethodText}>Paid via {orderDetails.payment.method}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.supportButton} activeOpacity={0.8}>
          <Ionicons name="chatbubble-outline" size={20} color="#1E293B" />
          <Text style={styles.supportText}>Get Help</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.trackButton} activeOpacity={0.8}>
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
          <Text style={styles.trackText}>Track Order</Text>
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
    flex: 1,
    textAlign: "center",
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: "#94A3B8",
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
  stepsContainer: {
    paddingLeft: 8,
  },
  stepWrapper: {
    position: "relative",
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepIconCompleted: {
    backgroundColor: "#22C55E",
  },
  stepName: {
    fontSize: 14,
    color: "#94A3B8",
  },
  stepNameCompleted: {
    color: "#1E293B",
    fontWeight: "600",
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E2E8F0",
    marginLeft: 19,
    marginBottom: 8,
  },
  stepLineCompleted: {
    backgroundColor: "#22C55E",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  storeCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  storeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: "cover",
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  storeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeMetaText: {
    fontSize: 13,
    color: "#64748B",
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: "cover",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: "#64748B",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
    alignSelf: "center",
  },
  addressCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 13,
    color: "#64748B",
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
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
    marginVertical: 8,
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
  paymentMethodRow: {
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
    color: "#64748B",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 12,
  },
  supportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  supportText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  trackButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  trackText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});