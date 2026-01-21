// app/(customer)/store-products.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 56) / 2;
const API_URL = "http://13.203.206.134:5000";

export default function StoreProducts() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.storeId as string;
  const storeName = params.storeName as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, [storeId, selectedCategory]);

  const fetchProducts = async () => {
    try {
      let url = `${API_URL}/api/customer/stores/${storeId}/products?limit=50`;
      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        
        // Extract unique categories
        const uniqueCategories = [
          "all",
          ...new Set(data.products.map((p: any) => p.category)),
        ];
        setCategories(uniqueCategories as string[]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
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
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{storeName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Filter */}
      {categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category &&
                    styles.categoryChipTextActive,
                ]}
              >
                {category === "all" ? "All" : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.resultText}>
          {products.length} Products Found
        </Text>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.productCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(customer)/product-details",
                    params: {
                      productId: product._id,
                    },
                  })
                }
              >
                <View style={styles.productImageContainer}>
                  <Image
                    source={{
                      uri:
                        product.images?.[0] ||
                        "https://via.placeholder.com/150",
                    }}
                    style={styles.productImage}
                  />
                  {product.discountPrice && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {Math.round(
                          ((product.price - product.discountPrice) /
                            product.price) *
                            100
                        )}
                        % OFF
                      </Text>
                    </View>
                  )}
                  {!product.inStock && (
                    <View style={styles.outOfStockOverlay}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productUnit}>
                    {product.quantity} {product.unit}
                  </Text>
                  <View style={styles.productFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.productPrice}>
                        ₹{product.discountPrice || product.price}
                      </Text>
                      {product.discountPrice && (
                        <Text style={styles.originalPrice}>
                          ₹{product.price}
                        </Text>
                      )}
                    </View>
                    {product.inStock && (
                      <TouchableOpacity
                        style={styles.addButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
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
  categoryFilter: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  resultText: {
    fontSize: 14,
    color: "#64748B",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  productCard: {
    width: ITEM_WIDTH,
    marginBottom: 16,
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
    height: 140,
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
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
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
});