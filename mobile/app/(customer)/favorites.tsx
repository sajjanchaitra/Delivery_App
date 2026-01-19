// Create: app/(customer)/favorites.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type FavoriteProduct = {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  rating: number;
  discount: number;
  inStock: boolean;
};

const favoriteProducts: FavoriteProduct[] = [
  {
    id: "1",
    name: "Basmati Rice",
    price: 599,
    unit: "5 kg",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300",
    rating: 4.5,
    discount: 10,
    inStock: true,
  },
  {
    id: "2",
    name: "Fresh Tomatoes",
    price: 60,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1546470427-e26264959c0e?w=300",
    rating: 4.6,
    discount: 0,
    inStock: true,
  },
  {
    id: "3",
    name: "Fresh Milk",
    price: 60,
    unit: "1 L",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",
    rating: 4.7,
    discount: 0,
    inStock: false,
  },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>(favoriteProducts);

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter(item => item.id !== id));
  };

  const handleProductPress = (product: FavoriteProduct) => {
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
      }
    });
  };

  const renderProduct = ({ item }: { item: FavoriteProduct }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.8}
      onPress={() => handleProductPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      
      {item.discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount}% OFF</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.favoriteButton}
        activeOpacity={0.7}
        onPress={() => removeFavorite(item.id)}
      >
        <Ionicons name="heart" size={20} color="#EF4444" />
      </TouchableOpacity>

      {!item.inStock && (
        <View style={styles.outOfStockOverlay}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productUnit}>{item.unit}</Text>
        
        <View style={styles.productFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>₹{item.price}</Text>
            {item.discount > 0 && (
              <Text style={styles.originalPrice}>
                ₹{Math.round(item.price / (1 - item.discount / 100))}
              </Text>
            )}
          </View>
          
          {item.inStock && (
            <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{favorites.length}</Text>
        </View>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={100} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Add items to your favorites to see them here
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            activeOpacity={0.8}
            onPress={() => router.push("/(customer)/home")}
          >
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: "100%",
    height: 150,
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
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    fontSize: 14,
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
    textAlign: "center",
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
});