// Create: app/(customer)/search.tsx
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type SearchResult = {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  rating: number;
  category: string;
};

const allProducts: SearchResult[] = [
  {
    id: "1",
    name: "Basmati Rice",
    price: 599,
    unit: "5 kg",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300",
    rating: 4.5,
    category: "Grocery",
  },
  {
    id: "2",
    name: "Fresh Tomatoes",
    price: 60,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1546470427-e26264959c0e?w=300",
    rating: 4.6,
    category: "Vegetables",
  },
  {
    id: "3",
    name: "Fresh Milk",
    price: 60,
    unit: "1 L",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",
    rating: 4.7,
    category: "Dairy",
  },
  {
    id: "4",
    name: "Wheat Flour",
    price: 299,
    unit: "5 kg",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
    rating: 4.3,
    category: "Grocery",
  },
  {
    id: "5",
    name: "Fresh Bread",
    price: 40,
    unit: "500 g",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
    rating: 4.6,
    category: "Food",
  },
];

const recentSearches = ["Rice", "Milk", "Bread", "Tomatoes"];
const popularSearches = ["Vegetables", "Dairy Products", "Snacks", "Beverages"];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const handleProductPress = (product: SearchResult) => {
    router.push({
      pathname: "/(customer)/product-details",
      params: {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        productUnit: product.unit,
        productImage: product.image,
        productRating: product.rating,
        productDiscount: 0,
      }
    });
  };

  const renderProduct = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.8}
      onPress={() => handleProductPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, categories..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {!isSearching ? (
        <View style={styles.suggestionsContainer}>
          {/* Recent Searches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <View style={styles.tagsContainer}>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  activeOpacity={0.7}
                  onPress={() => handleSearch(search)}
                >
                  <Ionicons name="time-outline" size={16} color="#64748B" />
                  <Text style={styles.tagText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Popular Searches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <View style={styles.tagsContainer}>
              {popularSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  activeOpacity={0.7}
                  onPress={() => handleSearch(search)}
                >
                  <Ionicons name="trending-up-outline" size={16} color="#22C55E" />
                  <Text style={styles.tagText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          {searchResults.length > 0 ? (
            <>
              <Text style={styles.resultsText}>
                {searchResults.length} results found
              </Text>
              <FlatList
                data={searchResults}
                renderItem={renderProduct}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>
                Try searching with different keywords
              </Text>
            </View>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
  },
  suggestionsContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tagText: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: "cover",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
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
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
});