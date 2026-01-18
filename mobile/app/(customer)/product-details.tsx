import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

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
  
  const productName = params.productName as string;
  const productPrice = Number(params.productPrice);
  const productUnit = params.productUnit as string;
  const productImage = params.productImage as string;
  const productRating = Number(params.productRating);
  const productDiscount = Number(params.productDiscount);

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSize, setSelectedSize] = useState("1 kg");

  const sizes = ["500 g", "1 kg", "2 kg", "5 kg"];

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  const originalPrice = productDiscount > 0 
    ? Math.round(productPrice / (1 - productDiscount / 100))
    : productPrice;

  const totalPrice = productPrice * quantity;

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
            
            <TouchableOpacity 
              style={styles.headerButton} 
              activeOpacity={0.7}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#EF4444" : "#1E293B"} 
              />
            </TouchableOpacity>
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
                <Text style={styles.stockText}>In Stock</Text>
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{productRating}</Text>
              <Text style={styles.reviewsText}>(128 reviews)</Text>
            </View>
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>₹{productPrice}</Text>
              {productDiscount > 0 && (
                <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              )}
              {productDiscount > 0 && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>Save ₹{originalPrice - productPrice}</Text>
                </View>
              )}
            </View>
            <Text style={styles.priceUnit}>per {productUnit}</Text>
          </View>

          {/* Size Selection */}
          <View style={styles.sizeSection}>
            <Text style={styles.sectionTitle}>Select Size</Text>
            <View style={styles.sizesContainer}>
              {sizes.map((size) => (
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
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Product Description</Text>
            <Text style={styles.descriptionText}>
              High-quality {productName.toLowerCase()} sourced from trusted suppliers. 
              Perfect for everyday use with premium quality guaranteed. Rich in nutrients 
              and carefully packaged to maintain freshness.
            </Text>
          </View>

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand</Text>
              <Text style={styles.detailValue}>Premium Choice</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{productUnit}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Storage</Text>
              <Text style={styles.detailValue}>Cool & Dry Place</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shelf Life</Text>
              <Text style={styles.detailValue}>6 months</Text>
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

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton} 
            activeOpacity={0.7}
            onPress={decreaseQuantity}
          >
            <Ionicons name="remove" size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton} 
            activeOpacity={0.7}
            onPress={increaseQuantity}
          >
            <Ionicons name="add" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.addToCartButton} 
          activeOpacity={0.8}
        >
          <Ionicons name="cart" size={20} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
          <Text style={styles.totalPriceText}>₹{totalPrice}</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
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
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
    gap: 10,
  },
  sizeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  sizeButtonActive: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  sizeTextActive: {
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
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748B",
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
    color: "#94A3B8",
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
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    paddingHorizontal: 16,
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
  addToCartText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 4,
  },
});