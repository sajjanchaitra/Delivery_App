// Create: app/(customer)/checkout.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Address = {
  id: string;
  label: string;
  address: string;
  landmark: string;
  isDefault: boolean;
};

type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
};

const cartItems: CartItem[] = [
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
];

const addresses: Address[] = [
  {
    id: "1",
    label: "Home",
    address: "New mico layout, Kudlu, Bangalore - 560068",
    landmark: "Near Metro Station",
    isDefault: true,
  },
  {
    id: "2",
    label: "Office",
    address: "HSR Layout, Sector 2, Bangalore - 560102",
    landmark: "Opposite to Coffee Shop",
    isDefault: false,
  },
];

const paymentMethods: PaymentMethod[] = [
  {
    id: "cod",
    name: "Cash on Delivery",
    icon: "cash",
    description: "Pay when you receive",
  },
  {
    id: "upi",
    name: "UPI",
    icon: "wallet",
    description: "Google Pay, PhonePe, Paytm",
  },
  {
    id: "card",
    name: "Credit/Debit Card",
    icon: "card",
    description: "Visa, Mastercard, Rupay",
  },
  {
    id: "wallet",
    name: "Wallet",
    icon: "wallet",
    description: "Paytm, PhonePe Wallet",
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const [selectedAddress, setSelectedAddress] = useState<string>(
    addresses.find(a => a.isDefault)?.id || addresses[0].id
  );
  const [selectedPayment, setSelectedPayment] = useState<string>("cod");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 40;
  const tax = Math.round(subtotal * 0.05);
  const discount = 0;
  const total = subtotal + deliveryFee + tax - discount;

  const handlePlaceOrder = () => {
    const selectedAddr = addresses.find(a => a.id === selectedAddress);
    const selectedPay = paymentMethods.find(p => p.id === selectedPayment);

    Alert.alert(
      "Confirm Order",
      `Deliver to: ${selectedAddr?.label}\nPayment: ${selectedPay?.name}\nTotal: ₹${total}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Place Order",
          onPress: () => {
            // Navigate to order success/tracking screen
            router.push({
              pathname: "../order-success",
              params: {
                orderId: `ORD${Date.now()}`,
                amount: total,
              }
            });
          }
        }
      ]
    );
  };

  const selectedAddressData = addresses.find(a => a.id === selectedAddress);

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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.push("/(customer)/addresses")}
            >
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressLabelContainer}>
                <Ionicons 
                  name={selectedAddressData?.label === "Home" ? "home" : "briefcase"} 
                  size={18} 
                  color="#22C55E" 
                />
                <Text style={styles.addressLabel}>{selectedAddressData?.label}</Text>
              </View>
            </View>
            <Text style={styles.addressText}>{selectedAddressData?.address}</Text>
            {selectedAddressData?.landmark && (
              <View style={styles.landmarkContainer}>
                <Ionicons name="location-outline" size={14} color="#94A3B8" />
                <Text style={styles.landmarkText}>{selectedAddressData.landmark}</Text>
              </View>
            )}
          </View>

          {/* Other Addresses */}
          {addresses.filter(a => a.id !== selectedAddress).map(addr => (
            <TouchableOpacity
              key={addr.id}
              style={styles.addressCardAlt}
              activeOpacity={0.7}
              onPress={() => setSelectedAddress(addr.id)}
            >
              <View style={styles.radioButton}>
                <View style={styles.radioOuter} />
              </View>
              <View style={styles.addressContent}>
                <View style={styles.addressLabelContainer}>
                  <Ionicons 
                    name={addr.label === "Home" ? "home" : "briefcase"} 
                    size={16} 
                    color="#64748B" 
                  />
                  <Text style={styles.addressLabelAlt}>{addr.label}</Text>
                </View>
                <Text style={styles.addressTextAlt} numberOfLines={1}>
                  {addr.address}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          <View style={styles.orderItemsCard}>
            {cartItems.map(item => (
              <View key={item.id} style={styles.orderItem}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemUnit}>{item.unit}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentCard,
                selectedPayment === method.id && styles.paymentCardActive
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={styles.radioButton}>
                <View style={styles.radioOuter}>
                  {selectedPayment === method.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              <View style={[
                styles.paymentIconContainer,
                selectedPayment === method.id && styles.paymentIconActive
              ]}>
                <Ionicons 
                  name={method.icon as any} 
                  size={20} 
                  color={selectedPayment === method.id ? "#22C55E" : "#64748B"} 
                />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={[
                  styles.paymentName,
                  selectedPayment === method.id && styles.paymentNameActive
                ]}>
                  {method.name}
                </Text>
                <Text style={styles.paymentDesc}>{method.description}</Text>
              </View>
              {selectedPayment === method.id && (
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal ({cartItems.length} items)</Text>
              <Text style={styles.billValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>₹{deliveryFee}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tax (5%)</Text>
              <Text style={styles.billValue}>₹{tax}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: "#22C55E" }]}>Discount</Text>
                <Text style={[styles.billValue, { color: "#22C55E" }]}>-₹{discount}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.billRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalSection}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomTotal}>₹{total}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.placeOrderButton}
          activeOpacity={0.8}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderText}>Place Order</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  stepText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#22C55E",
    marginBottom: 12,
  },
  addressCardAlt: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addressLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  addressLabelAlt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  addressText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 8,
  },
  addressTextAlt: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  },
  landmarkContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  landmarkText: {
    fontSize: 13,
    color: "#94A3B8",
  },
  radioButton: {
    marginRight: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
  },
  addressContent: {
    flex: 1,
  },
  orderItemsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
  },
  orderItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: "cover",
  },
  itemDetails: {
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
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#64748B",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#22C55E",
    alignSelf: "center",
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentCardActive: {
    borderColor: "#22C55E",
    borderWidth: 2,
    backgroundColor: "#F0FDF4",
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  paymentIconActive: {
    backgroundColor: "#DCFCE7",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  paymentNameActive: {
    color: "#22C55E",
  },
  paymentDesc: {
    fontSize: 12,
    color: "#94A3B8",
  },
  billCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  billValue: {
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
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bottomLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  bottomTotal: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  placeOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});