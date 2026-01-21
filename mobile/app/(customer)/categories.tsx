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
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = (width - 52) / 2;
const API_URL = "http://13.203.206.134:5000";

interface Category {
  _id?: string;
  id: string;
  name: string;
  image?: string | null;
  itemCount?: number;
}

interface Product {
  _id: string;
  name: string;
  images?: string[];
  price: number;
  discountPrice?: number;
  salePrice?: number;
  quantity?: number;
  unit?: string;
  inStock?: boolean;
  category?: string;
  store?: {
    _id: string;
    name: string;
    isOpen?: boolean;
  };
}

type SortOption = "newest" | "price-low" | "price-high" | "popular";

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const initialCategoryId = params.categoryId as string | undefined;
  const initialCategoryName = params.categoryName as string | undefined;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryName || "All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortModal, setShowSortModal] = useState(false);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset and fetch products when category or sort changes
    setPage(1);
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, true);
  }, [selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/customer/categories`, { headers });
      const data = await response.json();

      if (data.success && data.categories) {
        // Add "All" category at the beginning
        const allCategories = [
          { id: "all", name: "All", itemCount: 0 },
          ...data.categories,
        ];
        setCategories(allCategories);

        // Calculate total items for "All" category
        const totalItems = data.categories.reduce(
          (acc: number, cat: Category) => acc + (cat.itemCount || 0),
          0
        );
        allCategories[0].itemCount = totalItems;
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const token = await AsyncStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
        sort: sortBy === "newest" ? "createdAt" : sortBy,
      });

      if (selectedCategory && selectedCategory !== "All") {
        queryParams.append("category", selectedCategory);
      }

      const response = await fetch(
        `${API_URL}/api/customer/products?${queryParams.toString()}`,
        { headers }
      );
      const data = await response.json();

      if (data.success && data.products) {
        if (reset || pageNum === 1) {
          setProducts(data.products);
        } else {
          setProducts((prev) => [...prev, ...data.products]);
        }

        setTotalProducts(data.pagination?.total || data.products.length);
        setHasMore(
          data.pagination 
            ? pageNum < data.pagination.pages 
            : data.products.length === 20
        );
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(page + 1);
    }
  };

  const addToCart = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert(
          "Login Required",
          "Please login to add items to cart",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Login", onPress: () => router.push("/(auth)/login" as any) },
          ]
        );
        return;
      }

      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", `${product.name} added to cart!`);
      } else {
        Alert.alert("Error", data.message || data.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add to cart");
    }
  };

  const getSortLabel = (sort: SortOption): string => {
    switch (sort) {
      case "newest":
        return "Newest";
      case "price-low":
        return "Price: Low to High";
      case "price-high":
        return "Price: High to Low";
      case "popular":
        return "Most Popular";
      default:
        return "Newest";
    }
  };

  const renderProductCard = ({ item: product }: { item: Product }) => {
    const finalPrice = product.discountPrice || product.salePrice || product.price;
    const hasDiscount = product.discountPrice || product.salePrice;
    const discountPercent = hasDiscount
      ? Math.round(((product.price - finalPrice) / product.price) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: "/(customer)/product-details",
            params: { productId: product._id },
          } as any)
        }
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{
              uri: product.images?.[0] || "https://via.placeholder.com/150",
            }}
            style={styles.productImage}
          />
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
          {product.inStock === false && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          {product.store && (
            <Text style={styles.storeName} numberOfLines={1}>
              {product.store.name}
            </Text>
          )}
          {product.unit && (
            <Text style={styles.productUnit}>
              {product.quantity} {product.unit}
            </Text>
          )}

          <View style={styles.productFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>₹{finalPrice}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>₹{product.price}</Text>
              )}
            </View>

            {product.inStock !== false && (
              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#22C55E" />
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>
          {selectedCategory === "All" ? "All Products" : selectedCategory}
        </Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push("/(customer)/cart" as any)}
        >
          <Ionicons name="cart-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category.id || category._id || index}
              style={[
                styles.categoryChip,
                selectedCategory === category.name && styles.categoryChipActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.name && styles.categoryChipTextActive,
                ]}
              >
                {category.name}
              </Text>
              {category.itemCount !== undefined && category.itemCount > 0 && (
                <Text
                  style={[
                    styles.categoryCount,
                    selectedCategory === category.name && styles.categoryCountActive,
                  ]}
                >
                  ({category.itemCount})
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort & Filter Bar */}
      <View style={styles.filterBar}>
        <Text style={styles.resultsText}>
          {totalProducts} {totalProducts === 1 ? "Product" : "Products"}
        </Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={18} color="#64748B" />
          <Text style={styles.sortButtonText}>{getSortLabel(sortBy)}</Text>
          <Ionicons name="chevron-down" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptyText}>
            {selectedCategory === "All"
              ? "No products available at the moment"
              : `No products in ${selectedCategory} category`}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => setSelectedCategory("All")}
          >
            <Text style={styles.browseButtonText}>Browse All Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#22C55E"]}
              tintColor="#22C55E"
            />
          }
        />
      )}

      {/* Sort Modal */}
      {showSortModal && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortModal}>
            <Text style={styles.sortModalTitle}>Sort By</Text>
            {(["newest", "price-low", "price-high", "popular"] as SortOption[]).map(
              (option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.sortOption}
                  onPress={() => {
                    setSortBy(option);
                    setShowSortModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option && styles.sortOptionTextActive,
                    ]}
                  >
                    {getSortLabel(option)}
                  </Text>
                  {sortBy === option && (
                    <Ionicons name="checkmark" size={20} color="#22C55E" />
                  )}
                </TouchableOpacity>
              )
            )}
          </View>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
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
  },
  categorySection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#22C55E",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  categoryCount: {
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 4,
  },
  categoryCountActive: {
    color: "#DCFCE7",
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  resultsText: {
    fontSize: 14,
    color: "#64748B",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: "#22C55E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  productsList: {
    padding: 16,
    paddingBottom: 100,
  },
  productRow: {
    justifyContent: "space-between",
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  outOfStockOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 6,
    alignItems: "center",
  },
  outOfStockText: {
    fontSize: 11,
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
  storeName: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
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
    gap: 4,
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sortModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#64748B",
  },
  sortOptionTextActive: {
    color: "#22C55E",
    fontWeight: "600",
  },
});