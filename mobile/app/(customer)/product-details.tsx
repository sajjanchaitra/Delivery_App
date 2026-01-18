// app/(customer)/product-details.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";

const { width, height } = Dimensions.get("window");

// Size pricing multipliers
const sizeMultipliers: { [key: string]: number } = {
  "500 g": 0.5,
  "1 kg": 1,
  "2 kg": 1.9,
  "5 kg": 4.5,
};

// Mock related products
const relatedProducts = [
  {
    id: "r1",
    name: "Premium Rice",
    price: 699,
    unit: "5 kg",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300",
    rating: 4.6,
  },
  {
    id: "r2",
    name: "Organic Flour",
    price: 349,
    unit: "5 kg",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
    rating: 4.5,
  },
  {
    id: "r3",
    name: "Brown Sugar",
    price: 55,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300",
    rating: 4.4,
  },
];

export default function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addItem, isInCart, getItemCount } = useCart();
  
  const productId = params.productId as string;
  const productName = params.productName as string;
  const basePrice = Number(params.productPrice);
  const productUnit = params.productUnit as string;
  const productImage = params.productImage as string;
  const productRating = Number(params.productRating);
  const productDiscount = Number(params.productDiscount) || 0;

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSize, setSelectedSize] = useState(productUnit || "1 kg");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const sizes = ["500 g", "1 kg", "2 kg", "5 kg"];

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  // Calculate price based on selected size
  const getSizePrice = () => {
    const multiplier = sizeMultipliers[selectedSize] || 1;
    return Math.round(basePrice * multiplier);
  };

  const currentPrice = getSizePrice();
  
  const originalPrice = productDiscount > 0 
    ? Math.round(currentPrice / (1 - productDiscount / 100))
    : currentPrice;

  const totalPrice = currentPrice * quantity;
  const totalSavings = productDiscount > 0 
    ? (originalPrice - currentPrice) * quantity 
    : 0;

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    // Add item to cart
    addItem({
      productId,
      name: productName,
      price: currentPrice,
      quantity,
      size: selectedSize,
      unit: selectedSize,
      image: productImage,
      discount: productDiscount,
    });

    // Show success feedback
    setTimeout(() => {
      setIsAddingToCart(false);
      Alert.alert(
        "Added to Cart! 🎉",
        `${quantity}x ${productName} (${selectedSize}) has been added to your cart.\n\nTotal items in cart: ${getItemCount() + quantity}`,
        [
          {
            text: "Continue Shopping",
            style: "cancel"
          },
          {
            text: "View Cart",
            onPress: () => router.push("/(customer)/cart")
          }
        ]
      );
      
      // Reset quantity after adding
      setQuantity(1);
    }, 500);
  };

  const handleBuyNow = () => {
    // Add to cart first
    addItem({
      productId,
      name: productName,
      price: currentPrice,
      quantity,
      size: selectedSize,
      unit: selectedSize,
      image: productImage,
      discount: productDiscount,
    });

    // Navigate directly to checkout
    setTimeout(() => {
      router.push("/(customer)/checkout");
    }, 100);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? "Removed from Favorites" : "Added to Favorites",
      isFavorite 
        ? `${productName} has been removed from your favorites.`
        : `${productName} has been added to your favorites.`
    );
  };

  const inCart = isInCart(productId, selectedSize);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Image Section */}
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: productImage }} 
            style={styles.productImage}
          />
          
          {/* Header Buttons */}
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton} 
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.headerButton} 
                activeOpacity={0.7}
                onPress={toggleFavorite}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavorite ? "#EF4444" : "#1E293B"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerButton} 
                activeOpacity={0.7}
                onPress={() => router.push("/(customer)/cart")}
              >
                <Ionicons name="cart-outline" size={24} color="#1E293B" />
                {getItemCount() > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{getItemCount()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {productDiscount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{productDiscount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Info Section */}
        <View style={styles.infoSection}>
          {/* Product Name and Rating */}
          <View style={styles.nameContainer}>
            <View style={styles.nameAndBadge}>
              <Text style={styles.productName}>{productName}</Text>
              <View style={styles.stockBadge}>
                <View style={styles.stockDot} />
                <Text style={styles.stockText}>In Stock</Text>
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{productRating}</Text>
              <Text style={styles.reviewsText}>(128 reviews)</Text>
            </View>
          </View>

          {/* Already in Cart Badge */}
          {inCart && (
            <View style={styles.inCartBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              <Text style={styles.inCartText}>
                This item (size: {selectedSize}) is already in your cart
              </Text>
            </View>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>₹{currentPrice}</Text>
              {productDiscount > 0 && (
                <>
                  <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveText}>Save ₹{originalPrice - currentPrice}</Text>
                  </View>
                </>
              )}
            </View>
            <Text style={styles.priceUnit}>per {selectedSize}</Text>
          </View>

          {/* Size Selection */}
          <View style={styles.sizeSection}>
            <Text style={styles.sectionTitle}>Select Size</Text>
            <View style={styles.sizesContainer}>
              {sizes.map((size) => {
                const sizePrice = Math.round(basePrice * (sizeMultipliers[size] || 1));
                return (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      selectedSize === size && styles.sizeButtonActive
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[
                      styles.sizeText,
                      selectedSize === size && styles.sizeTextActive
                    ]}>
                      {size}
                    </Text>
                    <Text style={[
                      styles.sizePriceText,
                      selectedSize === size && styles.sizePriceTextActive
                    ]}>
                      ₹{sizePrice}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={[styles.quantityBtn, quantity === 1 && styles.quantityBtnDisabled]} 
                activeOpacity={0.7}
                onPress={decreaseQuantity}
                disabled={quantity === 1}
              >
                <Ionicons name="remove" size={20} color={quantity === 1 ? "#CBD5E1" : "#1E293B"} />
              </TouchableOpacity>
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityNumber}>{quantity}</Text>
              </View>
              <TouchableOpacity 
                style={styles.quantityBtn} 
                activeOpacity={0.7}
                onPress={increaseQuantity}
              >
                <Ionicons name="add" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Price Summary Card */}
          {(quantity > 1 || totalSavings > 0) && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({quantity} items)</Text>
                <Text style={styles.summaryValue}>₹{currentPrice * quantity}</Text>
              </View>
              {totalSavings > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Your Savings</Text>
                  <Text style={styles.savingsValue}>-₹{totalSavings}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{totalPrice}</Text>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Product Description</Text>
            <Text style={styles.descriptionText}>
              High-quality {productName.toLowerCase()} sourced from trusted suppliers. 
              Perfect for everyday use with premium quality guaranteed. Rich in nutrients 
              and carefully packaged to maintain freshness. Ideal for cooking, baking, 
              and various culinary applications.
            </Text>
          </View>

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="ribbon-outline" size={18} color="#22C55E" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Brand</Text>
                <Text style={styles.detailValue}>Premium Choice</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="scale-outline" size={18} color="#22C55E" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{selectedSize}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="thermometer-outline" size={18} color="#22C55E" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Storage</Text>
                <Text style={styles.detailValue}>Cool & Dry Place</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={18} color="#22C55E" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Shelf Life</Text>
                <Text style={styles.detailValue}>6 months from mfg.</Text>
              </View>
            </View>
          </View>

          {/* Related Products */}
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Text style={styles.sectionTitle}>You May Also Like</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScroll}
            >
              {relatedProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.relatedCard}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.relatedImage}
                  />
                  <Text style={styles.relatedName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.relatedUnit}>{item.unit}</Text>
                  <View style={styles.relatedFooter}>
                    <Text style={styles.relatedPrice}>₹{item.price}</Text>
                    <View style={styles.relatedRating}>
                      <Ionicons name="star" size={10} color="#F59E0B" />
                      <Text style={styles.relatedRatingText}>{item.rating}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={{ height: 160 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>Total Price</Text>
          <Text style={styles.bottomPrice}>₹{totalPrice}</Text>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.buyNowButton} 
            activeOpacity={0.8}
            onPress={handleBuyNow}
          >
            <Ionicons name="flash" size={20} color="#1E293B" />
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.addToCartButton, isAddingToCart && styles.addToCartButtonDisabled]} 
            activeOpacity={0.8}
            onPress={handleAddToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <>
                <Text style={styles.addToCartText}>Adding...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cart" size={20} color="#FFFFFF" />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageSection: {
    width: width,
    height: height * 0.4,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerButtons: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  discountBadge: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  nameContainer: {
    marginBottom: 16,
  },
  nameAndBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    marginRight: 12,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  reviewsText: {
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 4,
  },
  inCartBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  inCartText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#16A34A",
  },
  priceSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#22C55E",
  },
  originalPrice: {
    fontSize: 18,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  saveBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
  },
  priceUnit: {
    fontSize: 13,
    color: "#64748B",
  },
  sizeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  sizesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    minWidth: 80,
    alignItems: "center",
  },
  sizeButtonActive: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  sizeTextActive: {
    color: "#22C55E",
  },
  sizePriceText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  sizePriceTextActive: {
    color: "#16A34A",
    fontWeight: "600",
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quantityBtnDisabled: {
    backgroundColor: "#F1F5F9",
  },
  quantityDisplay: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  quantityNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  summaryCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  savingsValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22C55E",
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748B",
  },
  detailsSection: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  relatedSection: {
    marginTop: 8,
  },
  relatedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
    color: "#22C55E",
  },
  relatedScroll: {
    paddingRight: 20,
  },
  relatedCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  relatedImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  relatedName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 8,
    marginHorizontal: 8,
    minHeight: 32,
  },
  relatedUnit: {
    fontSize: 11,
    color: "#94A3B8",
    marginHorizontal: 8,
    marginTop: 2,
  },
  relatedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 8,
  },
  relatedPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22C55E",
  },
  relatedRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  relatedRatingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E293B",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomPriceInfo: {
    marginBottom: 12,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  bottomPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#22C55E",
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
  },
  buyNowButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
  },
  buyNowText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  addToCartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});