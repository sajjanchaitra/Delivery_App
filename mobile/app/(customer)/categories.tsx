// app/(customer)/categories.tsx
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
import { useCart } from "../../context/CartContext";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 56) / 2;

// Type definitions
type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  rating: number;
  discount: number;
};

type ProductsData = {
  [key: string]: Product[];
};

// Mock products data
const products: ProductsData = {
  "1": [
    {
      id: "g1",
      name: "Basmati Rice",
      price: 599,
      unit: "5 kg",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300",
      rating: 4.5,
      discount: 10,
    },
    {
      id: "g2",
      name: "Wheat Flour",
      price: 299,
      unit: "5 kg",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
      rating: 4.3,
      discount: 0,
    },
    {
      id: "g3",
      name: "Sugar",
      price: 45,
      unit: "1 kg",
      image: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300",
      rating: 4.7,
      discount: 5,
    },
    {
      id: "g4",
      name: "Cooking Oil",
      price: 189,
      unit: "1 L",
      image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300",
      rating: 4.4,
      discount: 15,
    },
  ],
  "2": [
    {
      id: "f1",
      name: "Fresh Bread",
      price: 40,
      unit: "500 g",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
      rating: 4.6,
      discount: 0,
    },
    {
      id: "f2",
      name: "Cookies Pack",
      price: 120,
      unit: "400 g",
      image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300",
      rating: 4.8,
      discount: 20,
    },
  ],
  "3": [
    {
      id: "v1",
      name: "Fresh Tomatoes",
      price: 60,
      unit: "1 kg",
      image: "https://images.unsplash.com/photo-1546470427-e26264959c0e?w=300",
      rating: 4.5,
      discount: 0,
    },
    {
      id: "v2",
      name: "Potatoes",
      price: 30,
      unit: "1 kg",
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300",
      rating: 4.4,
      discount: 0,
    },
    {
      id: "v3",
      name: "Onions",
      price: 40,
      unit: "1 kg",
      image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=300",
      rating: 4.3,
      discount: 0,
    },
    {
      id: "v4",
      name: "Carrots",
      price: 50,
      unit: "500 g",
      image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300",
      rating: 4.6,
      discount: 0,
    },
  ],
  "4": [
    {
      id: "d1",
      name: "Fresh Milk",
      price: 60,
      unit: "1 L",
      image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",
      rating: 4.7,
      discount: 0,
    },
    {
      id: "d2",
      name: "Cheddar Cheese",
      price: 180,
      unit: "200 g",
      image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300",
      rating: 4.8,
      discount: 10,
    },
    {
      id: "d3",
      name: "Greek Yogurt",
      price: 90,
      unit: "400 g",
      image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300",
      rating: 4.6,
      discount: 5,
    },
  ],
};

const categoryNames: { [key: string]: string } = {
  "1": "Grocery",
  "2": "Food",
  "3": "Vegetables",
  "4": "Dairy",
};

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    addItem,
    getItemCount,
    isInCart,
    getItemQuantity,
    increaseItem,
    decreaseItem,
  } = useCart();

  const categoryId = (params.categoryId as string) || "1";
  const categoryName = (params.categoryName as string) || categoryNames[categoryId];

  const categoryProducts: Product[] = products[categoryId] || products["1"];

  const [favorites, setFavorites] = useState<string[]>([]);

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: "/(customer)/product-details",
      params: {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        productUnit: product.unit,
        productImage: product.image,
        productRating: product.rating,
        productDiscount: product.discount,
      },
    });
  };

  const handleAddFirstTime = (product: Product, event: any) => {
    event.stopPropagation();

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: product.unit,
      unit: product.unit,
      image: product.image,
      discount: product.discount,
    });
  };

  const toggleFavorite = (productId: string, event: any) => {
    event.stopPropagation();

    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{categoryName}</Text>

        <TouchableOpacity
          style={styles.cartButton}
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

      {/* Products Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.resultText}>{categoryProducts.length} Products Found</Text>

        <View style={styles.productsGrid}>
          {categoryProducts.map((product) => {
            const isFavorite = favorites.includes(product.id);
            const inCart = isInCart(product.id, product.unit);
            const qty = getItemQuantity(product.id, product.unit);

            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                activeOpacity={0.8}
                onPress={() => handleProductPress(product)}
              >
                <View style={styles.productImageContainer}>
                  <Image source={{ uri: product.image }} style={styles.productImage} />

                  {product.discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{product.discount}% OFF</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.favoriteButton}
                    activeOpacity={0.7}
                    onPress={(e) => toggleFavorite(product.id, e)}
                  >
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={20}
                      color={isFavorite ? "#EF4444" : "#1E293B"}
                    />
                  </TouchableOpacity>

                  {inCart && (
                    <View style={styles.inCartBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.inCartText}>In Cart</Text>
                    </View>
                  )}
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productUnit}>{product.unit}</Text>

                  <View style={styles.productFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.productPrice}>₹{product.price}</Text>
                      {product.discount > 0 && (
                        <Text style={styles.originalPrice}>
                          ₹{Math.round(product.price / (1 - product.discount / 100))}
                        </Text>
                      )}
                    </View>

                    {/* ✅ ADD / +/- Quantity */}
                    {qty === 0 ? (
                      <TouchableOpacity
                        style={styles.addButton}
                        activeOpacity={0.7}
                        onPress={(e) => handleAddFirstTime(product, e)}
                      >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyBox}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          activeOpacity={0.7}
                          onPress={(e) => {
                            e.stopPropagation();
                            decreaseItem(product.id, product.unit);
                          }}
                        >
                          <Ionicons name="remove" size={16} color="#1E293B" />
                        </TouchableOpacity>

                        <Text style={styles.qtyText}>{qty}</Text>

                        <TouchableOpacity
                          style={styles.qtyBtn}
                          activeOpacity={0.7}
                          onPress={(e) => {
                            e.stopPropagation();
                            increaseItem(product.id, product.unit);
                          }}
                        >
                          <Ionicons name="add" size={16} color="#1E293B" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{product.rating}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: ITEM_WIDTH,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  inCartBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(34, 197, 94, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  inCartText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
    minHeight: 36,
  },
  productUnit: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
  },
  originalPrice: {
    fontSize: 12,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },

  // ✅ NEW QTY STYLES
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    paddingHorizontal: 10,
    minWidth: 24,
    textAlign: "center",
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
});
