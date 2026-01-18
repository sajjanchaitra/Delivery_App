// app/(customer)/cart.tsx
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getCartTotal, getItemCount, clearCart } = useCart();

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      Alert.alert(
        "Remove Item",
        "Are you sure you want to remove this item from cart?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Remove", 
            style: "destructive",
            onPress: () => removeItem(id)
          }
        ]
      );
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id: string, name: string) => {
    Alert.alert(
      "Remove Item",
      `Remove ${name} from cart?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => removeItem(id)
        }
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from cart?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: () => clearCart()
        }
      ]
    );
  };

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 0 ? (subtotal > 500 ? 0 : 40) : 0;
  const tax = Math.round(subtotal * 0.05);
  const discount = subtotal > 1000 ? 50 : 0;
  const total = subtotal + deliveryFee + tax - discount;

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
        <View style={styles.headerRight}>
          {items.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              activeOpacity={0.7}
              onPress={handleClearCart}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{getItemCount()}</Text>
          </View>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cart-outline" size={100} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Looks like you haven't added anything to your cart yet
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            activeOpacity={0.8}
            onPress={() => router.push("/(customer)/home")}
          >
            <Ionicons name="storefront" size={20} color="#FFFFFF" />
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
            {/* Free Delivery Banner */}
            {subtotal > 0 && subtotal < 500 && (
              <View style={styles.deliveryBanner}>
                <Ionicons name="bicycle" size={20} color="#F59E0B" />
                <Text style={styles.deliveryText}>
                  Add ₹{500 - subtotal} more for FREE delivery!
                </Text>
              </View>
            )}

            {subtotal >= 500 && (
              <View style={[styles.deliveryBanner, styles.deliveryBannerSuccess]}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text style={[styles.deliveryText, styles.deliveryTextSuccess]}>
                  Yay! You've got FREE delivery! 🎉
                </Text>
              </View>
            )}

            {/* Cart Items */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionHeader}>
                {getItemCount()} {getItemCount() === 1 ? 'Item' : 'Items'} in Cart
              </Text>
              
              {items.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemSize}>{item.size}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                      {item.discount && item.discount > 0 && (
                        <View style={styles.itemDiscountBadge}>
                          <Text style={styles.itemDiscountText}>
                            {item.discount}% OFF
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemSubtotal}>
                      Subtotal: ₹{item.price * item.quantity}
                    </Text>
                  </View>

                  <View style={styles.itemActions}>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      activeOpacity={0.7}
                      onPress={() => handleRemoveItem(item.id, item.name)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>

                    <View style={styles.quantityControl}>
                      <TouchableOpacity 
                        style={[styles.quantityButton, item.quantity === 1 && styles.quantityButtonDecrease]}
                        activeOpacity={0.7}
                        onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Ionicons 
                          name={item.quantity === 1 ? "trash-outline" : "remove"} 
                          size={16} 
                          color={item.quantity === 1 ? "#EF4444" : "#1E293B"} 
                        />
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        activeOpacity={0.7}
                        onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={16} color="#1E293B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Coupon Section */}
            <TouchableOpacity style={styles.couponSection} activeOpacity={0.7}>
              <View style={styles.couponIcon}>
                <Ionicons name="pricetag" size={20} color="#22C55E" />
              </View>
              <View style={styles.couponContent}>
                <Text style={styles.couponTitle}>Apply Coupon</Text>
                <Text style={styles.couponSubtitle}>
                  Save more with discount codes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Bill Details */}
            <View style={styles.billSection}>
              <Text style={styles.billTitle}>Bill Details</Text>
              
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>
                  Item Total ({getItemCount()} {getItemCount() === 1 ? 'item' : 'items'})
                </Text>
                <Text style={styles.billValue}>₹{subtotal}</Text>
              </View>
              
              <View style={styles.billRow}>
                <View style={styles.billLabelWithIcon}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  {deliveryFee === 0 && subtotal > 0 && (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeText}>FREE</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.billValue, deliveryFee === 0 && styles.billValueFree]}>
                  {deliveryFee === 0 ? '₹0' : `₹${deliveryFee}`}
                </Text>
              </View>
              
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Tax & Charges (5%)</Text>
                <Text style={styles.billValue}>₹{tax}</Text>
              </View>

              {discount > 0 && (
                <View style={styles.billRow}>
                  <View style={styles.billLabelWithIcon}>
                    <Text style={styles.billLabel}>Discount Applied</Text>
                    <View style={styles.discountAppliedBadge}>
                      <Text style={styles.discountAppliedText}>SAVED</Text>
                    </View>
                  </View>
                  <Text style={styles.discountValue}>-₹{discount}</Text>
                </View>
              )}
              
              <View style={styles.divider} />
              
              <View style={styles.billRow}>
                <Text style={styles.totalLabel}>To Pay</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>

              {discount === 0 && subtotal > 0 && subtotal < 1000 && (
                <View style={styles.savingsHint}>
                  <Ionicons name="information-circle" size={16} color="#F59E0B" />
                  <Text style={styles.savingsHintText}>
                    Add ₹{1000 - subtotal} more to save ₹50!
                  </Text>
                </View>
              )}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Bottom Checkout Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.totalSection}>
              <View>
                <Text style={styles.bottomLabel}>Total Amount</Text>
                {discount > 0 && (
                  <Text style={styles.bottomSavings}>You saved ₹{discount}!</Text>
                )}
              </View>
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clearButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
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
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 20,
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
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
  deliveryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  deliveryBannerSuccess: {
    backgroundColor: "#DCFCE7",
  },
  deliveryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#D97706",
  },
  deliveryTextSuccess: {
    color: "#16A34A",
  },
  itemsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    resizeMode: "cover",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
  },
  itemDiscountBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemDiscountText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#EF4444",
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  itemActions: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginLeft: 8,
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
    borderRadius: 6,
  },
  quantityButtonDecrease: {
    backgroundColor: "#FEE2E2",
  },
  quantity: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    paddingHorizontal: 12,
    minWidth: 32,
    textAlign: "center",
  },
  couponSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    borderStyle: "dashed",
  },
  couponIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  couponContent: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#16A34A",
    marginBottom: 2,
  },
  couponSubtitle: {
    fontSize: 12,
    color: "#4ADE80",
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
    alignItems: "center",
    marginBottom: 12,
  },
  billLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  billValueFree: {
    color: "#22C55E",
    textDecorationLine: "line-through",
  },
  freeBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  discountAppliedBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountAppliedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  discountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22C55E",
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
    fontSize: 20,
    fontWeight: "700",
    color: "#22C55E",
  },
  savingsHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  savingsHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
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
    marginBottom: 2,
  },
  bottomSavings: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
  },
  bottomTotal: {
    fontSize: 24,
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