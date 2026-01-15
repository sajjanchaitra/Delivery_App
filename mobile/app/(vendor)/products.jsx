import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const dummyProducts = [
  {
    id: "1",
    name: "Fresh Tomatoes",
    category: "vegetables",
    price: 40,
    discountPrice: 35,
    quantity: "1",
    unit: "kg",
    inStock: true,
    image: "https://images.unsplash.com/photo-1546470427-227c7369a9b0?w=200",
  },
  {
    id: "2",
    name: "Organic Bananas",
    category: "fruits",
    price: 60,
    discountPrice: null,
    quantity: "12",
    unit: "pcs",
    inStock: true,
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200",
  },
  {
    id: "3",
    name: "Fresh Milk",
    category: "dairy",
    price: 65,
    discountPrice: 58,
    quantity: "1",
    unit: "L",
    inStock: false,
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200",
  },
  {
    id: "4",
    name: "Brown Eggs",
    category: "dairy",
    price: 80,
    discountPrice: null,
    quantity: "12",
    unit: "pcs",
    inStock: true,
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200",
  },
  {
    id: "5",
    name: "Whole Wheat Bread",
    category: "bakery",
    price: 45,
    discountPrice: 40,
    quantity: "1",
    unit: "pack",
    inStock: true,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200",
  },
];

const categories = [
  { id: "all", label: "All" },
  { id: "vegetables", label: "Vegetables" },
  { id: "fruits", label: "Fruits" },
  { id: "dairy", label: "Dairy" },
  { id: "bakery", label: "Bakery" },
];

export default function Products() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState(dummyProducts);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleStock = (productId) => {
    setProducts(
      products.map((p) =>
        p.id === productId ? { ...p, inStock: !p.inStock } : p
      )
    );
  };

  const deleteProduct = (productId) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setProducts(products.filter((p) => p.id !== productId));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(vendor)/add-product")}
        >
          <Ionicons name="add" size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.id && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>{filteredProducts.length} Products</Text>
      </View>

      {/* Products List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? "Try a different search term" : "Add your first product"}
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image source={{ uri: product.image }} style={styles.productImage} />
              
              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={[styles.stockBadge, !product.inStock && styles.stockBadgeOut]}>
                    <Text style={[styles.stockText, !product.inStock && styles.stockTextOut]}>
                      {product.inStock ? "In Stock" : "Out"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.productQuantity}>
                  {product.quantity} {product.unit}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{product.discountPrice || product.price}</Text>
                  {product.discountPrice && (
                    <Text style={styles.originalPrice}>₹{product.price}</Text>
                  )}
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.stockBtn]}
                    onPress={() => toggleStock(product.id)}
                  >
                    <Ionicons
                      name={product.inStock ? "pause" : "play"}
                      size={16}
                      color={product.inStock ? "#F59E0B" : "#22C55E"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => router.push(`/(vendor)/edit-product?id=${product.id}`)}
                  >
                    <Ionicons name="pencil" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => deleteProduct(product.id)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => router.push("/(vendor)/add-product")}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
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
    backgroundColor: "#FFF",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    marginLeft: 10,
  },
  categoriesScroll: {
    marginTop: 16,
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  categoryChipTextActive: {
    color: "#FFF",
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  stockBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeOut: {
    backgroundColor: "#FEE2E2",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  stockTextOut: {
    color: "#DC2626",
  },
  productQuantity: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  originalPrice: {
    fontSize: 13,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  stockBtn: {
    backgroundColor: "#FEF3C7",
  },
  editBtn: {
    backgroundColor: "#DBEAFE",
  },
  deleteBtn: {
    backgroundColor: "#FEE2E2",
  },
  floatingBtn: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});