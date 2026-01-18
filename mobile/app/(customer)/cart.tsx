// app/(customer)/cart.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
  {
    id: "3",
    name: "Fresh Milk",
    price: 60,
    quantity: 3,
    unit: "1 L",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",
  },
];

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>(cartItems);

  const updateQuantity = (id: string, change: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 40;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;

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
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{items.length}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={100} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add items to get started</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            activeOpacity={0.8}
            onPress={() => router.push("/(customer)/home")}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Cart Items */}
            <View style={styles.itemsSection}>
              {items.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemUnit}>{item.unit}</Text>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                  </View>

                  <View style={styles.itemActions}>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      activeOpacity={0.7}
                      onPress={() => removeItem(item.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>

                    <View style={styles.quantityControl}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        activeOpacity={0.7}
                        onPress={() => updateQuantity(item.id, -1)}
                      >
                        <Ionicons name="remove" size={16} color="#1E293B" />
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        activeOpacity={0.7}
                        onPress={() => updateQuantity(item.id, 1)}
                      >
                        <Ionicons name="add" size={16} color="#1E293B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Coupon Section */}
            <View style={styles.couponSection}>
              <View style={styles.couponIcon}>
                <Ionicons name="pricetag" size={20} color="#22C55E" />
              </View>
              <Text style={styles.couponText}>Apply Coupon</Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>

            {/* Bill Details */}
            <View style={styles.billSection}>
              <Text style={styles.billTitle}>Bill Details</Text>
              
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Subtotal</Text>
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
              
              <View style={styles.divider} />
              
              <View style={styles.billRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Bottom Checkout Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.totalSection}>
              <Text style={styles.bottomLabel}>Total</Text>
              <Text style={styles.bottomTotal}>₹{total}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.checkoutButton}
              activeOpacity={0.8}
              onPress={() => router.push("/(customer)/checkout")}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  cartBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  itemsSection: {
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: "cover",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
  },
  itemActions: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  deleteButton: {
    padding: 4,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  quantity: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    paddingHorizontal: 12,
  },
  couponSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderStyle: "dashed",
  },
  couponIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  couponText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#16A34A",
  },
  billSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
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
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
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
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});